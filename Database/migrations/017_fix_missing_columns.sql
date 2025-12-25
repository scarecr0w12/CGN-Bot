-- Migration: Fix missing columns and tables
-- Fixes: game_sessions (servers), referrals (users), vote_reward_transactions (table)

-- Add game_sessions column to servers table
ALTER TABLE servers ADD COLUMN IF NOT EXISTS game_sessions LONGTEXT DEFAULT NULL;

-- Add referrals column to users table  
ALTER TABLE users ADD COLUMN IF NOT EXISTS referrals LONGTEXT DEFAULT NULL;

-- Add tickets column to servers table (if missing)
ALTER TABLE servers ADD COLUMN IF NOT EXISTS tickets LONGTEXT DEFAULT NULL;

-- Create vote_reward_transactions table if it doesn't exist
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
