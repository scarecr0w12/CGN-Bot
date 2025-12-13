---
layout: default
title: Troubleshooting
nav_order: 6
parent: Guide
description: "Common issues and solutions for SkynetBot"
permalink: /guide/troubleshooting/
---

# Troubleshooting Guide

Common issues and their solutions.

---

## Bot Issues

### Bot Not Coming Online

**Symptoms**: Bot shows as offline in Discord.

**Solutions**:

1. **Check token**: Verify `DISCORD_CLIENT_TOKEN` in `.env` is correct
2. **Check logs**: `docker compose logs bot` or check `logs/` folder
3. **Regenerate token**: If token was leaked, regenerate in Discord Developer Portal
4. **Check intents**: Ensure all required intents are enabled in Developer Portal

```bash
# Check if process is running
pm2 status
# or
docker compose ps
```

### Bot Not Responding to Commands

**Symptoms**: Bot is online but ignores commands.

**Solutions**:

1. **Check prefix**: Use `@BotName prefix` to check current prefix
2. **Check permissions**: Bot needs "Send Messages" and "View Channel"
3. **Check quiet mode**: `!quiet stop` to disable quiet mode
4. **Check disabled commands**: Command may be disabled for this server/channel

### "Missing Permissions" Errors

**Symptoms**: Bot says it lacks permissions.

**Solutions**:

1. **Role hierarchy**: Bot role must be above target user's highest role
2. **Channel permissions**: Check channel-specific permission overrides
3. **Kick bot and re-invite**: With proper permissions selected

---

## Database Issues

### "Database Connection Failed"

**Symptoms**: Bot crashes with database errors.

**MongoDB Solutions**:

```bash
# Check MongoDB is running
sudo systemctl status mongodb

# Start MongoDB
sudo systemctl start mongodb

# Check connection string
echo $DATABASE_URL
```

**MariaDB Solutions**:

```bash
# Check MariaDB is running
sudo systemctl status mariadb

# Test connection
mysql -h $MARIADB_HOST -u $MARIADB_USER -p$MARIADB_PASSWORD $MARIADB_DATABASE

# Check user permissions
mysql -e "SHOW GRANTS FOR 'skynet'@'localhost';"
```

### "Collection/Table Not Found"

**Solutions**:

```bash
# Run migrations (MariaDB)
node scripts/migrate-to-mariadb.js

# Seed initial data
node scripts/seed-wiki.js
node scripts/seed-tiers.js
```

### Query Returns Empty/Wrong Data

**Solutions**:

1. Check `.exec()` is called on queries (required by custom ODM)
2. Verify document IDs are correct format
3. Check query syntax matches schema

```javascript
// ❌ Wrong - returns Cursor, not Array
const users = await Users.find({});

// ✅ Correct - returns Array
const users = await Users.find({}).exec();
```

---

## Web Dashboard Issues

### "Cannot Login" / OAuth Errors

**Symptoms**: Login redirects fail or show errors.

**Solutions**:

1. **Check callback URL**: In Discord Developer Portal, add:
   - `https://your-domain.com/login/callback`
   
2. **Check environment**:
   ```bash
   # Verify these are set correctly
   echo $DISCORD_CLIENT_ID
   echo $DISCORD_CLIENT_SECRET
   echo $HOSTING_URL
   ```

3. **Check HTTPS**: OAuth requires HTTPS in production

4. **Clear cookies**: Browser may have stale session

### "Session Expired" Repeatedly

**Solutions**:

1. **Set SESSION_SECRET**: Must be a random string
2. **Redis session store**: If using Redis, verify connection
3. **Cookie settings**: Check domain matches HOSTING_URL

