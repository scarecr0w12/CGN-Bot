-- MariaDB Migration: Add missing user profile and game columns
-- Fixes: Unknown column 'primary_profile', 'game_activity', 'game_tracking' in 'INSERT INTO'

ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `primary_profile` JSON DEFAULT NULL AFTER `extension_earnings`;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `game_activity` JSON DEFAULT NULL AFTER `primary_profile`;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `game_tracking` JSON DEFAULT NULL AFTER `game_activity`;
