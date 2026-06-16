import dotenv from 'dotenv';

dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    console.error(`[ENV] Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return value;
}

function optional(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

function optionalNumber(key: string, defaultValue: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return defaultValue;
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) {
    console.error(`[ENV] ${key} must be a valid integer, got: "${raw}"`);
    process.exit(1);
  }
  return parsed;
}

const config = {
  db: {
    host: required('DB_HOST'),
    user: required('DB_USER'),
    password: optional('DB_PASSWORD', ''),
    database: required('DB_NAME'),
    port: optionalNumber('DB_PORT', 3306),
  },
  cron: {
    schedule: optional('CRON_SCHEDULE', '0 9 * * *'),
  },
  reminderDays: optionalNumber('REMINDER_DAYS', 7),
  port: optionalNumber('PORT', 3000),
  nodeEnv: optional('NODE_ENV', 'development'),
  corsOrigin: optional('CORS_ORIGIN', '*'),
} as const;

export default config;
