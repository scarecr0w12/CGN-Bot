-- Migration: Migrate config.json settings to siteSettings collection
-- This migration adds the new columns to site_settings for config.json fields
-- The actual data migration should be done via the migrate-config.js script

-- Note: For MongoDB, no schema migration is needed as it's schemaless
-- For MariaDB/SQL, we need to ensure the columns exist

-- Add new columns for maintainer and blocklist arrays (stored as JSON)
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS sudo_maintainers JSON DEFAULT '[]';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS maintainers JSON DEFAULT '[]';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS wiki_contributors JSON DEFAULT '[]';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS user_blocklist JSON DEFAULT '[]';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS guild_blocklist JSON DEFAULT '[]';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS activity_blocklist JSON DEFAULT '[]';

-- Add columns for bot presence settings
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS bot_status VARCHAR(20) DEFAULT 'online';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS bot_activity JSON DEFAULT '{"name": "default", "type": "PLAYING", "twitchURL": ""}';

-- Add columns for permission levels
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS perms JSON DEFAULT '{"eval": 0, "sudo": 2, "management": 2, "administration": 1, "shutdown": 2}';

-- Add column for PM forwarding
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS pm_forward BOOLEAN DEFAULT FALSE;
