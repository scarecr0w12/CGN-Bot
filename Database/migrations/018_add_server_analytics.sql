-- Migration: Add server_analytics table for premium server analytics
-- Date: 2025-12-17
-- Stores historical analytics data for premium servers (aggregated daily)

CREATE TABLE IF NOT EXISTS server_analytics (
    _id VARCHAR(64) PRIMARY KEY,
    server_id VARCHAR(32) NOT NULL,
    date DATE NOT NULL,
    
    -- Daily message counts per channel (stored as JSON array)
    channel_activity JSON DEFAULT '[]',
    
    -- Daily message counts per hour (0-23) for heatmap
    hourly_activity JSON DEFAULT '[]',
    
    -- Daily member activity
    member_activity JSON DEFAULT '{"active_members": 0, "new_messages": 0, "voice_minutes": 0}',
    
    -- Join/leave tracking
    join_leave JSON DEFAULT '{"joins": 0, "leaves": 0, "net_change": 0}',
    
    -- Command usage stats
    command_usage JSON DEFAULT '{}',
    
    -- Role engagement (members per role)
    role_engagement JSON DEFAULT '[]',
    
    -- Summary stats
    summary JSON DEFAULT '{"total_messages": 0, "total_members": 0, "peak_hour": null, "most_active_channel": null}',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_server_analytics_server (server_id),
    INDEX idx_server_analytics_date (date),
    UNIQUE INDEX idx_server_date (server_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
