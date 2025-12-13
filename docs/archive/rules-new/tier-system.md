---
description: Server-based premium subscription system, feature gating, and tier management
trigger: model_decision
---

# Tier System (Premium Features)

The tier system manages server-based premium subscriptions with feature access control and quota enforcement.

**CRITICAL: Premium features are per-SERVER, not per-user.**

**Importance Score: 85/100**

## Architecture

```text
TierManager.js
      │
      ├── Feature Registry (siteSettingsSchema)
      ├── Server Subscriptions (serverSchema.subscription)
      └── Payment Integration (Stripe, BTCPay)
```

Path: `Modules/TierManager.js`

## Server-Based Premium Model

When a server administrator purchases a premium subscription:

1. Subscription is attached to the **server (guild)**
2. All members benefit from premium features in that server's context
3. Features are checked against `server.subscription` not user data

### Schema Structure

```javascript
// serverSchema.js
subscription: {
    tier_id: String,
    is_active: Boolean,
    expires_at: Date,
    payment_provider: String,  // 'stripe' or 'btcpay'
    // ... other fields
}

payment_ids: {
    stripe_customer_id: String,
    btcpay_customer_id: String
}
```

## TierManager API

### Feature Access Checks

```javascript
const TierManager = require('./Modules/TierManager');

// Check if server has access to a feature
const hasAccess = await TierManager.canAccess(serverId, 'ai_chat');

// Get server's current tier
const tier = await TierManager.getServerTier(serverId);

// Get all features available to server
const features = await TierManager.getServerFeatures(serverId);

// Set server's subscription tier
await TierManager.setServerTier(serverId, tierId, expiresAt, paymentProvider);
```

### Caching

- Site settings cached with **1-minute TTL**
- Use `TierManager.invalidateCache()` after tier/feature updates

## Feature Gating Patterns

### In Commands

```javascript
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

### In Controllers

```javascript
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

### In Routes (Middleware)

```javascript
const middleware = require('../middleware');

// Gate entire route
router.get('/premium-page', 
    middleware.requireFeature('feature_id'), 
    controller.premiumPage
);

// Or require minimum tier level
router.get('/enterprise-page',
    middleware.requireTierLevel(3),
    controller.enterprisePage
);
```

## Feature Registry

Defined in: `Database/Schemas/siteSettingsSchema.js`

### Tier Structure

| Tier | Level | Features |
|------|-------|----------|
| Free | 0 | Basic functionality |
| Premium | 1 | AI, advanced moderation, analytics |
| Enterprise | 2 | Custom branding, priority support |

### Implemented Features

| Feature Key | Description | Status |
|-------------|-------------|--------|
| `ai_chat` | AI chatbot access | ✅ Implemented |
| `ai_images` | AI image generation | ✅ Implemented |
| `custom_commands` | Unlimited custom commands | ✅ Implemented |
| `advanced_moderation` | Advanced auto-mod filters | ✅ Implemented |
| `custom_branding` | Remove bot branding | ✅ Implemented |
| `extended_logs` | Extended log retention | ✅ Implemented |
| `voice_features` | Voice channel features | ✅ Implemented |
| `auto_roles` | Automatic role assignment | ✅ Implemented |
| `premium_dashboard` | Premium dashboard themes | ✅ Implemented |
| `advanced_stats` | Detailed analytics | ✅ Implemented |
| `export_data` | Data export (CSV/JSON) | ✅ Implemented |
| `webhook_integrations` | Custom webhooks | ✅ Implemented |
| `api_access` | REST API access | ✅ Implemented |
| `api_unlimited` | No API rate limits | ✅ Implemented |
| `custom_prefix` | Custom command prefix | ✅ Implemented |
| `early_access` | Beta feature access | ✅ Implemented |

## Payment Integration

### Stripe

- Primary payment provider
- Webhook handling in `Web/controllers/webhooks.js`

### BTCPay

- Fallback if Stripe not configured
- Uses BTCPay Greenfield API

```bash
# Environment variables
BTCPAY_URL=https://btcpay.example.com
BTCPAY_API_KEY=...
BTCPAY_STORE_ID=...
```

### Pricing Calculation

Yearly pricing is calculated dynamically:

```javascript
yearlyPrice = monthlyPrice * 12 * (1 - yearlyDiscount / 100)
```

- `yearly_discount` percentage configurable in site settings
- Removed explicit `price_yearly` in favor of dynamic calculation

## Utility Modules

### ThemeHelper

Path: `Modules/Utils/ThemeHelper.js`

- 5 themes: Default, Dark Mode, Midnight Blue, Forest, Sunset
- Free users: Default only
- Premium users: All themes

### BrandingHelper

Path: `Modules/Utils/BrandingHelper.js`

- Hide footer, custom footer text
- Server config: `branding.hideFooter`, `branding.customFooter`

### FeatureFlags

Path: `Modules/Utils/FeatureFlags.js`

- Alpha/beta/stable/deprecated stages
- User opt-in/opt-out functionality
- `withFeatureFlag` decorator for easy integration

## Key Files

| File | Purpose |
|------|---------|
| `Modules/TierManager.js` | Core tier management |
| `Web/middleware/index.js` | `requireFeature()`, `requireTierLevel()` |
| `Database/Schemas/serverSchema.js` | Server subscription storage |
| `Database/Schemas/siteSettingsSchema.js` | Feature/tier definitions |
| `Web/controllers/membership.js` | Checkout flow (15KB) |
| `Web/controllers/webhooks.js` | Payment webhooks (16KB) |
