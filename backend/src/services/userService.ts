import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import pool from '../config/db';
import { User } from '../types';

export async function createUser(name: string, email: string): Promise<User> {
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

export async function getUserById(id: number): Promise<User | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM users WHERE id = ?',
    [id],
  );

  return rows.length > 0 ? (rows[0] as User) : null;
}
