---
layout: default
title: Configuration
nav_order: 7
parent: Guide
description: "Configuration guide for SkynetBot"
permalink: /guide/configuration/
---

# Configuration Guide

Complete configuration reference for SkynetBot.

---

## Environment Variables

All configuration is done via the `.env` file.

### Core Settings

```bash
# Discord Bot
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_CLIENT_TOKEN=your_bot_token
SHARD_TOTAL=auto                    # 'auto' or specific number
BOT_STATUS=online                   # online, idle, dnd, invisible
BOT_ACTIVITY_NAME=skynetbot.com
BOT_ACTIVITY_TYPE=PLAYING           # PLAYING, WATCHING, LISTENING, COMPETING
BOT_VERSION=5.0.0
BOT_BRANCH=production
```

### Web Dashboard

```bash
HOSTING_URL=https://your-domain.com/
SERVER_IP=0.0.0.0
HTTP_PORT=80
HTTPS_PORT=443
SESSION_SECRET=random-32-char-string
ENCRYPTION_PASSWORD=another-random-string
ENCRYPTION_IV=16-char-string
LOG_LEVEL=info                      # debug, info, warn, error
```

### Database

```bash
# Choose database type
DATABASE_TYPE=mongodb               # 'mongodb' or 'mariadb'

# MongoDB settings
DATABASE_URL=mongodb://localhost:27017/
DATABASE_NAME=skynetbot

# MariaDB settings
MARIADB_HOST=localhost
MARIADB_PORT=3306
MARIADB_USER=skynet
MARIADB_PASSWORD=your_password
MARIADB_DATABASE=skynet
MARIADB_POOL_SIZE=10
```

### Redis (Optional)

```bash
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### AI Providers

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Groq
GROQ_API_KEY=gsk_...

# Ollama (local)
OLLAMA_URL=http://localhost:11434
```

### Payment Providers

```bash
# Stripe
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# BTCPay
BTCPAY_SERVER_URL=https://btcpay.example.com
BTCPAY_STORE_ID=...
BTCPAY_API_KEY=...
BTCPAY_WEBHOOK_SECRET=...
```

### OAuth Providers

```bash
# Google
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...

# GitHub
GITHUB_OAUTH_CLIENT_ID=...
GITHUB_OAUTH_CLIENT_SECRET=...

# Twitch
TWITCH_OAUTH_CLIENT_ID=...
TWITCH_OAUTH_CLIENT_SECRET=...
```

### Monitoring

```bash
# Sentry
SENTRY_DSN=https://...

# Uptime Kuma
UPTIME_KUMA_URL=http://localhost:3001
UPTIME_KUMA_API_KEY=...
UPTIME_KUMA_PUSH_TOKEN=...

# Grafana
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=secure_password
GRAFANA_ROOT_URL=http://localhost:3002
```

### Cloudflare

```bash
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ZONE_ID=...
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_PROXY_ENABLED=true
CLOUDFLARE_REQUIRE_PROXY=false
CLOUDFLARE_BLOCKED_COUNTRIES=
```

---

## Dashboard Configuration

### Site Settings

Access via Maintainer Console → Site Settings:

| Setting | Description |
|:--------|:------------|
| Site Name | Displayed in header and title |
| Site Description | SEO description |
| Support Server | Discord invite link |
| Bot Invite | OAuth invite URL |
| Theme | Default dashboard theme |

### Membership Tiers

Configure premium tiers at Maintainer Console → Tiers:

| Field | Description |
|:------|:------------|
| Name | Tier display name |
| Level | Tier priority (higher = better) |
| Price Monthly | Monthly cost |
| Yearly Discount | Percentage off for yearly |
| Features | Enabled features for tier |

### Feature Registry

Enable/disable features at Maintainer Console → Features:

| Category | Features |
|:---------|:---------|
| Bot | ai_chat, ai_images, voice_features |
| Dashboard | premium_dashboard, advanced_stats, export_data |
| API | api_access, api_webhooks, api_unlimited |
| General | priority_support, early_access, custom_prefix |

---

## Server-Level Configuration

### Via Dashboard

Each server has configurable options:

**Commands → Options**
- Command prefix
- Cooldown settings
- Channel restrictions

**Admins**
- User admin levels
- Role-based permissions

**Moderation**
- Mod log channel
- Strike thresholds
- Auto-mod filters

**Points & Ranks**
- Points per message
- Voice time points
- Rank thresholds
- Role rewards

