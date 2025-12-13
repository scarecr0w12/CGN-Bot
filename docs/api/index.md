---
layout: default
title: API Reference
nav_order: 3
description: "REST API documentation for SkynetBot"
permalink: /api/
---

# API Reference

SkynetBot provides a REST API for programmatic access to bot data and functionality.

---

## Authentication

Most API endpoints require authentication via session cookie or API token.

### Session Authentication

Login through the web dashboard to get a session cookie.

### API Token (Premium)

Premium servers can generate API tokens:

1. Dashboard → Settings → API
2. Generate new token
3. Use in `Authorization` header

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-bot.com/api/servers
```

---

## Base URL

```
https://your-bot-domain.com/api
```

---

## Rate Limits

| Tier | Limit |
|:-----|:------|
| Standard | 150 requests/hour |
| Premium | Unlimited |

Rate limit headers:
- `X-RateLimit-Limit`: Total allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

---

## Endpoints

### Status

#### GET /api/status

Get bot status and health information.

**Authentication**: None required

**Response**:
```json
{
  "status": "online",
  "uptime": 86400,
  "shards": 1,
  "guilds": 150,
  "users": 50000,
  "version": "5.0.0",
  "latency": 45
}
```

---

### Servers

#### GET /api/servers

List servers the authenticated user can manage.

**Authentication**: Required

**Response**:
```json
{
  "servers": [
    {
      "id": "123456789",
      "name": "My Server",
      "icon": "abc123",
      "memberCount": 500,
      "premium": true
    }
  ]
}
```

#### GET /api/servers/:id

Get detailed server information.

**Authentication**: Required (must have access)

**Response**:
```json
{
  "id": "123456789",
  "name": "My Server",
  "icon": "abc123",
  "memberCount": 500,
  "config": {
    "prefix": "!",
    "modlog_channel": "987654321"
  },
  "subscription": {
    "tier": "premium",
    "expires_at": "2025-12-31T23:59:59Z"
  }
}
```

---

### Users

#### GET /api/users/@me

Get current authenticated user.

**Authentication**: Required

**Response**:
```json
{
  "id": "123456789",
  "username": "User",
  "discriminator": "0",
  "avatar": "abc123",
  "subscription": {
    "tier": "free"
  }
}
```

#### GET /api/users/:id

Get user profile (limited info).

**Authentication**: Required

**Response**:
```json
{
  "id": "123456789",
  "username": "User",
  "avatar": "abc123",
  "points": 1500,
  "rank": 5
}
```

---

### Commands

#### GET /api/servers/:id/commands

List server commands and their status.

**Authentication**: Required

**Response**:
```json
{
  "commands": [
    {
      "name": "ping",
      "category": "Utility",
      "enabled": true,
      "adminLevel": 0,
      "cooldown": 3
    }
  ]
}
```

#### PATCH /api/servers/:id/commands/:name

Update command settings.

**Authentication**: Required (Admin Level 3)

**Body**:
```json
{
  "enabled": false,
  "adminLevel": 1
}
```

---

### Extensions

#### GET /api/extensions

List public extensions from gallery.

**Response**:
```json
{
  "extensions": [
    {
      "id": "abc123",
      "name": "Blackjack",
      "description": "Classic card game",
      "author": "user123",
      "installs": 150,
      "rating": 4.5
    }
  ]
}
```

#### GET /api/servers/:id/extensions

List installed extensions for a server.

**Authentication**: Required

#### POST /api/servers/:id/extensions/:extid/install

Install an extension.

**Authentication**: Required (Admin Level 3)

#### DELETE /api/servers/:id/extensions/:extid

Uninstall an extension.

**Authentication**: Required (Admin Level 3)

---

### Economy

#### GET /api/servers/:id/economy/leaderboard

Get server economy leaderboard.

**Query Parameters**:
- `limit`: Number of results (default: 10, max: 100)
- `offset`: Pagination offset

**Response**:
```json
{
  "leaderboard": [
    {
      "user_id": "123456789",
      "username": "RichUser",
      "balance": 50000,
      "rank": 1
    }
  ],
  "total": 500
}
```

#### GET /api/users/:id/economy

Get user economy stats.

**Response**:
```json
{
  "wallet": 1000,
  "bank": 5000,
  "daily_streak": 7,
  "last_daily": "2025-01-01T12:00:00Z"
}
```

---

### Points

#### GET /api/servers/:id/points/leaderboard

Get server points leaderboard.

**Response**:
```json
{
  "leaderboard": [
    {
      "user_id": "123456789",
      "username": "ActiveUser",
      "points": 15000,
      "rank": "Veteran"
    }
  ]
}
```

---

### Moderation

#### GET /api/servers/:id/modlog

Get moderation log entries.

**Authentication**: Required (Admin Level 1+)

**Query Parameters**:
- `limit`: Results per page
- `offset`: Pagination offset
- `type`: Filter by action type (ban, kick, mute, strike)
- `user`: Filter by user ID

**Response**:
```json
{
  "entries": [
    {
      "id": "entry123",
      "type": "strike",
      "user_id": "123456789",
      "moderator_id": "987654321",
      "reason": "Spam",
      "timestamp": "2025-01-01T12:00:00Z"
    }
  ],
  "total": 150
}
```

#### GET /api/servers/:id/strikes/:userId

Get user's strikes.

**Response**:
```json
{
  "user_id": "123456789",
  "strikes": 3,
  "history": [
    {
      "id": "strike1",
      "reason": "Spam",
      "moderator": "987654321",
      "timestamp": "2025-01-01T12:00:00Z"
    }
  ]
}
```

---

### Statistics (Premium)

#### GET /api/servers/:id/stats/analytics

Get advanced analytics.

**Authentication**: Required (Premium)

**Response**:
```json
{
  "overview": {
    "total_members": 500,
    "active_members": 150,
    "messages_today": 2500
  },
  "activity": {
    "hourly": [...],
    "daily": [...],
    "weekly": [...]
  },
  "top_channels": [...],
  "top_commands": [...]
}
```

---

### Webhooks (Premium)

#### POST /api/servers/:id/webhooks

Create a webhook subscription.

**Body**:
```json
{
  "url": "https://your-server.com/webhook",
  "events": ["member_join", "member_leave", "message"],
  "secret": "your_webhook_secret"
}
```

#### GET /api/servers/:id/webhooks

List configured webhooks.

#### DELETE /api/servers/:id/webhooks/:webhookId

Delete a webhook.

---

## Error Responses

All errors follow this format:

```json
{
  "error": true,
  "code": "UNAUTHORIZED",
  "message": "Authentication required"
}
```

### Error Codes

| Code | HTTP Status | Description |
|:-----|:------------|:------------|
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| RATE_LIMITED | 429 | Too many requests |
| SERVER_ERROR | 500 | Internal server error |

---

## Webhooks

Premium servers can receive webhooks for events:

### Events

| Event | Description |
|:------|:------------|
| `member_join` | Member joined server |
| `member_leave` | Member left server |
| `member_ban` | Member was banned |
| `message` | Message sent (high volume) |
| `command` | Command executed |
| `moderation` | Moderation action taken |

### Webhook Payload

```json
{
  "event": "member_join",
  "timestamp": "2025-01-01T12:00:00Z",
  "server_id": "123456789",
  "data": {
    "user_id": "987654321",
    "username": "NewUser"
  },
  "signature": "sha256=..."
}
```

### Signature Verification

Webhooks include HMAC signature for verification:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

---

## SDK / Libraries

Currently no official SDKs. Use any HTTP client:

```javascript
// JavaScript/Node.js
const response = await fetch('https://bot.com/api/status');
const data = await response.json();
```

```python
# Python
import requests
response = requests.get('https://bot.com/api/status')
data = response.json()
```

---

## Next Steps

- [Getting Started](/guide/getting-started) - Basic setup
- [Configuration](/guide/configuration) - API configuration
- [Extensions](/guide/extensions) - Build integrations
