-- MariaDB Migration: Add temp_roles table
-- Fixes: Table 'skynet.temp_roles' doesn't exist

CREATE TABLE IF NOT EXISTS `temp_roles` (
    `_id` VARCHAR(64) NOT NULL,
    `server_id` VARCHAR(64) NOT NULL,
    `user_id` VARCHAR(64) NOT NULL,
    `role_id` VARCHAR(64) NOT NULL,
    `assigned_by` VARCHAR(64) NOT NULL,
    `assigned_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at` DATETIME(3) NOT NULL,
    `reason` VARCHAR(500) DEFAULT NULL,
    `notified` TINYINT(1) DEFAULT 0,
    `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`_id`),
    INDEX `idx_temp_roles_server` (`server_id`),
    INDEX `idx_temp_roles_user` (`user_id`),
    INDEX `idx_temp_roles_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
