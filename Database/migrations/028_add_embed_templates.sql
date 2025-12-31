-- Migration: Add embed templates system
-- Date: 2025-12-31
-- Description: Creates table for storing embed templates

-- Create embed_templates table
CREATE TABLE IF NOT EXISTS embed_templates (
    _id VARCHAR(16) PRIMARY KEY,
    server_id VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(200),
    embed_data JSON NOT NULL,
    created_by VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    use_count INT DEFAULT 0,
    INDEX idx_server (server_id),
    INDEX idx_created_by (created_by),
    INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
