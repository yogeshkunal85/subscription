import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import pool from '../config/db';
import config from '../config/env';
import { BillingCycle } from '../types';

interface SubscriptionRow {
  id: number;
  user_id: number;
  name: string;
  amount: number;
  currency: string;
  billing_cycle: BillingCycle;
  next_renewal_date: string;
  status: string;
  user_email: string;
  user_name: string;
}

interface PastDueRow {
  id: number;
  name: string;
  billing_cycle: BillingCycle;
  next_renewal_date: string;
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0] as string;
}

/**
 * STEP 1 — Create and immediately mark reminders for upcoming renewals.
 *
 * INSERT IGNORE + UNIQUE(subscription_id, remind_on) guarantees idempotency:
 * re-running the job never produces duplicate reminders regardless of timing.
 */
async function createUpcomingReminders(): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT s.*, u.email AS user_email, u.name AS user_name
     FROM subscriptions s
     JOIN users u ON s.user_id = u.id
     WHERE s.status = 'active'
       AND s.next_renewal_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
       AND s.next_renewal_date >= CURDATE()`,
    [config.reminderDays],
  );

  const subscriptions = rows as SubscriptionRow[];

  for (const sub of subscriptions) {
    const remindOn = formatDate(sub.next_renewal_date);

    // INSERT IGNORE: silently skips if UNIQUE(subscription_id, remind_on) is already satisfied
    const [insertResult] = await pool.query<ResultSetHeader>(
      `INSERT IGNORE INTO reminders (subscription_id, remind_on, status)
       VALUES (?, ?, 'pending')`,
      [sub.id, remindOn],
    );

    if (insertResult.affectedRows > 0) {
      console.log(
        `[CRON] Reminder: "${sub.name}" renews on ${remindOn} for user ${sub.user_email}`,
      );

      // Simulate sending the email notification by marking reminder as sent
      await pool.query<ResultSetHeader>(
        `UPDATE reminders SET status = 'sent'
         WHERE subscription_id = ? AND remind_on = ?`,
        [sub.id, remindOn],
      );
    } else {
      console.log(`[CRON] Skipped duplicate reminder for "${sub.name}"`);
    }
  }
}

/**
 * STEP 2 — Advance or expire past-due subscriptions.
 *
 * Idempotency: once a date is advanced, next_renewal_date < CURDATE() no longer
 * matches, so re-running the job within the same day is a no-op.
 *
 * Known limitation: if the server was down for multiple billing cycles, only one
 * DATE_ADD is applied per run. A production fix would use TIMESTAMPDIFF to
 * calculate the exact number of missed cycles and advance accordingly.
 */
async function advancePastDueSubscriptions(): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, billing_cycle, next_renewal_date
     FROM subscriptions
     WHERE status = 'active'
       AND next_renewal_date < CURDATE()`,
  );

  const pastDue = rows as PastDueRow[];

  for (const sub of pastDue) {
    if (sub.billing_cycle === 'monthly') {
      const [result] = await pool.query<ResultSetHeader>(
        `UPDATE subscriptions
         SET next_renewal_date = DATE_ADD(next_renewal_date, INTERVAL 1 MONTH),
             updated_at        = NOW()
         WHERE id = ?`,
        [sub.id],
      );

      if (result.affectedRows > 0) {
        // Re-fetch to log the new date accurately
        const [updated] = await pool.query<RowDataPacket[]>(
          'SELECT next_renewal_date FROM subscriptions WHERE id = ?',
          [sub.id],
        );
        const newDate = formatDate((updated[0] as { next_renewal_date: string }).next_renewal_date);
        console.log(`[CRON] Advanced "${sub.name}" renewal to ${newDate}`);
      }
    } else if (sub.billing_cycle === 'yearly') {
      const [result] = await pool.query<ResultSetHeader>(
        `UPDATE subscriptions
         SET next_renewal_date = DATE_ADD(next_renewal_date, INTERVAL 1 YEAR),
             updated_at        = NOW()
         WHERE id = ?`,
        [sub.id],
      );

      if (result.affectedRows > 0) {
        const [updated] = await pool.query<RowDataPacket[]>(
          'SELECT next_renewal_date FROM subscriptions WHERE id = ?',
          [sub.id],
        );
        const newDate = formatDate((updated[0] as { next_renewal_date: string }).next_renewal_date);
        console.log(`[CRON] Advanced "${sub.name}" renewal to ${newDate}`);
      }
    } else {
      // billing_cycle = 'custom' — no automatic advance rule; expire it
      await pool.query<ResultSetHeader>(
        `UPDATE subscriptions
         SET status     = 'expired',
             updated_at = NOW()
         WHERE id = ?`,
        [sub.id],
      );
      console.log(`[CRON] Expired "${sub.name}" (custom billing cycle)`);
    }
  }
}

export async function runRenewalJob(): Promise<void> {
  const timestamp = new Date().toISOString();
  console.log(`[CRON] START — ${timestamp}`);

  try {
    await createUpcomingReminders();
    await advancePastDueSubscriptions();
  } catch (err) {
    console.error('[CRON] ERROR during renewal job:', err);
  }

  console.log(`[CRON] DONE  — ${new Date().toISOString()}`);
}

export function scheduleRenewalJob(cronExpression: string): void {
  // Dynamic import keeps node-cron out of the module graph until the job is
  // explicitly scheduled, making manual / test calls to runRenewalJob() cheap.
  import('node-cron').then(({ default: cron }) => {
    cron.schedule(cronExpression, () => {
      runRenewalJob().catch((err: Error) => {
        console.error('[CRON] Unhandled error in renewal job:', err.message);
      });
    });
    console.log(`[CRON] Renewal job scheduled with expression: "${cronExpression}"`);
  });
}
