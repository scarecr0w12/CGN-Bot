---
description: View and analyze bot logs for debugging and monitoring
---

# Check Logs

## Quick Log Commands

1. View recent bot container logs:
// turbo
```bash
docker logs skynetbot --tail 100
```

2. Follow logs in real-time:
```bash
docker logs skynetbot -f
```

3. Filter for errors only:
// turbo
```bash
docker logs skynetbot 2>&1 | grep -iE "error|exception|failed|warn" | tail -50
```

4. Check file-based logs:
// turbo
```bash
ls -la /root/bot/logs/
```

5. View latest log file:
// turbo
```bash
tail -100 /root/bot/logs/*.log 2>/dev/null | head -100
```

## Specific Log Searches

### Database Issues
// turbo
```bash
docker logs skynetbot 2>&1 | grep -iE "database|mongo|maria|sql|query" | tail -20
```

### Discord API Issues
// turbo
```bash
docker logs skynetbot 2>&1 | grep -iE "discord|gateway|shard|ratelimit" | tail -20
```

### Web Server Issues
// turbo
```bash
docker logs skynetbot 2>&1 | grep -iE "express|route|http|request" | tail -20
```

### Extension Issues
// turbo
```bash
docker logs skynetbot 2>&1 | grep -iE "extension|sandbox|isolate" | tail -20
```

### AI/LLM Issues
// turbo
```bash
docker logs skynetbot 2>&1 | grep -iE "openai|anthropic|groq|ai\b" | tail -20
```

## Log Levels

The bot uses Winston logger with these levels:
- `error` - Critical failures
- `warn` - Potential issues
- `info` - Normal operations
- `debug` - Detailed debugging (if enabled)

## Sentry Integration

Errors are also sent to Sentry if configured. Check `.env` for `SENTRY_DSN`.
