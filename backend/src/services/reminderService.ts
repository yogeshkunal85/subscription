import { RowDataPacket } from 'mysql2/promise';
import pool from '../config/db';

export interface EnrichedReminder {
  id: number;
  subscription_id: number;
  remind_on: Date;
  status: string;
  created_at: Date;
  subscription_name: string;
  amount: number;
  currency: string;
  user_email: string;
  user_name: string;
}

export async function getUpcomingReminders(days: number): Promise<EnrichedReminder[]> {
  const sql = `
    SELECT
      r.id,
      r.subscription_id,
      r.remind_on,
      r.status,
      r.created_at,
      s.name  AS subscription_name,
      s.amount,
      s.currency,
      u.email AS user_email,
      u.name  AS user_name
    FROM reminders r
    JOIN subscriptions s ON r.subscription_id = s.id
    JOIN users        u ON s.user_id = u.id
    WHERE r.remind_on BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
      AND r.status IN ('pending', 'sent')
    ORDER BY r.remind_on ASC
  `;

  const [rows] = await pool.query<RowDataPacket[]>(sql, [days]);
  return rows as EnrichedReminder[];
}
