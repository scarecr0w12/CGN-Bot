-- Welcome Image System Migration
-- Adds welcome image configuration tables

-- Welcome image templates table
CREATE TABLE IF NOT EXISTS welcome_images (
    _id VARCHAR(255) PRIMARY KEY,
    server_id VARCHAR(255) NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    channel_id VARCHAR(255),
    template_id VARCHAR(255) NOT NULL,
    
    -- Background settings
    background_type ENUM('builtin', 'custom', 'color') DEFAULT 'builtin',
    background_value VARCHAR(500),
    
    -- Avatar settings
    avatar_enabled BOOLEAN DEFAULT TRUE,
    avatar_x INT DEFAULT 50,
    avatar_y INT DEFAULT 30,
    avatar_size INT DEFAULT 150,
    avatar_border_enabled BOOLEAN DEFAULT TRUE,
    avatar_border_color VARCHAR(7) DEFAULT '#FFFFFF',
    avatar_border_width INT DEFAULT 5,
    
    -- Main text settings
    text_enabled BOOLEAN DEFAULT TRUE,
    text_template VARCHAR(500) DEFAULT 'Welcome {username}!',
    text_font VARCHAR(100) DEFAULT 'Arial',
    text_size INT DEFAULT 48,
    text_color VARCHAR(7) DEFAULT '#FFFFFF',
    text_x INT DEFAULT 50,
    text_y INT DEFAULT 70,
    text_align ENUM('left', 'center', 'right') DEFAULT 'center',
    text_stroke_enabled BOOLEAN DEFAULT TRUE,
    text_stroke_color VARCHAR(7) DEFAULT '#000000',
    text_stroke_width INT DEFAULT 2,
    
    -- Subtitle settings
    subtitle_enabled BOOLEAN DEFAULT TRUE,
    subtitle_template VARCHAR(500) DEFAULT 'Member #{memberCount}',
    subtitle_font VARCHAR(100) DEFAULT 'Arial',
    subtitle_size INT DEFAULT 24,
    subtitle_color VARCHAR(7) DEFAULT '#CCCCCC',
    subtitle_x INT DEFAULT 50,
    subtitle_y INT DEFAULT 80,
    subtitle_align ENUM('left', 'center', 'right') DEFAULT 'center',
    
    -- Image settings
    width INT DEFAULT 1024,
    height INT DEFAULT 450,
    format ENUM('png', 'jpeg') DEFAULT 'png',
    quality INT DEFAULT 90,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_server_id (server_id),
    INDEX idx_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Custom background uploads table (for Tier 1+)
CREATE TABLE IF NOT EXISTS welcome_image_uploads (
    _id VARCHAR(255) PRIMARY KEY,
    server_id VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(500) NOT NULL,
    mimetype VARCHAR(100),
    size INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_server_id (server_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
