-- Migration: Add invite_tracking table for tracking invite usage
-- Date: 2025-12-17
-- Tracks invite codes and who invited whom

CREATE TABLE IF NOT EXISTS invite_tracking (
    _id VARCHAR(64) PRIMARY KEY,
    server_id VARCHAR(32) NOT NULL,
    
    -- The invite code
    code VARCHAR(32) NOT NULL,
    
    -- Who created the invite
    inviter_id VARCHAR(32) NOT NULL,
    
    -- Total uses of this invite
    uses INT DEFAULT 0,
    
    -- Members who joined using this invite (JSON array of objects)
    -- Each object: {_id: string, joined_at: datetime, left: boolean, left_at: datetime}
    members JSON DEFAULT '[]',
    
    -- When the invite was created
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Optional: max uses, expiry, etc.
    max_uses INT DEFAULT 0,
    expires_at DATETIME DEFAULT NULL,
    
    -- Channel the invite is for
    channel_id VARCHAR(32) DEFAULT NULL,
    
    -- Custom label for the invite
    label VARCHAR(50) DEFAULT NULL,
    
    INDEX idx_invite_tracking_server (server_id),
    INDEX idx_invite_tracking_inviter (inviter_id),
    INDEX idx_invite_tracking_code (code),
    UNIQUE INDEX idx_server_code (server_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