```bash
# Generate new session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Dashboard Shows "No Servers"

**Solutions**:

1. **Bot not in servers**: Invite bot first
2. **Cache stale**: Wait a few minutes or restart bot
3. **Permissions**: User needs "Manage Server" permission

### 404 Errors on Dashboard Routes

**Solutions**:

1. **Check route exists**: Review `Web/routes/` files
2. **Middleware order**: Auth middleware must come before route handlers
3. **API vs general router**: API routes need `/api` prefix

---

## Command Issues

### "Command Not Found"

**Solutions**:

1. **Check command exists**: `!help` shows available commands
2. **Check enabled**: Command may be disabled for server
3. **Check admin level**: User may lack required permission level

### "Rate Limited"

**Symptoms**: Bot says you're using commands too fast.

**Solutions**:

1. **Wait for cooldown**: Cooldowns reset after specified time
2. **Premium bypass**: Premium servers may have reduced cooldowns
3. **Check rate limit config**: Dashboard → Commands → Options

### Command Shows Error

**Solutions**:

1. **Check logs**: Error details in bot logs
2. **Check arguments**: Use `!help <command>` for usage
3. **Report bug**: Create GitHub issue with error details

---

## Extension Issues

### Extension Not Loading

**Solutions**:

1. **Check syntax**: Extension code must be valid JavaScript
2. **Check scopes**: Extension needs proper scope declarations
3. **Check version**: Extension may be incompatible with current bot version

### Extension Crashes Bot

**Solutions**:

Extensions run in sandbox, but if issues occur:

1. **Disable extension**: Dashboard → Extensions → Disable
2. **Check memory limits**: Extension may exceed memory quota
3. **Remove problematic extension**: Delete from `extensions/` folder

### "Extension Scope Not Allowed"

**Solutions**:

1. **Add required scope**: In extension builder, add needed scopes
2. **Resubmit for review**: Scope changes require re-approval
3. **Use alternative API**: Find scope-free alternative

---

## Payment Issues

### Stripe Webhooks Failing

**Solutions**:

1. **Check webhook secret**: `STRIPE_WEBHOOK_SECRET` must match Stripe dashboard
2. **Check endpoint URL**: Webhook URL in Stripe must be correct
3. **Check HTTPS**: Webhooks require valid HTTPS

```bash
# Test with Stripe CLI
stripe listen --forward-to localhost/api/webhooks/stripe
```

### "Payment Failed"

**Solutions**:

1. **Check card details**: User entered correct information
2. **Check Stripe dashboard**: View failure reason in Stripe
3. **3D Secure**: Some cards require additional verification

### Subscription Not Activating

**Solutions**:

1. **Webhook delay**: May take a few seconds to process
2. **Check logs**: Look for webhook processing errors
3. **Manual activation**: Maintainer can manually set tier

---

## Performance Issues

### Bot Responding Slowly

**Solutions**:

1. **Check shard count**: May need more shards for large bot
2. **Enable Redis**: Caching improves response times
3. **Database indexes**: Ensure indexes exist on queried fields
4. **Check memory**: Node.js may need more memory

```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" node master.js
```

### High Memory Usage

**Solutions**:

1. **Check for leaks**: Review recent code changes
2. **Limit cache sizes**: Discord.js cache can grow large
3. **Restart periodically**: PM2 can auto-restart on memory threshold

```bash
# PM2 memory limit restart
pm2 start master.js --max-memory-restart 1G
```

### Database Slow

**Solutions**:

1. **Add indexes**: Create indexes on frequently queried fields
2. **Connection pooling**: Increase pool size for high traffic
3. **Query optimization**: Use `.limit()` and projections

---

## Docker Issues

### Container Won't Start

```bash
# Check logs
docker compose logs bot

# Rebuild image
docker compose build --no-cache bot

# Check for port conflicts
sudo lsof -i :80
sudo lsof -i :443
```

### Container Networking Issues

```bash
# Check network
docker network ls
docker network inspect cgn-bot_default

# Use host networking if needed
network_mode: host
```

---

## Common Error Messages

### "ECONNREFUSED"

Database or external service not reachable.

```bash
# Check service is running
sudo systemctl status mongodb
sudo systemctl status mariadb
```

### "ETIMEDOUT"

Network timeout connecting to external service.

1. Check internet connectivity
2. Check firewall rules
3. Increase timeout values

### "ENOMEM"

Out of memory.

```bash
# Check memory usage
free -h

# Increase swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### "EACCES"

Permission denied.

```bash
# Fix file permissions
sudo chown -R $USER:$USER /path/to/bot

# Fix port permissions (for port 80/443)
sudo setcap 'cap_net_bind_service=+ep' $(which node)
```

---

## Getting Help

If you can't resolve an issue:

1. **Check logs**: Full error messages help diagnose
2. **Search issues**: [GitHub Issues](https://github.com/scarecr0w12/CGN-Bot/issues)
3. **Join Discord**: [Support Server](https://discord.gg/GSZfe5sBp6)
4. **Create issue**: Include logs, steps to reproduce, and environment info

---

## Next Steps

- [Installation](installation) - Reinstall if needed
- [Configuration](configuration) - Review settings
- [Testing](testing) - Verify components
