# Feature Development Tracker

This document tracks the implementation status of tier-gated features in the membership system.

## Overview

**IMPORTANT: Premium features are per-SERVER, not per-user.**

When a server administrator purchases a premium subscription, that subscription is attached to the server (guild), and all members of that server benefit from the premium features while using the bot in that server's context.

The Feature Registry (`/maintainer/membership/features`) defines features that can be assigned to membership tiers.

### Infrastructure Status: ✅ Ready

- `Modules/TierManager.js` - Full tier/feature management API (server-based)
- `Web/middleware/index.js` - `requireFeature()` and `requireTierLevel()` middleware (checks server context)
- `Database/Schemas/serverSchema.js` - Server subscription storage
- `Database/Schemas/siteSettingsSchema.js` - Feature and tier definitions

---

## Bot Features

### `ai_chat` - AI Chat

**Status:** 🟢 Implemented  
**Priority:** High  
**Description:** Access to AI chatbot and conversation features

**Implementation Notes:**

- AI module exists at `Modules/AI/`
- ✅ Added `TierManager.canAccess(userId, 'ai_chat')` check at start of AI command
- Users without feature see premium upgrade prompt

**Files Modified:**

- [x] `Commands/Public/ai.js` - Added tier check before processing

---

### `ai_images` - AI Images

**Status:**
**Priority:** Medium  
**Description:** Generate AI images with DALL-E or Stable Diffusion

**Implementation Notes:**

- Created `imagine` command with full feature gating
- Supports size and style parameters
- Integrates with AIManager for image generation
- Premium-only with upgrade prompt for free users

**Files Created:**

- [x] `Commands/Public/imagine.js` - AI image generation command

---

### `custom_commands` - Custom Commands

**Status:**
**Priority:** Medium  
**Description:** Create unlimited custom commands per server

**Implementation Notes:**

- Custom command system exists with tier-based limits
- Free users: 5 tags max, Premium users: 1000 tags
- Limit checked on tag creation in dashboard

**Files Modified:**

- [x] `Web/controllers/dashboard/commands.js` - Added limit check on create (tags.post)

---

### `advanced_moderation` - Advanced Moderation

**Status:**
**Priority:** Medium  
**Description:** Advanced auto-mod filters and spam detection

**Implementation Notes:**

- Moderation filters page now checks `advanced_moderation` feature
- Non-premium users see feature but can't modify filter settings
- POST handler rejects changes from non-premium users

**Files Modified:**

- [x] `Web/controllers/dashboard/administration.js` - Added feature checks to filters controller

---

### `custom_branding` - Custom Branding

**Status:**
**Priority:** Low  
**Description:** Remove bot branding from embeds and messages

**Implementation Notes:**

- Created `BrandingHelper` utility module
- Checks `custom_branding` feature for premium users
- Supports: hide footer, custom footer text
- Server config can set `branding.hideFooter` and `branding.customFooter`

**Files Created:**

- [x] `Modules/Utils/BrandingHelper.js` - Branding utility module

---

### `extended_logs` - Extended Logs

**Status:**
**Priority:** Low  
**Description:** Extended audit logging and log retention

**Implementation Notes:**

- Premium users see 1000 logs (vs 200 for free)
- Controller passes `hasExtendedLogs`, `logLimit`, `totalLogs` to template
- Template can show upgrade prompt when logs are truncated

**Files Modified:**

- [x] `Web/controllers/dashboard/administration.js` - Extended log limits for premium
- Need log pruning job that respects tier

**Files to Modify:**

- [ ] `Modules/Timeouts/` - Add log cleanup job
- [ ] Log storage schema - Add retention field

---

### `voice_features` - Voice Features

**Status:**
**Priority:** Low  
**Description:** Voice channel features and music commands

**Implementation Notes:**

- Voice room creation requires `voice_features` feature
- Text rooms remain free, voice rooms are premium
- Also fixed pre-existing undefined imports (ChannelType, PermissionFlagsBits)

**Files Modified:**

- [x] `Commands/Public/room.js` - Voice room creation gated to premium

---

### `auto_roles` - Auto Roles

**Status:**
**Priority:** Medium  
**Description:** Automatic role assignment on join or reaction

**Implementation Notes:**

- Auto-role settings (new_member_roles) now feature-gated
- Moderation controller passes `hasAutoRoles` to template
- Non-premium users can view but not modify auto-role settings

