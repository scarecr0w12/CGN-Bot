---
layout: default
title: Installation
nav_order: 1
parent: Guide
description: "Complete installation guide for SkynetBot"
permalink: /guide/installation/
---

# Installation Guide

This guide covers installing SkynetBot on your own server for self-hosting.

---

## Prerequisites

Before installing, ensure you have:

- **Node.js 18+** (22.x recommended)
- **npm** or **yarn** package manager
- **Database**: MongoDB 6+ OR MariaDB 10.11+
- **Redis** (optional, for caching)
- **Git** for cloning the repository

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/scarecr0w12/CGN-Bot.git
cd CGN-Bot
```

---

## Step 2: Install Dependencies

```bash
npm install
# or
yarn install
```

---

## Step 3: Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** and give it a name
3. Go to **Bot** section and click **Add Bot**
4. Copy the **Token** (you'll need this for `.env`)
5. Under **Privileged Gateway Intents**, enable:
   - Presence Intent
   - Server Members Intent
   - Message Content Intent
6. Go to **OAuth2 → URL Generator**:
   - Select scopes: `bot`, `applications.commands`
   - Select permissions: Administrator (or specific permissions)
   - Copy the generated URL to invite the bot

---

## Step 4: Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

### Required Settings

```bash
# Discord Bot Credentials
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_CLIENT_TOKEN=your_bot_token

# Web Dashboard
HOSTING_URL=https://your-domain.com/
SERVER_IP=0.0.0.0
HTTP_PORT=80
HTTPS_PORT=443
SESSION_SECRET=generate-a-random-string
ENCRYPTION_PASSWORD=generate-another-random-string

# Database (choose one)
DATABASE_TYPE=mongodb  # or 'mariadb'

# MongoDB
DATABASE_URL=mongodb://localhost:27017/
DATABASE_NAME=skynetbot

# MariaDB (if using MariaDB)
MARIADB_HOST=localhost
MARIADB_PORT=3306
MARIADB_USER=skynet
MARIADB_PASSWORD=your_password
MARIADB_DATABASE=skynet
```

### Optional Settings

```bash
# Redis (for caching)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Payment Providers
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Monitoring
SENTRY_DSN=https://...
```

---

## Step 5: Database Setup

### Option A: MongoDB

```bash
# Install MongoDB
sudo apt install mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### Option B: MariaDB

```bash
# Install MariaDB
sudo apt install mariadb-server

# Secure installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -e "CREATE DATABASE skynet;"
sudo mysql -e "CREATE USER 'skynet'@'localhost' IDENTIFIED BY 'your_password';"
sudo mysql -e "GRANT ALL PRIVILEGES ON skynet.* TO 'skynet'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# Run migrations
node scripts/migrate-to-mariadb.js
```

---

## Step 6: Start the Bot

### Development Mode

```bash
node master.js
```

### Production Mode (with PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start master.js --name skynetbot

# Enable startup on reboot
pm2 startup
pm2 save
```

### Docker Mode

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f bot
```

---

## Step 7: Initial Setup

1. Visit your dashboard URL (e.g., `https://your-domain.com`)
2. Login with Discord
3. Access the Maintainer Console (if you're the first user, you'll be auto-admin)
4. Configure site settings, tiers, and features

---

## Docker Installation

For a complete Docker setup:

```yaml
# docker-compose.yml is included in the repository
services:
  bot:
    build: .
    env_file: .env
    volumes:
      - ./logs:/usr/src/app/logs
    
  mongo:  # if using MongoDB
    image: mongo:6
    volumes:
      - ./data/mongo:/data/db
    
  uptime-kuma:  # optional monitoring
    image: louislam/uptime-kuma:2
    
  prometheus:  # optional metrics
    image: prom/prometheus:latest
    
  grafana:  # optional dashboards
    image: grafana/grafana:latest
```

Start with:

```bash
# MongoDB profile
docker compose --profile mongodb up -d

# Or without MongoDB (using external database)
docker compose up -d
```

---

## Seed Data (Optional)

Populate initial data:

```bash
# Seed wiki documentation
node scripts/seed-wiki.js

# Seed blog posts
node scripts/seed-blog-posts.js

# Seed extensions
node scripts/seed-extensions.js

# Seed tiers and features
node scripts/seed-tiers.js
```

---

## SSL/HTTPS Setup

### Option A: Let's Encrypt (Certbot)

```bash
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com
```

### Option B: Cloudflare (Recommended)

1. Add your domain to Cloudflare
2. Set SSL mode to "Full (strict)"
3. Enable "Always Use HTTPS"
4. Set environment variables:

```bash
CLOUDFLARE_API_TOKEN=your_token
CLOUDFLARE_ZONE_ID=your_zone_id
CLOUDFLARE_PROXY_ENABLED=true
```

---

## Nginx Reverse Proxy (Optional)

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Verification

After installation, verify everything works:

```bash
# Check bot status
curl http://localhost/api/status

# Check database connection
node -e "require('./Database/Driver').then(db => console.log('Connected!'))"

# Check Discord connection
# Bot should appear online in Discord
```

---

## Next Steps

- [Configuration Guide](configuration) - Configure all features
- [Getting Started](getting-started) - Set up your first server
- [Testing Guide](testing) - Test your installation
- [Troubleshooting](troubleshooting) - Common issues
