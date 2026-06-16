import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import pool from '../config/db';
import { AppError, User } from '../types';

export async function getUserByEmail(email: string): Promise<User | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM users WHERE email = ?',
    [email],
  );

  return rows.length > 0 ? (rows[0] as User) : null;
}

export async function createUser(name: string, email: string): Promise<User> {
  const existing = await getUserByEmail(email);
  if (existing) {
    const err: AppError = {
      status: 409,
      code: 'CONFLICT',
      message: 'A user with this email already exists.',
    };
    throw err;
  }

  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO users (name, email) VALUES (?, ?)',
    [name, email],
  );

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM users WHERE id = ?',
    [result.insertId],
  );

  return rows[0] as User;
}

export async function getAllUsers(): Promise<User[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM users ORDER BY name ASC',
  );
  return rows as User[];
}

export async function getUserById(id: number): Promise<User | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM users WHERE id = ?',
    [id],
  );

  return rows.length > 0 ? (rows[0] as User) : null;
}
