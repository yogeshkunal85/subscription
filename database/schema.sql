-- ============================================================
-- Subscription & Renewal Reminder System
-- schema.sql — production-quality DDL
-- ============================================================

-- Drop in reverse dependency order so FK constraints are satisfied
DROP TABLE IF EXISTS reminders;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS users;

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE users (
    id         INT           NOT NULL AUTO_INCREMENT,
    name       VARCHAR(100)  NOT NULL,
    email      VARCHAR(150)  NOT NULL,
    created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_user_email (email)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: subscriptions
-- ============================================================
CREATE TABLE subscriptions (
    id                INT            NOT NULL AUTO_INCREMENT,
    user_id           INT            NOT NULL,
    name              VARCHAR(150)   NOT NULL,
    amount            DECIMAL(10, 2) NOT NULL,
    currency          VARCHAR(10)    NOT NULL DEFAULT 'INR',
    billing_cycle     ENUM('monthly', 'yearly', 'custom') NOT NULL,
    next_renewal_date DATE           NOT NULL,
    status            ENUM('active', 'cancelled', 'expired') NOT NULL DEFAULT 'active',
    created_at        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_sub_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- Speeds up "SELECT * FROM subscriptions WHERE user_id = ?" —
-- used on the user dashboard and in JOIN queries.
CREATE INDEX idx_sub_user
    ON subscriptions (user_id);

-- Speeds up filtering by lifecycle state
-- (e.g., show only active or only cancelled subscriptions).
CREATE INDEX idx_sub_status
    ON subscriptions (status);

-- Enables efficient date-range scans by the renewal cron job
-- (e.g., WHERE next_renewal_date BETWEEN today AND today+7).
CREATE INDEX idx_sub_renewal
    ON subscriptions (next_renewal_date);

-- Composite index for the primary cron query:
--   WHERE status = 'active' AND next_renewal_date <= ?
-- MySQL uses the leading column (status) to narrow the set first,
-- then evaluates next_renewal_date within that subset — far cheaper
-- than two separate single-column index merges.
CREATE INDEX idx_sub_status_renewal
    ON subscriptions (status, next_renewal_date);

-- ============================================================
-- TABLE: reminders
-- ============================================================
CREATE TABLE reminders (
    id              INT       NOT NULL AUTO_INCREMENT,
    subscription_id INT       NOT NULL,
    remind_on       DATE      NOT NULL,
    status          ENUM('pending', 'sent') NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    -- Idempotency guarantee: INSERT IGNORE will silently skip a
    -- duplicate (subscription_id, remind_on) pair on cron re-runs,
    -- preventing double-notifications without needing a SELECT first.
    UNIQUE KEY uq_reminder_cycle (subscription_id, remind_on),

    CONSTRAINT fk_rem_subscription
        FOREIGN KEY (subscription_id) REFERENCES subscriptions (id)
        ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- Speeds up "fetch all reminders for a given subscription"
-- (JOIN / WHERE subscription_id = ?).
CREATE INDEX idx_rem_subscription
    ON reminders (subscription_id);

-- Speeds up the notification cron's query:
--   WHERE status = 'pending' AND remind_on <= CURDATE()
CREATE INDEX idx_rem_status
    ON reminders (status);
