---
description: Troubleshoot Express routes, controllers, and middleware issues
---

# Debug Web Routes

## Steps

1. List all registered routes:
// turbo
```bash
grep -r "router\.\(get\|post\|put\|delete\|patch\)" /root/bot/Web/routes/ --include="*.js" | head -30
```

2. Check route mounting order in the main app:
// turbo
```bash
grep -n "app.use\|router" /root/bot/Web/Server.js | head -30
```

3. Identify the controller for a specific route:
// turbo
```bash
# Replace 'activity' with the route you're debugging
grep -rn "activity" /root/bot/Web/routes/ /root/bot/Web/controllers/
```

4. Check middleware chain:
// turbo
```bash
cat /root/bot/Web/middleware/index.js
```

5. Enable debug logging by checking the controller's error handling:
// turbo
```bash
grep -n "catch\|error\|logger" /root/bot/Web/controllers/activity.js | head -20
```

6. Test the route directly:
```bash
# Replace with actual route - use authenticated session cookie if needed
curl -v http://localhost:8080/api/your-route
```

7. Check recent error logs:
// turbo
```bash
docker logs skynetbot 2>&1 | grep -iE "error|exception|failed" | tail -20
```

## Common Issues

### 404 Not Found
- Route may be mounted under wrong prefix (check `/api` vs `/` mounting)
- Route file not imported in router index

### 500 Internal Server Error  
- Check controller for `.exec()` calls on database queries
- Verify async/await usage and try/catch blocks

### Authentication Issues
- Check `authorizeDashboardAccess` middleware
- Verify session configuration in Server.js

## Route Structure
```
Web/
├── routes/           # Route definitions (URL → controller mapping)
├── controllers/      # Business logic
├── middleware/       # Auth, validation, rate limiting
└── views/           # EJS templates
```
