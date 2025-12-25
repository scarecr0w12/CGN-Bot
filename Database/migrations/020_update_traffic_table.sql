-- Migration: Update traffic table for detailed request logging
-- Date: 2025-12-17
-- Adds columns for detailed per-request logging alongside aggregate stats

-- Change _id from VARCHAR(64) to support both numeric timestamps and string IDs
ALTER TABLE traffic MODIFY COLUMN _id VARCHAR(64) NOT NULL;

-- Add type column to distinguish aggregate vs request records
ALTER TABLE traffic ADD COLUMN IF NOT EXISTS type ENUM('aggregate', 'request') DEFAULT 'aggregate';

-- Add columns for aggregate stats (may already exist with different types)
ALTER TABLE traffic ADD COLUMN IF NOT EXISTS pageViews INT DEFAULT 0;
ALTER TABLE traffic ADD COLUMN IF NOT EXISTS authViews INT DEFAULT 0;
ALTER TABLE traffic ADD COLUMN IF NOT EXISTS uniqueUsers INT DEFAULT 0;

-- Add/update columns for detailed request logging
ALTER TABLE traffic ADD COLUMN IF NOT EXISTS user_id VARCHAR(64) DEFAULT NULL;
ALTER TABLE traffic ADD COLUMN IF NOT EXISTS session_id VARCHAR(128) DEFAULT NULL;
ALTER TABLE traffic ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT NULL;

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_traffic_type ON traffic(type);
CREATE INDEX IF NOT EXISTS idx_traffic_user_id ON traffic(user_id);
CREATE INDEX IF NOT EXISTS idx_traffic_ip_hash ON traffic(ip_hash);

-- Note: The following columns should already exist from 001_initial_schema.sql:
-- timestamp, path, method, status_code, response_time, user_agent, ip_hash, referrer
