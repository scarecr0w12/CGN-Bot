-- Migration: Add sentiment_filter to moderation filters
-- The sentiment_filter is stored as part of the JSON config field in the servers table
-- This migration ensures any existing servers have the default sentiment_filter structure

-- For MariaDB/MySQL: The config field is already JSON type, so no schema change needed
-- The sentiment_filter will be automatically added with defaults when accessed

-- This is a documentation migration - the actual field is handled by the schema defaults
-- in serverConfigSchema.js under config.moderation.filters.sentiment_filter

-- Default structure:
-- {
--   "isEnabled": false,
--   "disabled_channel_ids": [],
--   "provider": "google",
--   "google_api_key": "",
--   "sensitivity": "normal",
--   "negative_threshold": -0.5,
--   "categories": {
--     "toxic": true,
--     "insult": true,
--     "threat": true,
--     "profanity": true,
--     "identity_attack": true
--   },
--   "min_message_length": 10,
--   "action": "mute",
--   "delete_message": true,
--   "violator_role_id": "",
--   "log_channel_id": "",
--   "warn_user": true,
--   "escalate_on_repeat": true,
--   "repeat_threshold": 3,
--   "repeat_window_minutes": 60
-- }

-- No SQL changes required - this is handled by the ORM layer
SELECT 1;
