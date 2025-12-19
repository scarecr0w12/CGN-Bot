-- Migration: Add language support fields
-- Version: 1.6.1
-- Date: 2024-12-18
-- Description: Adds language preference fields to server_configs and users tables

-- Add language column to server_configs table
ALTER TABLE server_configs 
ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'en';

-- Add preferences JSON column to users table (if not exists)
-- This stores user preferences including language
ALTER TABLE users
ADD COLUMN IF NOT EXISTS preferences JSON DEFAULT NULL;

-- Update existing users to have default preferences
UPDATE users 
SET preferences = JSON_OBJECT('language', 'en', 'notifications', JSON_OBJECT('reminders', true, 'levelUp', true))
WHERE preferences IS NULL;

-- Create index for faster language lookups
CREATE INDEX IF NOT EXISTS idx_server_configs_language ON server_configs(language);

-- Note: For MongoDB deployments, these changes are handled automatically by the schema defaults
