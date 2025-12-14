-- Migration: Add role_panels and temp_roles tables
-- Date: 2025-12-14

-- Role Panels table for button/dropdown/reaction role assignments
CREATE TABLE IF NOT EXISTS role_panels (
    _id VARCHAR(32) PRIMARY KEY,
    server_id VARCHAR(32) NOT NULL,
    channel_id VARCHAR(32) NOT NULL,
    message_id VARCHAR(32) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(1000),
    type ENUM('reaction', 'button', 'dropdown') NOT NULL DEFAULT 'button',
    mode ENUM('normal', 'unique', 'verify', 'reverse') NOT NULL DEFAULT 'normal',
    max_roles INT DEFAULT 0,
    require_role_id VARCHAR(32) DEFAULT NULL,
    roles JSON,
    color INT DEFAULT 5793266,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(32) NOT NULL,
    INDEX idx_server_id (server_id),
    INDEX idx_message_id (message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Temporary Roles table for time-limited role assignments
CREATE TABLE IF NOT EXISTS temp_roles (
    _id VARCHAR(32) PRIMARY KEY,
    server_id VARCHAR(32) NOT NULL,
    user_id VARCHAR(32) NOT NULL,
    role_id VARCHAR(32) NOT NULL,
    assigned_by VARCHAR(32) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    reason VARCHAR(500),
    notified BOOLEAN DEFAULT FALSE,
    INDEX idx_server_id (server_id),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at),
    UNIQUE INDEX idx_server_user_role (server_id, user_id, role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
