# Grafana Cloud Migration Guide

This guide walks you through completing the migration to Grafana Cloud for centralized logging and metrics.

## Prerequisites

- Grafana Cloud account at: https://scarecr0w12.grafana.net/
- Local Prometheus and Promtail containers configured (already done)

## Step 1: Get Grafana Cloud Credentials

### For Loki (Logs)

1. Go to https://scarecr0w12.grafana.net/
2. Navigate to **Connections** → **Data sources** → **Loki**
3. Look for the Loki endpoint URL (format: `https://logs-prod-XXX.grafana.net`)
4. Click on **Details** or **Settings** to find:
   - **Username** (typically a numeric user ID)
   - **API Key** (generate one if needed under **API Keys** → **Loki** → **Create API Key**)

### For Prometheus (Metrics)

1. In Grafana Cloud, go to **Connections** → **Data sources** → **Prometheus**
2. Find the Prometheus remote write endpoint (format: `https://prometheus-prod-XXX.grafana.net/api/prom/push`)
3. Get credentials:
   - **Username** (typically numeric instance ID)
   - **API Key** (generate one under **API Keys** → **Prometheus** → **Create API Key**)

Alternative path:
- Go to **My Account** → **Security** → **API Keys**
- Create separate keys for Loki and Prometheus with appropriate permissions

## Step 2: Update Configuration Files

### Update Promtail Config

Edit `monitoring/promtail/promtail-config.yaml`:

```yaml
clients:
  - url: https://logs-prod-XXX.grafana.net/loki/api/v1/push
    basic_auth:
      username: YOUR_LOKI_USERNAME
      password: YOUR_GRAFANA_CLOUD_API_KEY
```

Replace:
- `https://logs-prod-XXX.grafana.net` with your actual Loki endpoint
- `YOUR_LOKI_USERNAME` with your Loki username
- `YOUR_GRAFANA_CLOUD_API_KEY` with your generated API key

### Update Prometheus Config

Edit `monitoring/prometheus/prometheus.yml`:

```yaml
remote_write:
  - url: https://prometheus-prod-XXX.grafana.net/api/prom/push
    basic_auth:
      username: YOUR_PROMETHEUS_USERNAME
      password: YOUR_GRAFANA_CLOUD_API_KEY
```

Replace:
- `https://prometheus-prod-XXX.grafana.net` with your actual Prometheus endpoint
- `YOUR_PROMETHEUS_USERNAME` with your Prometheus username
- `YOUR_GRAFANA_CLOUD_API_KEY` with your generated API key

## Step 3: Deploy Services

### Start Promtail

```bash
docker-compose up -d promtail
```

### Restart Prometheus (to pick up new config)

```bash
docker-compose restart prometheus
```

### Verify Services

```bash
# Check Promtail is running and shipping logs
docker logs skynetbot-promtail

# Check Prometheus remote write is working
docker logs skynetbot-prometheus | grep "remote_write"
```

## Step 4: Verify in Grafana Cloud

### Check Logs in Loki

1. Go to https://scarecr0w12.grafana.net/
2. Navigate to **Explore**
3. Select **Loki** as data source
4. Run query: `{job="skynetbot"}`
5. You should see your bot logs appearing

### Check Metrics in Prometheus

1. In **Explore**, select **Prometheus** as data source
2. Run query: `up{job="skynetbot"}`
3. You should see metrics from your exporters

## Step 5: Create Dashboards

### Import Existing Dashboards (Optional)

If you have existing Grafana dashboards locally:

1. Export them from local Grafana: http://localhost:3002
2. Go to Grafana Cloud → **Dashboards** → **Import**
3. Paste the JSON and import

### Recommended Dashboards

Create dashboards for:
- **SkynetBot Overview**: Bot uptime, shard status, command rate
- **System Metrics**: CPU, memory, disk from node-exporter
- **Database**: MariaDB metrics from mariadb-exporter
- **Cache**: Redis metrics from redis-exporter
- **Logs**: Loki log panels with error/warn filtering

## Step 6: Set Up Alerts (Optional)

1. Go to **Alerting** → **Alert rules**
2. Create alerts for:
   - Bot offline: `up{job="skynetbot"} == 0`
   - High error rate: `count_over_time({job="skynetbot", level="error"}[5m]) > 10`
   - Memory usage: `node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes < 0.2`
3. Configure notification channels (Discord webhook, email, etc.)

## Step 7: Remove Local Grafana (Optional)

Once you're happy with Grafana Cloud, you can remove the local Grafana container:

```bash
# Stop and remove local Grafana
docker-compose stop grafana
docker-compose rm grafana
```

Edit `docker-compose.yml` and comment out or remove the `grafana:` service section.

**Note:** Keep Prometheus running locally - it still collects metrics and sends them to the cloud.

## Troubleshooting

### Promtail not shipping logs

```bash
# Check Promtail logs
docker logs skynetbot-promtail

# Verify log files exist
ls -lh logs/

# Test config syntax
docker exec skynetbot-promtail promtail -config.file=/etc/promtail/config.yml -dry-run
```

### Prometheus remote write failing

```bash
# Check Prometheus logs
docker logs skynetbot-prometheus

# Verify remote write config
docker exec skynetbot-prometheus cat /etc/prometheus/prometheus.yml

# Check metrics queue
# Go to http://localhost:9090/metrics and search for "prometheus_remote_storage"
```

### No data in Grafana Cloud

- Verify API keys have correct permissions (ReadWrite for Prometheus, Push for Loki)
- Check that URLs are correct (no typos in endpoints)
- Ensure firewall allows outbound HTTPS to *.grafana.net
- Wait 1-2 minutes for initial data to appear

## Cost Monitoring

Monitor your usage in Grafana Cloud:
- Go to **My Account** → **Usage**
- Track logs volume and metrics cardinality
- Free tier: 50GB logs/month, 10k active series

## Next Steps

1. ✅ Configure log retention policies
2. ✅ Set up team access/permissions
3. ✅ Create custom dashboards
4. ✅ Configure alert notification channels
5. ✅ Document dashboard URLs for team

---

**Support:** For issues, check https://grafana.com/docs/grafana-cloud/
