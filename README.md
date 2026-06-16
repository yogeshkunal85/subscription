# Subscription & Renewal Reminder System

A full-stack app for tracking recurring subscriptions and sending renewal reminders.

- **Backend:** Node.js, TypeScript, Express, MySQL (`mysql2/promise`)
- **Frontend:** React 18, TypeScript, Vite, React Router v6, Axios
- **Scheduler:** `node-cron` renewal job (reminders + past-due handling)

```
subscription/
├── database/          # schema.sql + seed.sql
├── backend/           # REST API + cron job
└── client/            # React dashboard
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm | 9+ |
| MySQL | 8.0+ (or MariaDB 10.5+) |

---

## Quick start (clean clone)

### 1. Database

Create the database and load schema + seed data:

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS subscription_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Apply schema and seed (run from repo root)
mysql -u root -p subscription_tracker < database/schema.sql
mysql -u root -p subscription_tracker < database/seed.sql
```

Verify:

```bash
mysql -u root -p subscription_tracker -e "SELECT COUNT(*) AS users FROM users; SELECT COUNT(*) AS subscriptions FROM subscriptions;"
# Expected: 3 users, 8 subscriptions
```

The seed file uses `CURDATE()` for renewal dates, so cron-test rows (past-due, due in 3 days) stay valid whenever you re-run it.

---

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set DB_USER, DB_PASSWORD, etc.
npm install
npm run dev
```

Server starts on **http://localhost:3000**.

Smoke test:

```bash
curl http://localhost:3000/health
curl "http://localhost:3000/api/subscriptions?page=1&limit=5"
```

Production build:

```bash
npm run build
npm start
```

---

### 3. Frontend

In a **second terminal**:

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173**.

Vite proxies `/api` → `http://localhost:3000`, so no extra env setup is needed for local dev (`VITE_API_BASE_URL` can stay empty).

Production build:

```bash
npm run build
npm run preview   # or serve dist/ behind nginx
```

Set `VITE_API_BASE_URL` in `.env.production` to your deployed API URL.

---

### 4. Cron job

The renewal job starts automatically when the backend boots. Default schedule: **every day at 09:00** (`0 9 * * *`).

**Manual trigger (testing):**

```bash
curl -X POST http://localhost:3000/api/jobs/run-renewal
```

Watch backend logs for lines like:

```
[CRON] START — ...
[CRON] Reminder: "Hotstar Premium" renews on 2026-06-19 for user arjun.sharma@example.com
[CRON] Advanced "Notion Pro" renewal to 2026-07-14
[CRON] DONE  — ...
```

**Faster testing** — set a more frequent schedule in `backend/.env`:

```env
CRON_SCHEDULE=*/1 * * * *   # every minute (dev only)
REMINDER_DAYS=7
```

Then restart the backend.

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_HOST` | Yes | — | MySQL host |
| `DB_USER` | Yes | — | MySQL username |
| `DB_PASSWORD` | No | `""` | MySQL password (empty if none) |
| `DB_NAME` | Yes | — | Database name (`subscription_tracker`) |
| `DB_PORT` | No | `3306` | MySQL port |
| `PORT` | No | `3000` | HTTP server port |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `CRON_SCHEDULE` | No | `0 9 * * *` | Cron expression for renewal job |
| `REMINDER_DAYS` | No | `7` | Create reminders for renewals within N days |

Missing required vars cause the process to exit on startup.

### Frontend (`client/.env.local` / `.env.production`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | No | `""` | API base URL. Empty in dev (Vite proxy). Set in production. |

---

## API overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/api/users` | List users |
| `POST` | `/api/users` | Create user |
| `GET` | `/api/subscriptions` | List (pagination, `status`, `search`) |
| `GET` | `/api/subscriptions/:id` | Get one (+ reminders) |
| `POST` | `/api/subscriptions` | Create |
| `PUT` | `/api/subscriptions/:id` | Update |
| `DELETE` | `/api/subscriptions/:id` | Soft-cancel (`status = cancelled`) |
| `GET` | `/api/reminders/upcoming?days=7` | Upcoming reminders |
| `POST` | `/api/jobs/run-renewal` | Manually run cron job |

All responses use a consistent envelope:

```json
{ "success": true, "data": { ... }, "meta": { "page": 1, "limit": 10, "total": 8, "totalPages": 1 } }
```

---

## Database design

### Tables

```
users
  └── subscriptions (FK user_id, ON DELETE CASCADE)
        └── reminders (FK subscription_id, ON DELETE CASCADE)
```

| Table | Purpose |
|-------|---------|
| `users` | Account owners (`email` UNIQUE) |
| `subscriptions` | Recurring charges with billing cycle and renewal date |
| `reminders` | One row per (subscription, remind_on) pair |

**Design choices:**

