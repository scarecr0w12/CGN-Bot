-- Migration: Add Social Media Alerts System
-- Date: 2025-12-31
-- Description: Adds support for Twitch/YouTube/Twitter/Reddit alert notifications

CREATE TABLE IF NOT EXISTS social_alerts (
    _id VARCHAR(255) PRIMARY KEY,
    server_id VARCHAR(255) NOT NULL,
    channel_id VARCHAR(255) NOT NULL,
    platform ENUM('twitch', 'youtube', 'twitter', 'reddit') NOT NULL,
    account_id VARCHAR(255) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    template JSON DEFAULT NULL,
    role_mentions JSON DEFAULT NULL,
    last_check DATETIME DEFAULT NULL,
    last_status JSON DEFAULT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_server (server_id),
    INDEX idx_platform (platform),
    INDEX idx_enabled (enabled),
    INDEX idx_server_platform (server_id, platform)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
