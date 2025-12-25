-- Migration: Add server tickets tables for per-server ticket system
-- This is for the Tier 2 server-specific ticket feature

-- Server tickets table
CREATE TABLE IF NOT EXISTS server_tickets (
    _id VARCHAR(64) PRIMARY KEY,
    server_id VARCHAR(32) NOT NULL,
    ticket_number INT NOT NULL,
    channel_id VARCHAR(32) NOT NULL,
    user_id VARCHAR(32) NOT NULL,
    username VARCHAR(128) DEFAULT '',
    user_avatar VARCHAR(512) DEFAULT '',
    category_id VARCHAR(64) DEFAULT 'general',
    category_name VARCHAR(128) DEFAULT 'General',
    subject VARCHAR(512) DEFAULT 'Support Request',
    status ENUM('open', 'in_progress', 'on_hold', 'closed') DEFAULT 'open',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    assigned_to VARCHAR(32) DEFAULT NULL,
    assigned_username VARCHAR(128) DEFAULT NULL,
    participants JSON DEFAULT '[]',
    staff_participants JSON DEFAULT '[]',
    internal_notes TEXT DEFAULT '',
    message_count INT DEFAULT 0,
    transcript_channel_id VARCHAR(32) DEFAULT NULL,
    transcript_message_id VARCHAR(32) DEFAULT NULL,
    closed_by VARCHAR(32) DEFAULT NULL,
    closed_reason TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    closed_at DATETIME DEFAULT NULL,
    last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_server_tickets_server (server_id),
    INDEX idx_server_tickets_user (user_id),
    INDEX idx_server_tickets_status (status),
    INDEX idx_server_tickets_channel (channel_id),
    UNIQUE INDEX idx_server_ticket_number (server_id, ticket_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Server ticket messages table
CREATE TABLE IF NOT EXISTS server_ticket_messages (
    _id VARCHAR(64) PRIMARY KEY,
    ticket_id VARCHAR(64) NOT NULL,
    server_id VARCHAR(32) NOT NULL,
    discord_message_id VARCHAR(32) DEFAULT NULL,
    author_id VARCHAR(32) NOT NULL,
    author_username VARCHAR(128) DEFAULT '',
    author_avatar VARCHAR(512) DEFAULT '',
    is_staff BOOLEAN DEFAULT FALSE,
    content TEXT DEFAULT '',
    attachments JSON DEFAULT '[]',
    embeds JSON DEFAULT '[]',
    is_system_message BOOLEAN DEFAULT FALSE,
    system_action ENUM('opened', 'closed', 'claimed', 'unclaimed', 'user_added', 
                       'user_removed', 'priority_changed', 'category_changed', 
                       'renamed', 'reopened') DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_stm_ticket (ticket_id),
    INDEX idx_stm_server (server_id),
    INDEX idx_stm_author (author_id),
    FOREIGN KEY (ticket_id) REFERENCES server_tickets(_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
