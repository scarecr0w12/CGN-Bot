-- MariaDB Migration: Add subscription support to servers table
-- Premium subscriptions are per-server, not per-user
-- Run: mysql -u root -p skynet < Database/migrations/002_add_server_subscription.sql

SET NAMES utf8mb4;

-- Add subscription column to servers table (JSON to store subscription data)
ALTER TABLE `servers` 
ADD COLUMN IF NOT EXISTS `subscription` JSON DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `payment_ids` JSON DEFAULT NULL;

-- Add indexes for subscription queries
ALTER TABLE `servers`
ADD INDEX IF NOT EXISTS `idx_servers_subscription_tier` ((CAST(subscription->>'$.tier_id' AS CHAR(64)))),
ADD INDEX IF NOT EXISTS `idx_servers_subscription_active` ((CAST(subscription->>'$.is_active' AS UNSIGNED)));

-- Show the updated table structure
DESCRIBE `servers`;
