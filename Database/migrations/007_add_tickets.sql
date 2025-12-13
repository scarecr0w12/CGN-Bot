-- Migration: Add tickets and ticket_messages tables for global support system
-- Date: 2025-12-13

-- Tickets table (global support tickets via DM)
CREATE TABLE IF NOT EXISTS tickets (
    _id VARCHAR(36) PRIMARY KEY,
    ticket_number INT NOT NULL,
    user_id VARCHAR(32) NOT NULL,
    username VARCHAR(255) DEFAULT '',
    user_avatar VARCHAR(512) DEFAULT '',
    subject VARCHAR(500) NOT NULL,
    category ENUM('general', 'bug', 'feature', 'billing', 'account', 'other') DEFAULT 'general',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    status ENUM('open', 'in_progress', 'awaiting_response', 'on_hold', 'resolved', 'closed') DEFAULT 'open',
    assigned_to VARCHAR(32) DEFAULT NULL,
    assigned_to_username VARCHAR(255) DEFAULT '',
    dm_channel_id VARCHAR(32) DEFAULT NULL,
    tags JSON DEFAULT '[]',
    internal_notes TEXT DEFAULT '',
    message_count INT DEFAULT 1,
    last_message_preview VARCHAR(500) DEFAULT '',
    last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolution_notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    closed_at DATETIME DEFAULT NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_category (category),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_ticket_number (ticket_number),
    INDEX idx_created_at (created_at),
    INDEX idx_last_activity (last_activity_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ticket messages table (individual messages within tickets)
CREATE TABLE IF NOT EXISTS ticket_messages (
    _id VARCHAR(36) PRIMARY KEY,
    ticket_id VARCHAR(36) NOT NULL,
    author_id VARCHAR(32) NOT NULL,
    author_username VARCHAR(255) DEFAULT '',
    author_avatar VARCHAR(512) DEFAULT '',
    is_staff BOOLEAN DEFAULT FALSE,
    content TEXT NOT NULL,
    attachments JSON DEFAULT '[]',
    discord_message_id VARCHAR(32) DEFAULT NULL,
    is_system_message BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ticket_id (ticket_id),
    INDEX idx_author_id (author_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (ticket_id) REFERENCES tickets(_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add auto-increment counter for ticket numbers
CREATE TABLE IF NOT EXISTS ticket_counters (
    _id VARCHAR(32) PRIMARY KEY DEFAULT 'global',
    next_ticket_number INT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initialize the counter
INSERT IGNORE INTO ticket_counters (_id, next_ticket_number) VALUES ('global', 1);
