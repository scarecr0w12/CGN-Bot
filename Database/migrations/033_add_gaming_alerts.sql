-- Gaming Alerts System Migration
-- Adds gaming alerts configuration for Epic Games and Steam

CREATE TABLE IF NOT EXISTS gaming_alerts (
    _id VARCHAR(255) PRIMARY KEY,
    server_id VARCHAR(255) NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    channel_id VARCHAR(255) NOT NULL,
    
    -- Alert types
    epic_free_games BOOLEAN DEFAULT TRUE,
    steam_sales BOOLEAN DEFAULT TRUE,
    steam_free_games BOOLEAN DEFAULT TRUE,
    
    -- Notification settings
    role_mention VARCHAR(255),
    custom_message TEXT,
    
    -- Filters
    min_discount INT DEFAULT 50,
    max_price DECIMAL(10,2),
    free_only BOOLEAN DEFAULT FALSE,
    
    -- Tags/genres (stored as JSON array)
    steam_tags JSON,
    
    -- Tracking
    last_epic_check TIMESTAMP,
    last_steam_check TIMESTAMP,
    notified_games JSON, -- Array of game IDs
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_server_id (server_id),
    INDEX idx_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Gaming alerts history (for tracking what was sent)
CREATE TABLE IF NOT EXISTS gaming_alert_history (
    _id VARCHAR(255) PRIMARY KEY,
    server_id VARCHAR(255) NOT NULL,
    game_id VARCHAR(255) NOT NULL,
    game_title VARCHAR(500) NOT NULL,
    store VARCHAR(50) NOT NULL, -- 'epic' or 'steam'
    alert_type VARCHAR(50) NOT NULL, -- 'free', 'sale'
    discount_percentage INT,
    original_price DECIMAL(10,2),
    sale_price DECIMAL(10,2),
    notified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_server_game (server_id, game_id),
    INDEX idx_store (store),
    INDEX idx_notified_at (notified_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
