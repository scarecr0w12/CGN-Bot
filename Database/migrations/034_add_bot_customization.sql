-- Migration: Add Bot Customization (Tier 2+)
-- Date: 2025-12-31
-- Description: Adds bot_customization field to server_config for custom nicknames and status

-- MariaDB Schema Update
-- The bot_customization field is stored as JSON in the config column of servers table
-- Structure:
-- {
--   "nickname": "",
--   "status_text": "",
--   "status_type": "PLAYING",
--   "status_state": "online",
--   "isEnabled": false
-- }

-- This is a documentation-only migration as the JSON field already exists
-- The application layer (serverConfigSchema.js) enforces the structure

-- Features:
-- Tier 2: Custom nickname and status per server
-- Tier 3 (Future): Dedicated bot instances with full customization

-- Usage:
-- 1. Server admins configure via dashboard or /botcustom commands
-- 2. BotCustomizationManager applies settings when bot joins guild or settings change
-- 3. Tier validation ensures only Tier 2+ servers can use these features
