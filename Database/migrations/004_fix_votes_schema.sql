-- ============================================
-- FIX VOTES TABLE SCHEMA
-- Updates the votes table to match votesSchema.js for bot list vote tracking
-- ============================================

-- Drop existing votes table and recreate with correct schema
DROP TABLE IF EXISTS `votes`;

CREATE TABLE IF NOT EXISTS `votes` (
    `_id` VARCHAR(128) NOT NULL,
    `user_id` VARCHAR(64) NOT NULL,
    `site` VARCHAR(64) NOT NULL,
    `timestamp` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    `is_weekend` TINYINT(1) DEFAULT 0,
    `points_awarded` INT DEFAULT 0,
    `username` VARCHAR(128) DEFAULT NULL,
    `avatar` VARCHAR(512) DEFAULT NULL,
    PRIMARY KEY (`_id`),
    INDEX `idx_votes_user` (`user_id`),
    INDEX `idx_votes_site` (`site`),
    INDEX `idx_votes_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
