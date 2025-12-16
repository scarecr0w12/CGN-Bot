-- Migration: Migrate config.json settings to siteSettings collection
-- This migration adds the new columns to site_settings for config.json fields
-- The actual data migration should be done via the migrate-config.js script

-- Note: For MongoDB, no schema migration is needed as it's schemaless
-- For MariaDB/SQL, we need to ensure the columns exist

-- Add new columns for maintainer and blocklist arrays (stored as JSON)
-- Using camelCase to match the ORM schema
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS sudoMaintainers JSON DEFAULT '[]';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS maintainers JSON DEFAULT '[]';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS wikiContributors JSON DEFAULT '[]';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS userBlocklist JSON DEFAULT '[]';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS guildBlocklist JSON DEFAULT '[]';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS activityBlocklist JSON DEFAULT '[]';

-- Add columns for bot presence settings
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS botStatus VARCHAR(20) DEFAULT 'online';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS botActivity JSON DEFAULT '{"name": "default", "type": "PLAYING", "twitchURL": ""}';

-- Add columns for permission levels
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS perms JSON DEFAULT '{"eval": 0, "sudo": 2, "management": 2, "administration": 1, "shutdown": 2}';

-- Add column for PM forwarding
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS pmForward BOOLEAN DEFAULT FALSE;

-- Add columns for homepage settings
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS homepageMessageHTML TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS headerImage VARCHAR(255) DEFAULT 'header-bg.jpg';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS injection JSON DEFAULT '{"headScript": "", "footerHTML": ""}';
