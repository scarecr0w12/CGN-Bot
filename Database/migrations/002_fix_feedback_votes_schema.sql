-- MariaDB Migration: Fix feedback and votes table schema
-- Fixes column mismatches between migration and code

SET NAMES utf8mb4;

-- ============================================
-- FIX FEEDBACK TABLE
-- Add missing columns and rename type -> category
-- ============================================

-- Add missing columns if they don't exist
ALTER TABLE `feedback` 
    ADD COLUMN IF NOT EXISTS `category` VARCHAR(32) DEFAULT 'other',
    ADD COLUMN IF NOT EXISTS `username` VARCHAR(255) DEFAULT '',
    ADD COLUMN IF NOT EXISTS `page_url` VARCHAR(512) DEFAULT '',
    ADD COLUMN IF NOT EXISTS `admin_notes` TEXT DEFAULT NULL;

-- Fix the 'type' column to have a default value (was NOT NULL without default)
ALTER TABLE `feedback` MODIFY COLUMN `type` VARCHAR(32) DEFAULT 'other';

-- Add index for category if not exists
CREATE INDEX IF NOT EXISTS `idx_feedback_category` ON `feedback` (`category`);

-- ============================================
-- FIX VOTES TABLE
-- Add 'site' column that BotLists module expects
-- ============================================

ALTER TABLE `votes`
    ADD COLUMN IF NOT EXISTS `site` VARCHAR(32) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `is_weekend` TINYINT(1) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS `points_awarded` INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS `username` VARCHAR(255) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `avatar` VARCHAR(255) DEFAULT NULL;

-- Add index for site queries
CREATE INDEX IF NOT EXISTS `idx_votes_site` ON `votes` (`site`);