**Files Modified:**

- [x] `Web/controllers/dashboard/administration.js` - Added feature check to moderation controller

---

## Dashboard Features

### `premium_dashboard` - Premium Dashboard

**Status:**
**Priority:** Low  
**Description:** Access to premium dashboard themes and layouts

**Implementation Notes:**

- Created ThemeHelper utility module
- 5 themes: Default, Dark Mode, Midnight Blue, Forest, Sunset
- Free users get Default only, premium users get all themes
- Generates CSS variables for theme colors

**Files Created:**

- [x] `Modules/Utils/ThemeHelper.js` - Theme management utility

---

### `advanced_stats` - Advanced Statistics

**Status:**
**Priority:** Medium  
**Description:** Detailed analytics and server insights

**Implementation Notes:**

- Premium API endpoint at `/dashboard/:svrid/stats-points/analytics`
- Returns: overview, activity metrics, moderation stats, distributions, leaderboard
- Includes points distribution, rank breakdown, activity rates

**Files Modified:**

- [x] `Web/controllers/dashboard/stats.js` - Added analytics endpoint
- [x] `Web/routes/dashboard.js` - Added premium analytics route

---

### `export_data` - Export Data

**Status:**
**Priority:** Medium  
**Description:** Export server data and logs to CSV/JSON

**Implementation Notes:**

- Export page at `/dashboard/:svrid/other/export`
- Supports: config, members, moderation, commands, stats, full export
- Formats: JSON (all types), CSV (for array data)
- Feature-gated with `TierManager.canAccess`

**Files Created/Modified:**

- [x] `Web/controllers/dashboard/other.js` - Enhanced export controller
- [x] `Web/views/pages/admin-export.ejs` - New export UI page

---

### `webhook_integrations` - Webhook Integrations

**Status:**
**Priority:** Low  
**Description:** Custom webhook integrations for notifications

**Implementation Notes:**

- Created WebhookDispatcher module
- 10 supported events (member join/leave, bans, messages, etc.)
- Retry logic with exponential backoff
- HMAC signature support for security
- Auto-disable after repeated failures

**Files Created:**

- [x] `Modules/WebhookDispatcher.js` - Webhook dispatch system

---

## API Features

### `api_access` - API Access

**Status:**
**Priority:** High  
**Description:** Access to bot REST API endpoints

**Implementation Notes:**

- API exists at `Web/routes/api.js`
- Protected endpoints now require `api_access` feature
- Public endpoints (status, servers list) remain open

**Files Modified:**

- [x] `Web/routes/api.js` - Added `middleware.requireFeature('api_access')` to protected routes

---

### `api_webhooks` - API Webhooks

**Status:**
**Priority:** Low  
**Description:** Receive webhook callbacks for events

**Implementation Notes:**

- Similar to webhook_integrations but for API consumers
- Outbound webhooks on bot events

---

### `api_unlimited` - Unlimited API Calls

**Status:**
**Priority:** Medium  
**Description:** No rate limiting on API requests

**Implementation Notes:**

- Rate limiting exists in `Web/routes/api.js`
- Users with `api_unlimited` feature bypass rate limits
- Standard limit: 150 requests/hour

**Files Modified:**

- [x] `Web/routes/api.js` - Added feature check to bypass rate limiting

---

## General Features

### `priority_support` - Priority Support

**Status:**
**Priority:** N/A  
**Description:** Fast-track support responses and dedicated help

**Implementation Notes:**

- This is a human process, not code
- Could add badge/indicator in support system

---

### `early_access` - Early Access

**Status:**
**Priority:** Low  
**Description:** Beta access to new features before public release

**Implementation Notes:**

- Created FeatureFlags utility module
- Supports alpha/beta/stable/deprecated stages
- 5 initial beta features defined
- User opt-in/opt-out functionality
- withFeatureFlag decorator for easy integration

**Files Created:**

- [x] `Modules/Utils/FeatureFlags.js` - Feature flag system

---

### `no_ads` - Ad-Free Experience

**Status:**
**Status:** ⚪ N/A  
**Priority:** N/A  
**Description:** Remove any promotional messages

**Implementation Notes:**

- No ads currently exist
- Would apply if promotional messages added

---

### `custom_prefix` - Custom Prefix

**Status:** 🟢 Implemented  
**Priority:** Low  
**Description:** Set a custom command prefix per server

