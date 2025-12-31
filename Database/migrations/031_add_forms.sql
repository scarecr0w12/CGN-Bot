-- Migration: Add Application/Form Builder System
-- Date: 2025-12-31
-- Description: Adds support for creating custom forms and applications

CREATE TABLE IF NOT EXISTS forms (
    _id VARCHAR(255) PRIMARY KEY,
    server_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    fields JSON DEFAULT NULL,
    submit_channel VARCHAR(255) DEFAULT NULL,
    review_channel VARCHAR(255) DEFAULT NULL,
    auto_role_id VARCHAR(255) DEFAULT NULL,
    webhook_url VARCHAR(500) DEFAULT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_server (server_id),
    INDEX idx_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS form_responses (
    _id VARCHAR(255) PRIMARY KEY,
    form_id VARCHAR(255) NOT NULL,
    server_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    responses JSON NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    reviewed_by VARCHAR(255) DEFAULT NULL,
    review_notes TEXT DEFAULT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME DEFAULT NULL,
    
    INDEX idx_form (form_id),
    INDEX idx_server (server_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    FOREIGN KEY (form_id) REFERENCES forms(_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
