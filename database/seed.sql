-- ============================================================
-- Subscription & Renewal Reminder System
-- seed.sql — realistic development / testing data
--
-- Assumptions:
--   • schema.sql has already been applied.
--   • No reminders are seeded; the cron job generates them.
--   • CURDATE() expressions keep renewal dates accurate whenever
--     this file is re-run, so date arithmetic for cron tests
--     always works relative to "today".
-- ============================================================

-- ============================================================
-- USERS  (3 users)
-- ============================================================
INSERT INTO users (name, email) VALUES
    ('Arjun Sharma',   'arjun.sharma@example.com'),
    ('Priya Nair',     'priya.nair@example.com'),
    ('Rohan Mehta',    'rohan.mehta@example.com');

-- ============================================================
-- SUBSCRIPTIONS  (8 rows)
--
-- Row breakdown:
--   #1  monthly  active  — future renewal (Netflix)
--   #2  monthly  active  — future renewal (Spotify)
--   #3  monthly  active  — future renewal (Amazon Prime)
--   #4  yearly   active  — future renewal (Adobe Creative Cloud)
--   #5  yearly   active  — future renewal (GitHub Pro)
--   #6  monthly  active  — next_renewal_date = CURDATE() - 2  → PAST DUE  (cron test)
--   #7  monthly  active  — next_renewal_date = CURDATE() + 3  → DUE SOON  (reminder trigger test)
--   #8  monthly cancelled — historical record
-- ============================================================
INSERT INTO subscriptions
    (user_id, name, amount, currency, billing_cycle, next_renewal_date, status)
VALUES

-- ── 3 monthly active with future renewal dates ──────────────
(1, 'Netflix',       649.00,  'INR', 'monthly', DATE_ADD(CURDATE(), INTERVAL 12 DAY), 'active'),
(1, 'Spotify',       119.00,  'INR', 'monthly', DATE_ADD(CURDATE(), INTERVAL 20 DAY), 'active'),
(2, 'Amazon Prime',  299.00,  'INR', 'monthly', DATE_ADD(CURDATE(), INTERVAL 8  DAY), 'active'),

-- ── 2 yearly active with future renewal dates ───────────────
(2, 'Adobe Creative Cloud', 54999.00, 'INR', 'yearly', DATE_ADD(CURDATE(), INTERVAL 180 DAY), 'active'),
(3, 'GitHub Pro',            3588.00, 'INR', 'yearly', DATE_ADD(CURDATE(), INTERVAL 90  DAY), 'active'),

-- ── 1 monthly active — past due (next_renewal_date = today - 2) ─
-- Use case: cron should flag this as overdue / trigger immediate reminder.
(3, 'Notion Pro', 330.00, 'INR', 'monthly', DATE_ADD(CURDATE(), INTERVAL -2 DAY), 'active'),

-- ── 1 monthly active — renews in 3 days ─────────────────────
-- Use case: cron should generate a reminder for this subscription.
(1, 'Hotstar Premium', 299.00, 'INR', 'monthly', DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'active'),

-- ── 1 cancelled ─────────────────────────────────────────────
-- Use case: cron must skip cancelled rows (validates status filter).
(2, 'Zoom Pro', 1300.00, 'INR', 'monthly', DATE_ADD(CURDATE(), INTERVAL 15 DAY), 'cancelled');
