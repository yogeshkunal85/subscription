import mysql from 'mysql2/promise';
import config from './env';

const pool = mysql.createPool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  port: config.db.port,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  timezone: '+00:00',
});

pool
  .getConnection()
  .then((conn) => {
    console.log('[DB] Connection pool established successfully');
    conn.release();
  })
  .catch((err: Error) => {
    console.error('[DB] Failed to establish connection pool:', err.message);
    process.exit(1);
  });

export default pool;