**Messages**
- Welcome channel and message
- Leave message
- Message of the day

### Via Commands

```bash
# Change prefix
!prefix ?

# Enable/disable commands
!enable trivia
!disable gamble

# Set up modlog
!modlog enable #mod-logs

# Configure starboard
!starboard channel #starboard
!starboard threshold 5
!starboard enable

# Quiet mode
!quiet start     # Disable bot in channel
!quiet stop      # Re-enable bot
```

---

## AI Configuration

### Per-Server Settings

Dashboard → AI Settings:

| Setting | Description |
|:--------|:------------|
| Provider | Default AI provider |
| Model | Default model |
| System Prompt | AI personality |
| Temperature | Response randomness (0-2) |
| Max Tokens | Response length limit |

### AI Governance

Dashboard → AI Governance:

| Setting | Description |
|:--------|:------------|
| Allowed Models | Whitelist specific models |
| Blocked Models | Blacklist models |
| Daily Token Limit | Per-user token budget |
| Cooldown | Seconds between requests |

### Rate Limiting

Default rate limits:

| Limit | Default |
|:------|:--------|
| Cooldown | 5 seconds |
| Daily per user | 100 requests |
| Tokens per day | 50,000 |

---

## Economy Configuration

### Server Settings

Dashboard → Economy:

| Setting | Description |
|:--------|:------------|
| Starting Balance | New user coins |
| Daily Reward | Base daily amount |
| Streak Multiplier | Daily streak bonus |
| Work Cooldown | Seconds between work |
| Rob Success Rate | Robbery chance (%) |

### Shop Items

Add items via Dashboard → Economy → Shop:

- Name and description
- Price in coins
- Stock limit (optional)
- Role reward (optional)

---

## Extension Configuration

### Global Settings

Maintainer Console → Extensions:

| Setting | Description |
|:--------|:------------|
| Allow Submissions | Accept new extensions |
| Auto-Approve | Skip review queue |
| Max Storage | Per-extension storage limit |

### Per-Server

Dashboard → Extensions:

- Enable/disable installed extensions
- Configure extension-specific settings
- View extension logs

---

## Logging Configuration

### Log Levels

Set `LOG_LEVEL` in `.env`:

| Level | Description |
|:------|:------------|
| debug | All messages including debug |
| info | Informational and above |
| warn | Warnings and errors only |
| error | Errors only |

### Log Files

Logs are stored in `/logs/`:

- `combined.log` - All logs
- `error.log` - Errors only
- `bot.log` - Bot-specific logs

### Sentry Integration

For error tracking, set `SENTRY_DSN` and errors are automatically captured.

---

## Performance Tuning

### Node.js Memory

```bash
# Increase memory limit
NODE_OPTIONS="--max-old-space-size=4096" node master.js
```

### Database Connection Pool

```bash
# MariaDB
MARIADB_POOL_SIZE=20

# MongoDB (in connection string)
DATABASE_URL=mongodb://localhost:27017/?maxPoolSize=20
```

### Redis Caching

Enable Redis for improved performance:

```bash
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

Caches:
- User sessions
- Tier lookups
- Rate limiting
- Temporary data

### Shard Configuration

```bash
# Auto-calculate shards
SHARD_TOTAL=auto

# Or specify manually
SHARD_TOTAL=4
```

---

## Security Configuration

### Session Security

```bash
# Strong random secrets
SESSION_SECRET=$(openssl rand -hex 32)
ENCRYPTION_PASSWORD=$(openssl rand -hex 32)
```

### Rate Limiting

Built-in rate limiting:
- API: 150 requests/hour (standard), unlimited (premium)
- Commands: Category-specific cooldowns
- OAuth: 10 attempts/minute

### Cloudflare Security

```bash
CLOUDFLARE_REQUIRE_PROXY=true    # Block direct access
CLOUDFLARE_BLOCKED_COUNTRIES=CN,RU  # Block countries
```

---

## Backup Configuration

### Database Backups

MongoDB:
```bash
mongodump --db skynetbot --out /backup/$(date +%Y%m%d)
```

MariaDB:
```bash
mysqldump -u skynet -p skynet > /backup/skynet_$(date +%Y%m%d).sql
```

### Automated Backups

Add to crontab:
```bash
0 2 * * * /path/to/backup-script.sh
```

---

## Next Steps

- [Installation](installation) - Initial setup
- [Testing](testing) - Verify configuration
- [Troubleshooting](troubleshooting) - Fix issues
