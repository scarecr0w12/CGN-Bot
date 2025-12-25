-- Migration: Add email column to site_settings table
-- Required for email configuration storage

ALTER TABLE `site_settings` ADD COLUMN IF NOT EXISTS `email` JSON DEFAULT NULL;
