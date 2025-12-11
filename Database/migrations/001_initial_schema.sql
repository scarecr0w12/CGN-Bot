-- MariaDB 10.11 Migration: Initial Schema
-- Generated from MongoDB schemas
-- Run this script to create all tables

-- Character set and collation for proper UTF-8 support
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `users` (
    `_id` VARCHAR(64) NOT NULL,
    `username` VARCHAR(255) DEFAULT NULL,
    `past_names` JSON DEFAULT NULL,
    `points` INT DEFAULT 1,
    `afk_message` TEXT DEFAULT NULL,
    `server_nicks` JSON DEFAULT NULL,
    `reminders` JSON DEFAULT NULL,
    `location` VARCHAR(255) DEFAULT NULL,
    `weatherunit` VARCHAR(10) DEFAULT NULL,
    `last_seen` DATETIME(3) DEFAULT NULL,
    `profile_fields` JSON DEFAULT NULL,
    `profile_background_image` VARCHAR(512) DEFAULT 'http://i.imgur.com/8UIlbtg.jpg',
    `isProfilePublic` TINYINT(1) DEFAULT 1,
    `upvoted_gallery_extensions` JSON DEFAULT NULL,
    `subscription` JSON DEFAULT NULL,
    `linked_accounts` JSON DEFAULT NULL,
    `payment_ids` JSON DEFAULT NULL,
    `stripe_customer_id` VARCHAR(255) DEFAULT NULL,
    `paypal_customer_id` VARCHAR(255) DEFAULT NULL,
    `btcpay_customer_id` VARCHAR(255) DEFAULT NULL,
    `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`_id`),
    INDEX `idx_users_username` (`username`),
    INDEX `idx_users_points` (`points`),
    INDEX `idx_users_stripe_customer` (`stripe_customer_id`),
    INDEX `idx_users_last_seen` (`last_seen`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SERVERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `servers` (
    `_id` VARCHAR(64) NOT NULL,
    `added_timestamp` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    `config` JSON DEFAULT NULL,
    `extensions` JSON DEFAULT NULL,
    `members` JSON DEFAULT NULL,
    `games` JSON DEFAULT NULL,
    `channels` JSON DEFAULT NULL,
    `command_usage` JSON DEFAULT NULL,
    `messages_today` INT DEFAULT 0,
    `stats_timestamp` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    `voice_data` JSON DEFAULT NULL,
    `logs` JSON DEFAULT NULL,
    `modlog` JSON DEFAULT NULL,
    `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`_id`),
    INDEX `idx_servers_messages_today` (`messages_today`),
    INDEX `idx_servers_added_timestamp` (`added_timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- GALLERY TABLE (Extensions)
-- ============================================
CREATE TABLE IF NOT EXISTS `gallery` (
    `_id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `owner_id` VARCHAR(64) NOT NULL,
    `code_id` VARCHAR(64) NOT NULL,
    `state` VARCHAR(32) DEFAULT 'saved',
    `type` VARCHAR(32) DEFAULT 'command',
    `featured` TINYINT(1) DEFAULT 0,
    `version` JSON DEFAULT NULL,
    `published_version` JSON DEFAULT NULL,
    `servers` JSON DEFAULT NULL,
    `upvotes` INT DEFAULT 0,
    `last_updated` DATETIME(3) DEFAULT NULL,
    `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`_id`),
    INDEX `idx_gallery_owner` (`owner_id`),
    INDEX `idx_gallery_state` (`state`),
    INDEX `idx_gallery_type` (`type`),
    INDEX `idx_gallery_featured` (`featured`),
    INDEX `idx_gallery_upvotes` (`upvotes`),
    FULLTEXT INDEX `idx_gallery_search` (`name`, `description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BLOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `blog` (
    `_id` VARCHAR(64) NOT NULL,
    `title` VARCHAR(512) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `author_id` VARCHAR(64) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `category` VARCHAR(64) DEFAULT 'general',
    `tags` JSON DEFAULT NULL,
    `meta_description` VARCHAR(512) DEFAULT NULL,
    `views` INT DEFAULT 0,
    `published_at` DATETIME(3) DEFAULT NULL,
    `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`_id`),
    UNIQUE INDEX `idx_blog_slug` (`slug`),
    INDEX `idx_blog_author` (`author_id`),
    INDEX `idx_blog_category` (`category`),
    INDEX `idx_blog_published` (`published_at`),
    FULLTEXT INDEX `idx_blog_search` (`title`, `content`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- WIKI TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `wiki` (
    `_id` VARCHAR(64) NOT NULL,
    `title` VARCHAR(512) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `author_id` VARCHAR(64) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `category` VARCHAR(64) DEFAULT 'general',
    `parent_id` VARCHAR(64) DEFAULT NULL,
    `revision` INT DEFAULT 1,
    `history` JSON DEFAULT NULL,
    `contributors` JSON DEFAULT NULL,
    `reactions` JSON DEFAULT NULL,
    `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`_id`),
    UNIQUE INDEX `idx_wiki_slug` (`slug`),
    INDEX `idx_wiki_author` (`author_id`),
    INDEX `idx_wiki_category` (`category`),
    INDEX `idx_wiki_parent` (`parent_id`),
    FULLTEXT INDEX `idx_wiki_search` (`title`, `content`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TRAFFIC TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `traffic` (
    `_id` VARCHAR(64) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL,
    `path` VARCHAR(512) NOT NULL,
    `method` VARCHAR(10) NOT NULL,
    `status_code` INT DEFAULT NULL,
    `response_time` INT DEFAULT NULL,
    `user_agent` TEXT DEFAULT NULL,
    `ip_hash` VARCHAR(64) DEFAULT NULL,
    `referrer` VARCHAR(512) DEFAULT NULL,
    `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`_id`),
    INDEX `idx_traffic_timestamp` (`timestamp`),
    INDEX `idx_traffic_path` (`path`(191)),
    INDEX `idx_traffic_status` (`status_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- VOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `votes` (
    `_id` VARCHAR(64) NOT NULL,
    `user_id` VARCHAR(64) NOT NULL,
    `target_type` VARCHAR(32) NOT NULL,
    `target_id` VARCHAR(64) NOT NULL,
    `vote_type` VARCHAR(16) NOT NULL,
    `platform` VARCHAR(32) DEFAULT NULL,
    `timestamp` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`_id`),
    INDEX `idx_votes_user` (`user_id`),
    INDEX `idx_votes_target` (`target_type`, `target_id`),
    UNIQUE INDEX `idx_votes_unique` (`user_id`, `target_type`, `target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- GLOBAL FILTERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `global_filters` (
    `_id` VARCHAR(64) NOT NULL,
    `pattern` TEXT NOT NULL,
    `type` VARCHAR(32) DEFAULT 'regex',
    `action` VARCHAR(32) DEFAULT 'delete',
    `enabled` TINYINT(1) DEFAULT 1,
    `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`_id`),
    INDEX `idx_global_filters_enabled` (`enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- GLOBAL RANKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `global_ranks` (
    `_id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `min_points` INT NOT NULL,
    `max_points` INT DEFAULT NULL,
    `color` VARCHAR(16) DEFAULT NULL,
    `badge` VARCHAR(64) DEFAULT NULL,
    `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`_id`),
    INDEX `idx_global_ranks_points` (`min_points`, `max_points`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- GLOBAL RSS FEEDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `global_rss_feeds` (
    `_id` VARCHAR(64) NOT NULL,
    `url` VARCHAR(1024) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `last_checked` DATETIME(3) DEFAULT NULL,
    `last_item_id` VARCHAR(512) DEFAULT NULL,
    `enabled` TINYINT(1) DEFAULT 1,
    `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`_id`),
    INDEX `idx_global_rss_enabled` (`enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- GLOBAL STATUS MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `global_status_messages` (
    `_id` VARCHAR(64) NOT NULL,
    `message` VARCHAR(255) NOT NULL,
    `type` VARCHAR(32) DEFAULT 'playing',
    `enabled` TINYINT(1) DEFAULT 1,
    `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- GLOBAL TAG REACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `global_tag_reactions` (
    `_id` VARCHAR(64) NOT NULL,
    `trigger` VARCHAR(255) NOT NULL,
    `reaction` VARCHAR(64) NOT NULL,
    `enabled` TINYINT(1) DEFAULT 1,
    `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`_id`),
    INDEX `idx_global_tag_reactions_trigger` (`trigger`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- GLOBAL TAGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `global_tags` (
    `_id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `owner_id` VARCHAR(64) NOT NULL,
    `uses` INT DEFAULT 0,
    `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`_id`),
    UNIQUE INDEX `idx_global_tags_name` (`name`),
    INDEX `idx_global_tags_owner` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- GLOBAL TRIVIA TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `global_trivia` (
    `_id` VARCHAR(64) NOT NULL,
    `question` TEXT NOT NULL,
    `answer` VARCHAR(512) NOT NULL,
    `category` VARCHAR(64) DEFAULT 'general',
    `difficulty` VARCHAR(16) DEFAULT 'medium',
    `enabled` TINYINT(1) DEFAULT 1,
    `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`_id`),
    INDEX `idx_global_trivia_category` (`category`),
    INDEX `idx_global_trivia_difficulty` (`difficulty`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SITE SETTINGS TABLE (Key-Value store)
-- ============================================
CREATE TABLE IF NOT EXISTS `site_settings` (
    `_id` VARCHAR(64) NOT NULL DEFAULT 'main',
    `site_name` VARCHAR(255) DEFAULT NULL,
    `site_description` TEXT DEFAULT NULL,
    `site_keywords` TEXT DEFAULT NULL,
    `favicon_url` VARCHAR(512) DEFAULT NULL,
    `logo_url` VARCHAR(512) DEFAULT NULL,
    `primary_color` VARCHAR(16) DEFAULT NULL,
    `secondary_color` VARCHAR(16) DEFAULT NULL,
    `membership` JSON DEFAULT NULL,
    `payments` JSON DEFAULT NULL,
    `injection` JSON DEFAULT NULL,
    `social` JSON DEFAULT NULL,
    `features` JSON DEFAULT NULL,
    `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FEEDBACK TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `feedback` (
    `_id` VARCHAR(64) NOT NULL,
    `user_id` VARCHAR(64) DEFAULT NULL,
    `type` VARCHAR(32) NOT NULL,
    `subject` VARCHAR(512) DEFAULT NULL,
    `message` TEXT NOT NULL,
    `email` VARCHAR(255) DEFAULT NULL,
    `status` VARCHAR(32) DEFAULT 'pending',
    `response` TEXT DEFAULT NULL,
    `responded_at` DATETIME(3) DEFAULT NULL,
    `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`_id`),
    INDEX `idx_feedback_user` (`user_id`),
    INDEX `idx_feedback_type` (`type`),
    INDEX `idx_feedback_status` (`status`),
    INDEX `idx_feedback_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- INSERT DEFAULT SITE SETTINGS
-- ============================================
INSERT IGNORE INTO `site_settings` (`_id`) VALUES ('main');
