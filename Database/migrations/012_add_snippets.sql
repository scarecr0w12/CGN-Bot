-- Migration: Add snippets table for developer tools
-- Date: 2024-12-14

CREATE TABLE IF NOT EXISTS snippets (
    _id VARCHAR(32) PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    server_id VARCHAR(32) NOT NULL,
    name VARCHAR(64) NOT NULL,
    language VARCHAR(32) DEFAULT 'txt',
    code TEXT NOT NULL,
    description TEXT DEFAULT '',
    is_public BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_snippets_user_server (user_id, server_id),
    INDEX idx_snippets_server_name (server_id, name),
    UNIQUE KEY unique_user_server_name (user_id, server_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