- **InnoDB + FK cascades** — deleting a user removes subscriptions and reminders; no orphans.
- **`utf8mb4`** — full Unicode support.
- **Soft delete** — `DELETE /api/subscriptions/:id` sets `status = 'cancelled'`; history is kept.
- **`DECIMAL(10,2)`** for amounts — avoids floating-point rounding.
- **`ENUM` for status/cycle** — constrained values at the DB layer.

### Indexing

| Index | Table | Columns | Why |
|-------|-------|---------|-----|
| `uq_user_email` | users | `email` | Uniqueness + fast login/lookup |
| `idx_sub_user` | subscriptions | `user_id` | List subscriptions per user |
| `idx_sub_status` | subscriptions | `status` | Filter active / cancelled / expired |
| `idx_sub_renewal` | subscriptions | `next_renewal_date` | Date-range scans in cron |
| `idx_sub_status_renewal` | subscriptions | `(status, next_renewal_date)` | Cron query: `WHERE status='active' AND next_renewal_date <= ?` |
| `uq_reminder_cycle` | reminders | `(subscription_id, remind_on)` | **Idempotency** — see cron section |
| `idx_rem_subscription` | reminders | `subscription_id` | Fetch reminders for a subscription |
| `idx_rem_status` | reminders | `status` | `WHERE status='pending' AND remind_on <= CURDATE()` |

The composite `(status, next_renewal_date)` index matches the cron’s leading equality on `status`, then range on date — cheaper than merging two single-column indexes.

---

## Cron job: idempotency & missed runs

Each run executes **two steps** in order.

### Step 1 — Create reminders

```sql
SELECT ... FROM subscriptions s
JOIN users u ON s.user_id = u.id
WHERE s.status = 'active'
  AND s.next_renewal_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
  AND s.next_renewal_date >= CURDATE()
```

For each match:

```sql
INSERT IGNORE INTO reminders (subscription_id, remind_on, status)
VALUES (?, renewal_date, 'pending')
```

Then mark as `sent` (simulates email delivery).

**Idempotency:** `UNIQUE(subscription_id, remind_on)` + `INSERT IGNORE` makes duplicate reminders impossible. Re-running the job logs `Skipped duplicate reminder` and does not send twice.

### Step 2 — Advance past-due subscriptions

```sql
SELECT ... WHERE status = 'active' AND next_renewal_date < CURDATE()
```

| `billing_cycle` | Action |
|-----------------|--------|
| `monthly` | `next_renewal_date += 1 MONTH` |
| `yearly` | `next_renewal_date += 1 YEAR` |
| `custom` | `status = 'expired'` |

**Idempotency:** After advancing, `next_renewal_date < CURDATE()` is false, so the same row is not picked again on a second run the same day.

### Missed runs

If the server is down for several days:

- **Reminders:** Subscriptions with `next_renewal_date` still in the future get reminders on the next run (within `REMINDER_DAYS`).
- **Past-due:** Rows with `next_renewal_date < CURDATE()` are still matched and advanced **once per run**.

**Known limitation:** Only **one** billing cycle is advanced per run. If a monthly sub was down for 60 days, one run moves it forward one month, not two. A production fix would use `TIMESTAMPDIFF` to compute missed cycles and loop or batch-advance.

---

## Frontend notes

- Dashboard filters and pagination are stored in the **URL** (`?status=active&search=netflix&page=2`) — survives reload and back/forward.
- Vite dev proxy forwards `/api` to the backend; run both servers locally.
- Create-user modal on the subscription form; user dropdown populated from `GET /api/users`.

---

## Future improvements

Given more time, I would:

1. **Multi-cycle catch-up** — advance past-due subscriptions by the full number of missed billing periods, not just one.
2. **Real email delivery** — replace simulated `sent` status with a queue (BullMQ / SQS) and a provider (SendGrid, SES).
3. **Auth** — JWT or session-based login; remove hardcoded `user_id` on the form.
4. **DB-level uniqueness** — `UNIQUE(user_id, name)` for active subscriptions (currently enforced in application code).
5. **Cron reliability** — run the job from a separate worker or use MySQL advisory locks / a `job_runs` ledger for multi-instance deployments.
6. **Tests** — integration tests for the cron idempotency path and API validation; Vitest for React hooks.
7. **Observability** — structured logging (pino), metrics for reminders sent / subscriptions advanced.
8. **API docs** — OpenAPI/Swagger generated from route schemas.
9. **Docker Compose** — one-command local stack (MySQL + API + client).
10. **Timezone handling** — explicit `TIMEZONE` config; renewal dates stored as `DATE` only (no TZ ambiguity today, but worth documenting for global users).

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `[DB] Failed to establish connection pool` | Check MySQL is running and `.env` credentials are correct |
| Frontend API errors | Ensure backend is on port 3000 and `npm run dev` is running in `client/` |
| Cron does nothing | Call `POST /api/jobs/run-renewal` manually; check seed has subs with `next_renewal_date` near today |
| `VALIDATION_ERROR` on subscription name | Names allow letters, numbers, spaces, and `- ' & . ( )` only — no `<` or `>` |
