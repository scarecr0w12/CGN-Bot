-- Migration: Add Vote Rewards System
-- This migration adds the vote_reward_transactions table and updates users table
-- for the new separate vote rewards point system

-- Create vote_reward_transactions table
CREATE TABLE IF NOT EXISTS vote_reward_transactions (
    _id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    type ENUM('vote', 'purchase', 'redeem_tier', 'redeem_extension', 'admin_grant', 'admin_revoke', 'refund') NOT NULL,
    amount INT NOT NULL,
    balance_after INT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata JSON,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: The users table already stores data as JSON, so the vote_rewards field
-- will be automatically handled by the ORM when reading/writing user documents.
-- No schema change needed for users table as it uses flexible JSON storage.

-- If your users table uses structured columns instead of JSON, uncomment and run:
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS vote_rewards JSON DEFAULT NULL;
