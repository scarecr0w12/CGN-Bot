-- MariaDB Migration: Fix Gallery Schema
-- Adds missing 'level' column and renames 'upvotes' to 'points'

-- Add the missing 'level' column
ALTER TABLE `gallery` 
ADD COLUMN IF NOT EXISTS `level` VARCHAR(32) DEFAULT 'gallery' AFTER `state`;

-- Add index for level column
ALTER TABLE `gallery`
ADD INDEX IF NOT EXISTS `idx_gallery_level` (`level`);

-- Rename upvotes to points if upvotes exists and points doesn't
-- MariaDB doesn't support IF EXISTS for CHANGE COLUMN, so we use a procedure
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS fix_gallery_points()
BEGIN
    DECLARE col_exists INT DEFAULT 0;
    
    -- Check if 'upvotes' column exists
    SELECT COUNT(*) INTO col_exists 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'gallery' 
    AND COLUMN_NAME = 'upvotes';
    
    IF col_exists > 0 THEN
        ALTER TABLE `gallery` CHANGE COLUMN `upvotes` `points` INT DEFAULT 0;
    END IF;
    
    -- Check if 'points' column exists now, if not add it
    SELECT COUNT(*) INTO col_exists 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'gallery' 
    AND COLUMN_NAME = 'points';
    
    IF col_exists = 0 THEN
        ALTER TABLE `gallery` ADD COLUMN `points` INT DEFAULT 0;
    END IF;
END //
DELIMITER ;

CALL fix_gallery_points();
DROP PROCEDURE IF EXISTS fix_gallery_points;

-- Add versions column if it doesn't exist (should be JSON array)
ALTER TABLE `gallery`
ADD COLUMN IF NOT EXISTS `versions` JSON DEFAULT NULL AFTER `published_version`;
