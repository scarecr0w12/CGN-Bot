---
layout: default
title: Testing
nav_order: 5
parent: Guide
description: "Testing guide for SkynetBot installations"
permalink: /guide/testing/
---

# Testing Guide

This guide covers testing your SkynetBot installation to ensure everything works correctly.

---

## Quick Health Check

### 1. Bot Status

Check if the bot is online and responding:

```bash
# Via API
curl http://localhost/api/status

# Via Discord
!ping
```

Expected response: Bot latency and shard information.

### 2. Database Connection

```bash
# Test database connection
node -e "
const Database = require('./Database/Driver');
Database.then(db => {
  console.log('✅ Database connected');
  process.exit(0);
}).catch(err => {
  console.error('❌ Database error:', err.message);
  process.exit(1);
});
"
```

### 3. Web Dashboard

1. Visit your dashboard URL
2. Click "Login with Discord"
3. Verify OAuth flow completes
4. Check server list loads

---

## Component Testing

### Discord Connection

```bash
# Check bot is online
!stats

# Expected output:
# - Shard count
# - Server count
# - User count
# - Uptime
```

### Command Framework

Test each command category:

```bash
# Utility commands
!ping
!help
!info

# Fun commands
!8ball Will this work?
!roll 1d20
!choose option1 | option2

# Moderation (requires admin)
!modlog status
```

### Economy System

```bash
# Test economy flow
!balance          # Should show 0 or starting balance
!daily            # Claim daily reward
!balance          # Should show updated balance
!deposit 100      # Move to bank
!withdraw 50      # Take from bank
```

### AI System (if configured)

```bash
!ai ask Hello, how are you?
```

Expected: AI response within a few seconds.

---

## Extension Testing

### Install Test Extension

1. Go to Dashboard → Extensions
2. Browse the gallery
3. Install any extension
4. Test the extension command

### Extension Sandbox

Extensions run in an isolated sandbox. Test isolation:

```bash
# Install and run an extension
# Verify it cannot access system files
# Verify rate limits apply
```

---

## Integration Testing

### Webhook Testing

If using payment webhooks:

```bash
# Stripe CLI (for local testing)
stripe listen --forward-to localhost/api/webhooks/stripe

# Test webhook
stripe trigger payment_intent.succeeded
```

### OAuth Testing

Test each OAuth provider:

1. Google: Dashboard → Account → Link Google
2. GitHub: Dashboard → Account → Link GitHub
3. Twitch: Dashboard → Account → Link Twitch

---

## Load Testing

### Basic Load Test

```bash
# Install autocannon
npm install -g autocannon

# Test API endpoint
autocannon -c 10 -d 30 http://localhost/api/status

# Expected: >100 requests/second
```

### Stress Testing Commands

```bash
# In Discord, rapid command usage
# Bot should handle rate limiting gracefully
!ping !ping !ping !ping !ping
```

---

## Database Testing

### MongoDB Tests

```bash
# Check collections exist
node -e "
const Database = require('./Database/Driver');
Database.then(async db => {
  const collections = ['servers', 'users', 'gallery', 'wiki'];
  for (const col of collections) {
    const count = await db.collection(col).countDocuments();
    console.log(col + ': ' + count + ' documents');
  }
  process.exit(0);
});
"
```

### MariaDB Tests

```bash
# Check tables exist
mysql -u skynet -p skynet -e "SHOW TABLES;"

# Check row counts
mysql -u skynet -p skynet -e "
  SELECT 'servers' as tbl, COUNT(*) as cnt FROM servers
  UNION SELECT 'users', COUNT(*) FROM users
  UNION SELECT 'gallery', COUNT(*) FROM gallery;
"
```

---

## Monitoring Tests

### Prometheus Metrics

```bash
# Check metrics endpoint
curl http://localhost:9090/api/v1/targets

# Verify all targets are UP
```

### Grafana Dashboards

1. Visit Grafana (default: http://localhost:3002)
2. Login (default: admin/admin)
3. Check dashboards load
4. Verify data is appearing

### Uptime Kuma

1. Visit Uptime Kuma (default: http://localhost:3001)
2. Check all monitors are UP
3. Verify push heartbeats are received

---

## Security Testing

### Permission Testing

```bash
# Test unauthorized access
curl -X POST http://localhost/api/admin/settings
# Expected: 401 Unauthorized

# Test with invalid token
curl -H "Authorization: Bearer invalid" http://localhost/api/user
# Expected: 401 Unauthorized
```

### Rate Limiting

```bash
# Rapid API requests
for i in {1..200}; do curl -s http://localhost/api/status; done
# Expected: 429 Too Many Requests after limit
```

---

## Automated Testing

### Unit Tests

```bash
# Run test suite
npm test

# Run specific test
npm test -- --grep "Schema"
```

### Test Files

The project includes tests in `/tests/`:

- `Schema.test.js` - Database schema validation

---

## Troubleshooting Failed Tests

### Bot Not Responding

1. Check logs: `docker compose logs bot`
2. Verify token is correct in `.env`
3. Check Discord API status

### Database Errors

1. Check connection string
2. Verify database is running
3. Check user permissions

### Web Dashboard Issues

1. Check SESSION_SECRET is set
2. Verify HOSTING_URL matches actual URL
3. Check OAuth callback URLs in Discord Developer Portal

---

## Test Checklist

Use this checklist for new installations:

- [ ] Bot appears online in Discord
- [ ] `!ping` responds with latency
- [ ] `!help` shows command list
- [ ] Web dashboard loads
- [ ] OAuth login works
- [ ] Server list appears after login
- [ ] Dashboard settings save correctly
- [ ] `!daily` works (economy)
- [ ] `!ai ask` works (if configured)
- [ ] Extensions can be installed
- [ ] Moderation commands work
- [ ] Logs appear in mod-log channel
- [ ] Prometheus metrics available
- [ ] Grafana dashboards load

---

## Next Steps

- [Troubleshooting](troubleshooting) - Common issues
- [Configuration](configuration) - Advanced setup
- [API Reference](../api/) - API documentation
