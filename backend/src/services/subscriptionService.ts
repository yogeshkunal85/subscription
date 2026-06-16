import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import pool from '../config/db';
import { AppError, Subscription, Reminder, ListParams, BillingCycle } from '../types';
import { getUserById } from './userService';

interface SubscriptionWithReminders extends Subscription {
  reminders: Reminder[];
}

interface CreateSubscriptionInput {
  user_id: number;
  name: string;
  amount: number;
  currency: string;
  billing_cycle: BillingCycle;
  next_renewal_date: string;
}

type UpdateSubscriptionInput = Partial<CreateSubscriptionInput>;

interface ListResult {
  data: Subscription[];
  total: number;
}

export async function listSubscriptions(params: ListParams): Promise<ListResult> {
  const { page, limit, status, search } = params;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const values: (string | number)[] = [];
  const countValues: (string | number)[] = [];

  if (status) {
    conditions.push('status = ?');
    values.push(status);
    countValues.push(status);
  }

  if (search) {
    conditions.push('name LIKE ?');
    const pattern = `%${search}%`;
    values.push(pattern);
    countValues.push(pattern);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const dataQuery = `SELECT * FROM subscriptions ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  const countQuery = `SELECT COUNT(*) AS total FROM subscriptions ${whereClause}`;

  const [rows] = await pool.query<RowDataPacket[]>(dataQuery, [...values, limit, offset]);
  const [countRows] = await pool.query<RowDataPacket[]>(countQuery, countValues);

  const total = (countRows[0] as { total: number }).total;

  return { data: rows as Subscription[], total };
}

export async function getSubscriptionById(id: number): Promise<SubscriptionWithReminders | null> {
  const [subRows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM subscriptions WHERE id = ?',
    [id],
  );

  if (subRows.length === 0) return null;

  const subscription = subRows[0] as Subscription;

  const [reminderRows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM reminders WHERE subscription_id = ? ORDER BY remind_on ASC',
    [id],
  );

  return { ...subscription, reminders: reminderRows as Reminder[] };
}

async function getActiveSubscriptionByUserAndName(
  userId: number,
  name: string,
): Promise<Subscription | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM subscriptions
     WHERE user_id = ? AND name = ? AND status = 'active'
     LIMIT 1`,
    [userId, name],
  );

  return rows.length > 0 ? (rows[0] as Subscription) : null;
}

export async function createSubscription(input: CreateSubscriptionInput): Promise<Subscription> {
  const name = input.name.trim();

  const user = await getUserById(input.user_id);
  if (!user) {
    const err: AppError = {
      status: 404,
      code: 'NOT_FOUND',
      message: 'User not found.',
    };
    throw err;
  }

  const duplicate = await getActiveSubscriptionByUserAndName(input.user_id, name);
  if (duplicate) {
    const err: AppError = {
      status: 409,
      code: 'CONFLICT',
      message: 'This user already has an active subscription with this name.',
    };
    throw err;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query<ResultSetHeader>(
      `INSERT INTO subscriptions
         (user_id, name, amount, currency, billing_cycle, next_renewal_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        input.user_id,
        name,
        input.amount,
        input.currency,
        input.billing_cycle,
        input.next_renewal_date,
      ],
    );

    const [rows] = await conn.query<RowDataPacket[]>(
      'SELECT * FROM subscriptions WHERE id = ?',
      [result.insertId],
    );

    await conn.commit();
    return rows[0] as Subscription;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function updateSubscription(
  id: number,
  input: UpdateSubscriptionInput,
): Promise<Subscription | null> {
  const allowedFields: (keyof UpdateSubscriptionInput)[] = [
    'user_id',
    'name',
    'amount',
    'currency',
    'billing_cycle',
    'next_renewal_date',
  ];

  const setClauses: string[] = [];
  const values: (string | number)[] = [];

  for (const field of allowedFields) {
    if (input[field] !== undefined) {
      setClauses.push(`${field} = ?`);
      values.push(input[field] as string | number);
    }
  }

  if (setClauses.length === 0) return getSubscriptionById(id).then((s) => (s ? s : null));

  values.push(id);

  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE subscriptions SET ${setClauses.join(', ')} WHERE id = ?`,
    values,
  );

  if (result.affectedRows === 0) return null;

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM subscriptions WHERE id = ?',
    [id],
  );

  return rows[0] as Subscription;
}

export async function cancelSubscription(id: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE subscriptions SET status = 'cancelled' WHERE id = ?",
    [id],
  );

  return result.affectedRows > 0;
}
