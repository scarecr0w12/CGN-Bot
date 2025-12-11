---
description: Start the development environment with Docker containers and verify all services are running
---

# Start Development Environment

## Steps

1. Check if Docker is running:
// turbo
```bash
docker info > /dev/null 2>&1 && echo "Docker is running" || echo "Docker is NOT running"
```

2. Build and start the bot container:
```bash
docker compose up -d --build bot
```

3. Start supporting services (phpMyAdmin for database management):
// turbo
```bash
docker compose up -d phpmyadmin
```

4. (Optional) If using MongoDB, start with the mongodb profile:
```bash
docker compose --profile mongodb up -d mongo
```

5. Verify all containers are running:
// turbo
```bash
docker compose ps
```

6. Check bot container logs for startup errors:
// turbo
```bash
docker logs skynetbot --tail 50
```

7. Verify the web dashboard is accessible:
// turbo
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 || echo "Web server not responding"
```

## Troubleshooting

- If the bot fails to start, check `.env` file exists and has required variables
- If database connection fails, verify MariaDB is running on host: `systemctl status mariadb`
- Check `logs/` directory for detailed error logs
