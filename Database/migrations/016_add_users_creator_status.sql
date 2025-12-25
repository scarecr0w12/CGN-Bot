-- MariaDB Migration: Add creator_status column to users table
-- Fixes: Unknown column 'creator_status' in 'WHERE'

ALTER TABLE `users` ADD COLUMN `creator_status` JSON DEFAULT NULL AFTER `notes`;
