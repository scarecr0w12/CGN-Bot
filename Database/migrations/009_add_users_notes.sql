-- MariaDB Migration: Add notes column to users table
-- Fixes: Unknown column 'notes' in 'INSERT INTO'

ALTER TABLE `users` ADD COLUMN `notes` JSON DEFAULT NULL AFTER `reminders`;
