-- MariaDB Migration: Fix Gallery Schema
-- Adds missing 'level' column and renames 'upvotes' to 'points'

-- Add the missing 'level' column
ALTER TABLE `gallery` 
ADD COLUMN IF NOT EXISTS `level` VARCHAR(32) DEFAULT 'gallery' AFTER `state`;

-- Add index for level column (skip IF NOT EXISTS for compatibility)
CREATE INDEX IF NOT EXISTS `idx_gallery_level` ON `gallery` (`level`);

-- Add points column if it doesn't exist
ALTER TABLE `gallery`
ADD COLUMN IF NOT EXISTS `points` INT DEFAULT 0;

-- Add versions column if it doesn't exist (should be JSON array)
ALTER TABLE `gallery`
ADD COLUMN IF NOT EXISTS `versions` JSON DEFAULT NULL AFTER `published_version`;

-- Note: If you need to rename 'upvotes' to 'points', run manually:
-- ALTER TABLE gallery CHANGE COLUMN upvotes points INT DEFAULT 0;
