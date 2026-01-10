# Grafana Cloud - Quick Start

Your bot is now configured to use Grafana Cloud. Follow these steps to complete the migration.

## What Changed

✅ **Removed:** Local Grafana container from docker-compose.yml  
✅ **Added:** Promtail container for log shipping  
✅ **Updated:** Prometheus to send metrics to Grafana Cloud  
✅ **Added:** Environment variables for Grafana Cloud credentials

## Steps to Complete Setup

### 1. Get Your Grafana Cloud Credentials

Visit: **https://scarecr0w12.grafana.net/**

#### For Loki (Logs):
1. Go to **Connections** → **Data sources** → **Loki**
2. Copy the **Loki endpoint URL** (looks like: `https://logs-prod-XXX.grafana.net/loki/api/v1/push`)
3. Get your **username** (numeric ID)
4. Generate an **API Key**: **My Account** → **API Keys** → Create key with **Logs:Write** permission

#### For Prometheus (Metrics):
1. Go to **Connections** → **Data sources** → **Prometheus**
2. Copy the **Prometheus remote write URL** (looks like: `https://prometheus-prod-XXX.grafana.net/api/prom/push`)
3. Get your **username** (numeric instance ID)
4. Generate an **API Key**: **My Account** → **API Keys** → Create key with **Metrics:Write** permission

### 2. Update Your .env File

Add these credentials to your `.env` file:

```bash
# Grafana Cloud - Loki (Logs)
GRAFANA_LOKI_URL=https://logs-prod-XXX.grafana.net/loki/api/v1/push
GRAFANA_LOKI_USERNAME=your_loki_username
GRAFANA_LOKI_API_KEY=your_loki_api_key

# Grafana Cloud - Prometheus (Metrics)
GRAFANA_PROMETHEUS_URL=https://prometheus-prod-XXX.grafana.net/api/prom/push
GRAFANA_PROMETHEUS_USERNAME=your_prometheus_username
GRAFANA_PROMETHEUS_API_KEY=your_prometheus_api_key
```

### 3. Stop Local Grafana (if running)

```bash
docker-compose stop grafana
docker-compose rm -f grafana
```

### 4. Deploy New Services

```bash
# Start Promtail
docker-compose up -d promtail

# Restart Prometheus with new config
docker-compose restart prometheus
```

### 5. Verify Everything Works

**Check Promtail logs:**
```bash
docker logs skynetbot-promtail --tail 50
```
Look for: "clients/client.go" messages indicating successful log shipping

**Check Prometheus logs:**
```bash
docker logs skynetbot-prometheus --tail 50 | grep remote_write
```
Look for: Successful remote write messages

**View in Grafana Cloud:**
1. Go to https://scarecr0w12.grafana.net/
2. Navigate to **Explore**
3. Select **Loki** → Query: `{job="skynetbot"}`
4. Select **Prometheus** → Query: `up{job="skynetbot"}`

## Troubleshooting

**No logs appearing in Loki?**
- Verify env vars are set correctly in `.env`
- Check: `docker exec skynetbot-promtail promtail -config.file=/etc/promtail/config.yml -dry-run`
- Ensure logs exist: `ls -lh logs/`

**Prometheus not sending metrics?**
- Check env vars are passed to container
- Verify URLs don't have trailing slashes
- Check API key has **Metrics:Write** permission

**Permission denied errors?**
- Regenerate API keys with correct permissions
- Loki needs: **Logs:Write**
- Prometheus needs: **Metrics:Write**

## Next Steps

Once data is flowing:
1. Create dashboards in Grafana Cloud
2. Set up alerts (Discord webhooks recommended)
3. Configure log retention policies
4. Invite team members to your Grafana Cloud org

---

**Need help?** Check the full guide: `docs/GRAFANA_CLOUD_SETUP.md`
