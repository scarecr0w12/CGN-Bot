# Grafana Cloud Dashboards

This guide explains how to import and use the pre-built dashboards for monitoring your SkynetBot instance.

## Available Dashboards

### 1. SkynetBot - Overview
**File:** `monitoring/grafana-dashboards/bot-overview.json`

**Monitors:**
- Bot status (up/down)
- CPU usage
- Memory usage
- Redis connections
- MariaDB connections

**Best for:** Quick health check and overall system status

### 2. SkynetBot - System Metrics
**File:** `monitoring/grafana-dashboards/system-metrics.json`

**Monitors:**
- Detailed memory breakdown
- CPU usage per core
- Network traffic
- Disk usage
- Redis operations rate
- MariaDB query rate
- Service status indicators

**Best for:** Deep infrastructure monitoring and performance tuning

### 3. SkynetBot - Logs Analysis
**File:** `monitoring/grafana-dashboards/logs-analysis.json`

**Monitors:**
- Log volume by level (error/warn/info/debug)
- Error logs stream
- Console logs stream
- Shard-specific logs
- Log sources breakdown
- Error/warning counts with thresholds

**Best for:** Troubleshooting issues and monitoring application logs

---

## How to Import Dashboards

### Method 1: Import via Grafana Cloud UI

1. **Go to your Grafana Cloud instance:**
   - Visit: https://scarecr0w12.grafana.net/

2. **Navigate to Dashboards:**
   - Click the **"+"** icon in the left sidebar
   - Select **"Import"**

3. **Import the JSON:**
   - Click **"Upload JSON file"**
   - Browse to `monitoring/grafana-dashboards/`
   - Select one of the dashboard files
   - Click **"Load"**

4. **Configure Data Sources:**
   - **Prometheus:** Select your Prometheus data source
   - **Loki:** Select your Loki data source (for logs dashboard)
   - Click **"Import"**

5. **Repeat for other dashboards**

### Method 2: Import via Copy-Paste

1. **Open the JSON file:**
   ```bash
   cat monitoring/grafana-dashboards/bot-overview.json
   ```

2. **Copy the entire JSON content**

3. **Go to Grafana Cloud:**
   - Click **"+"** → **"Import"**
   - Paste the JSON into the text box
   - Click **"Load"**

4. **Configure and Import** as above

---

## Configuring Data Sources

After importing, ensure your dashboards are connected to the correct data sources:

### For Prometheus Dashboards (Overview, System Metrics):
1. Go to dashboard settings (gear icon)
2. Click **"JSON Model"** 
3. Find `"datasource": "Prometheus"`
4. Replace with your Prometheus data source UID (or select it during import)

### For Loki Dashboards (Logs Analysis):
1. Same process as above
2. Find `"datasource": "Loki"`
3. Replace with your Loki data source UID

**Pro Tip:** During import, Grafana Cloud will prompt you to select data sources. Simply choose:
- **Prometheus** for metrics dashboards
- **Loki** for logs dashboard

---

## Dashboard Organization

### Recommended Folder Structure

Create folders in Grafana Cloud to organize your dashboards:

1. Go to **Dashboards** → **Browse**
2. Click **"New"** → **"New folder"**
3. Create folder: `SkynetBot`
4. Move all imported dashboards into this folder

---

## Customizing Dashboards

### Adjusting Refresh Rate

Default: 30 seconds (Overview, System), 10 seconds (Logs)

To change:
1. Click the refresh dropdown (top-right)
2. Select desired interval or set custom
3. Click **"Save dashboard"**

### Adding Custom Panels

1. Click **"Add panel"** icon (top-right)
2. Select **"Add a new panel"**
3. Choose your data source
4. Write your query (examples below)
5. Configure visualization
6. Click **"Apply"**

### Example Custom Queries

**Prometheus:**
```promql
# Bot process memory
process_resident_memory_bytes{job="skynetbot"}

# HTTP request rate
rate(http_requests_total[5m])

# Container CPU usage
rate(container_cpu_usage_seconds_total[5m])
```

**Loki (LogQL):**
```logql
# All logs from a specific shard
{job="skynetbot"} |= "Shard 0"

# Errors in the last hour
{job="skynetbot", level="error"} | json

# Count of specific log messages
sum(count_over_time({job="skynetbot"} |= "command executed" [5m]))
```

---

## Setting Up Alerts

### Create Alert for High Error Rate

1. Open **"Logs Analysis"** dashboard
2. Edit the **"Error Count (Last 5m)"** panel
3. Click **"Alert"** tab
4. Click **"Create alert rule from this panel"**
5. Configure:
   - **Condition:** `last() > 10` (alert if more than 10 errors in 5min)
   - **Evaluate every:** 1m
   - **For:** 5m (alert after condition persists for 5 minutes)
6. Add notification channel (Discord webhook, email, etc.)
7. Click **"Save"**

### Recommended Alerts

- **Bot Down:** `up{job="skynetbot"} == 0` for 2 minutes
- **High Memory:** Memory usage > 90% for 5 minutes
- **High Error Rate:** More than 10 errors in 5 minutes
- **Database Connections:** MariaDB connections > 200

---

## Dashboard Links

After importing, your dashboards will be available at:
- Overview: `https://scarecr0w12.grafana.net/d/skynetbot-overview`
- System: `https://scarecr0w12.grafana.net/d/skynetbot-system`
- Logs: `https://scarecr0w12.grafana.net/d/skynetbot-logs`

---

## Troubleshooting

### "No data" in panels

**Check:**
1. Data sources are correctly configured
2. Prometheus/Promtail are sending data (verify in logs)
3. Time range includes recent data
4. Metric/log names match your setup

**Verify data flow:**
```bash
# Check Prometheus is scraping
docker logs skynetbot-prometheus | grep "scrape"

# Check Promtail is shipping logs
docker logs skynetbot-promtail | tail -20
```

### Wrong data source selected

1. Go to dashboard settings (gear icon)
2. Click **"Variables"**
3. Edit data source variables if present
4. Or edit individual panels and select correct data source

### Panels not loading

1. Clear browser cache
2. Check browser console for errors (F12)
3. Verify Grafana Cloud is reachable
4. Check data source health: **Configuration** → **Data sources** → Select source → **Test**

---

## Performance Tips

1. **Limit time ranges** - Use 1h or 6h instead of 24h for faster loading
2. **Reduce panel count** - Remove unused panels
3. **Adjust refresh rates** - Use 30s or 1m instead of 10s
4. **Use query caching** - Grafana Cloud caches results automatically

---

## Next Steps

1. ✅ Import all three dashboards
2. ✅ Verify data is flowing to all panels
3. ✅ Set up at least 2 critical alerts
4. ✅ Bookmark dashboard URLs
5. ✅ Share with team members (if any)

---

**Support:** For Grafana Cloud issues, check https://grafana.com/docs/grafana-cloud/
