-- MariaDB Migration: Add subscription support to servers table
-- Premium subscriptions are per-server, not per-user
-- Run: mysql -u root -p skynet < Database/migrations/002_add_server_subscription.sql

SET NAMES utf8mb4;

-- Add subscription column to servers table (JSON to store subscription data)
ALTER TABLE `servers` 
ADD COLUMN IF NOT EXISTS `subscription` JSON DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `payment_ids` JSON DEFAULT NULL;

-- Note: Functional indexes on JSON fields are not supported in all MariaDB versions
-- If needed, these can be added manually on compatible versions:
-- CREATE INDEX idx_servers_subscription_tier ON servers ((CAST(subscription->>'$.tier_id' AS CHAR(64))));
-- CREATE INDEX idx_servers_subscription_active ON servers ((CAST(subscription->>'$.is_active' AS UNSIGNED)));

-- Show the updated table structure
DESCRIBE `servers`;
