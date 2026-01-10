#!/bin/sh
# Prometheus entrypoint script to substitute environment variables

CONFIG_FILE="/etc/prometheus/prometheus.yml"
TEMP_CONFIG="/tmp/prometheus-config.yml"

# Substitute environment variables using sed (busybox compatible)
sed "s|\${GRAFANA_PROMETHEUS_URL}|${GRAFANA_PROMETHEUS_URL}|g" "$CONFIG_FILE" | \
sed "s|\${GRAFANA_PROMETHEUS_USERNAME}|${GRAFANA_PROMETHEUS_USERNAME}|g" | \
sed "s|\${GRAFANA_PROMETHEUS_API_KEY}|${GRAFANA_PROMETHEUS_API_KEY}|g" > "$TEMP_CONFIG"

# Debug: Show what was generated (remove in production)
echo "=== Generated config ==="
grep -A 5 "remote_write" "$TEMP_CONFIG"
echo "========================"

# Start Prometheus with the substituted config
exec /bin/prometheus \
  --config.file="$TEMP_CONFIG" \
  --storage.tsdb.path=/prometheus \
  --storage.tsdb.retention.time=30d \
  --web.enable-lifecycle