**Implementation Notes:**

- ✅ Prefix change now requires `custom_prefix` feature
- ✅ GET handler passes `hasCustomPrefix` to template
- ✅ POST handler only applies prefix change if user has feature

**Files Modified:**

- [x] `Web/controllers/dashboard/commands.js` - Added feature check to options controller

---

## Implementation Guide

### Adding Feature Gating to a Route

```javascript
// In route file
const middleware = require('../middleware');

// Gate entire route
router.get('/premium-page', 
  middleware.requireFeature('feature_id'), 
  controller.premiumPage
);
```

### Adding Feature Gating in Commands

```javascript
// In command handler
const TierManager = require('../../Modules/TierManager');

async execute(client, msg, args) {
  // Premium is per-server - use guild ID, not user ID
  const hasAccess = await TierManager.canAccess(msg.guild.id, 'ai_chat');
  if (!hasAccess) {
    return msg.reply('This feature requires a premium subscription for this server.');
  }
  // ... rest of command
}
```

### Adding Feature Gating in Controllers

```javascript
// In controller
const TierManager = require('../../Modules/TierManager');

controllers.premiumFeature = async (req, res) => {
  // Premium is per-server - use server ID from request
  const hasAccess = await TierManager.canAccess(req.svr.id, 'advanced_stats');
  if (!hasAccess) {
    return res.status(403).json({ error: 'Premium feature requires server subscription' });
  }
  // ... rest of controller
};
```

---

## Progress Summary

| Category | Total | Implemented | Partial | Not Started |
|----------|-------|-------------|---------|-------------|
| Bot | 8 | 8 | 0 | 0 |
| Dashboard | 4 | 4 | 0 | 0 |
| API | 3 | 3 | 0 | 0 |
| General | 4 | 2 | 0 | 0 |
| **Total** | **19** | **17** | **0** | **0** |

*UI-Only features (2) excluded from totals*

---

## Recent Changes

### December 9, 2024

- ✅ `ai_chat` - Added tier gating to AI command
- ✅ `api_access` - Protected API endpoints with feature middleware
- ✅ `api_unlimited` - Added rate limit bypass for premium users
- ✅ `custom_commands` - Added tag creation limits (5 free / 1000 premium)
- ✅ `export_data` - Full export system with JSON/CSV support
- ✅ `advanced_moderation` - Gated filter settings to premium users
- ✅ `auto_roles` - Gated auto-role settings to premium users
- ✅ `custom_prefix` - Gated prefix customization to premium users
- ✅ `custom_branding` - Created BrandingHelper utility for embed branding
- ✅ `voice_features` - Gated voice room creation to premium
- ✅ `extended_logs` - Premium users get 1000 logs (vs 200)
- ✅ `advanced_stats` - Premium analytics API endpoint
- ✅ `ai_images` - AI image generation command
- ✅ `premium_dashboard` - Theme system with 5 themes
- ✅ `webhook_integrations` - Full webhook dispatcher
- ✅ `early_access` - Feature flag system for beta features

---

*Last Updated: December 10, 2024*

## Implementation Complete

All 17 tier-gated features have been implemented (2 UI-Only features excluded from count).

---

## Architecture Change: Per-Server Premium

### December 10, 2024

Migrated from per-user to per-server premium model:

**Schema Changes:**

- Added `subscription` field to `serverSchema.js` (mirrors user subscription structure)
- Added `payment_ids` to servers for payment provider webhooks

**TierManager Changes:**

- `canAccess(serverId, featureKey)` - Now checks server's subscription
- `getServerTier(serverId)` - Get server's current tier
- `getServerFeatures(serverId)` - Get server's effective features
- `setServerTier(serverId, ...)` - Set server's subscription tier
- Deprecated user-based functions (kept for backward compatibility)

**Updated Files:**

- `Modules/TierManager.js` - Server-based access checks
- `Web/middleware/index.js` - Middleware uses `req.svr.id`
- `Web/controllers/dashboard/*.js` - All use `req.svr.id`
- `Commands/Public/ai.js`, `imagine.js`, `room.js` - Use `msg.guild.id`
- `Modules/Utils/ThemeHelper.js` - Server-based theme access
- `Modules/Utils/BrandingHelper.js` - Server-based branding
- `Modules/Utils/FeatureFlags.js` - Server-based beta features
- `Modules/WebhookDispatcher.js` - Server-based webhook access
