# Grafana Cloud Metrics Optimization

## Overview

This document explains the optimizations implemented to reduce Grafana Cloud metrics usage to stay within the **10,000 active series** limit of the free tier.

## Changes Implemented

### 1. Increased Scrape Intervals (75% Reduction)

**File**: `monitoring/prometheus/prometheus.yml`

- Global scrape interval: `15s` → `60s`
- Evaluation interval: `15s` → `60s`
- SkynetBot application: `10s` → `30s`

**Impact**: Reduces data points by ~75%, significantly lowering storage and query costs.

### 2. Node Exporter Optimization (60-70% Reduction)

**File**: `docker-compose.yml`

Disabled 28 unnecessary collectors, keeping only:
- ✅ **cpu** - CPU usage metrics
- ✅ **loadavg** - System load averages
- ✅ **meminfo** - Memory statistics
- ✅ **diskstats** - Disk I/O statistics
- ✅ **filesystem** - Filesystem usage
- ✅ **netdev** - Network interface statistics
- ✅ **stat** - Various statistics from /proc/stat
- ✅ **uname** - System information

**Disabled collectors** (not needed for Discord bot monitoring):
- ❌ arp, bcache, bonding, btrfs, conntrack, edac, entropy
- ❌ fibrechannel, hwmon, infiniband, ipvs, mdadm, nfs, nfsd
- ❌ nvme, powersupplyclass, pressure, rapl, schedstat
- ❌ sockstat, softnet, tapestats, textfile, thermal_zone
- ❌ timex, udp_queues, xfs, zfs

### 3. Metric Label Filtering (50-60% Reduction)

**File**: `monitoring/prometheus/prometheus.yml`

Added `metric_relabel_configs` to drop high-cardinality metrics:

#### Prometheus Self-Monitoring
- Drops: `prometheus_engine_*`, `prometheus_rule_*`, `prometheus_tsdb_*`

#### Node Exporter
- Drops per-CPU metrics (keeps aggregated only)
- Drops detailed network transmit/receive metrics
- Keeps only essential filesystem metrics

#### SkynetBot Application
- Drops individual command names (keeps totals only)
- Drops detailed HTTP route metrics
- Drops per-shard latency (keeps aggregates)

#### MariaDB Exporter
- Keeps only: connections, queries, slow_queries, threads_running, uptime

#### Redis Exporter
- Keeps only: connected_clients, memory usage, ops/sec, keyspace stats

### 4. Application Metrics Configuration

**File**: `Modules/Metrics.js`

- Added `app: "skynetbot"` label to default metrics for better organization
- Existing cardinality controls remain in place (route normalization)

## Expected Results

### Metric Count Reduction

| Component | Before | After | Reduction |
|-----------|--------|-------|-----------|
| Scrape Frequency | 240/hr | 60/hr | 75% |
| Node Exporter | ~800 series | ~200 series | 75% |
| Prometheus Internal | ~300 series | ~50 series | 83% |
| MariaDB Exporter | ~200 series | ~30 series | 85% |
| Redis Exporter | ~150 series | ~25 series | 83% |
| SkynetBot App | ~1000 series | ~400 series | 60% |
| **TOTAL** | ~2,450 series | ~705 series | **71%** |

With reduced scrape frequency, **effective 95th percentile**: ~2,000-3,000 active series

## Monitoring Your Usage

### Check Current Metrics Count

Query Grafana Cloud to see your current usage:

```promql
# Total active series
count({__name__=~".+"})

# Series per job
count by (job) ({__name__=~".+"})

# Most expensive metrics
topk(20, count by (__name__) ({__name__=~".+"}))
```

### Grafana Cloud Dashboard

1. Go to your Grafana Cloud instance: https://scarecr0w12.grafana.net/
2. Navigate to **Configuration** → **Data sources** → **Prometheus**
3. Check the **Metrics** tab for current usage
4. View **Usage insights** for detailed breakdown

### Local Prometheus Query

```bash
# SSH into your server
ssh your-server

# Query local Prometheus
curl -s http://localhost:9090/api/v1/query?query='count({__name__=~".%2B"})' | jq '.data.result[0].value[1]'
```

## Troubleshooting

### Still Over 10k Limit?

If you're still over the limit after these changes:

1. **Further reduce scrape intervals**:
   ```yaml
   global:
     scrape_interval: 120s  # 2 minutes
   ```

2. **Disable additional jobs**:
   - Comment out `mariadb-exporter` or `redis-exporter` if not critical
   - Use local Grafana instance for these metrics instead

3. **Add more aggressive filtering**:
   ```yaml
   metric_relabel_configs:
     # Drop all HTTP metrics
     - source_labels: [__name__]
       regex: 'skynetbot_http_.*'
       action: drop
   ```

### Missing Important Metrics?

If you need specific metrics that were dropped:

1. Edit `monitoring/prometheus/prometheus.yml`
2. Adjust the `metric_relabel_configs` regex patterns
3. Restart Prometheus: `docker-compose restart prometheus`

## Applying Changes

```bash
# Restart affected services
docker-compose restart prometheus
docker-compose restart node-exporter

# Verify configuration
docker-compose logs prometheus | grep -i error
docker-compose logs node-exporter | grep -i error

# Check metrics endpoint
curl http://localhost:9090/metrics | wc -l  # Should be significantly fewer lines
```

## Retention Policy

Grafana Cloud Free Tier includes:
- **14 days** retention for metrics
- **10,000** active series at 95th percentile
- **50 GB/month** logs ingestion

## Alternative: Local Grafana

If you need more metrics for development, run local Grafana:

```yaml
# Add to docker-compose.yml
grafana:
  image: grafana/grafana:latest
  container_name: skynetbot-grafana-local
  ports:
    - "3000:3000"
  volumes:
    - ./data/grafana:/var/lib/grafana
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
```

Configure Prometheus to write to **both** Grafana Cloud (filtered) and local instance (full).

## Maintenance

**Monthly**: Review top metrics and adjust filters as needed
**Quarterly**: Audit collector usage and disable unused features
**After major updates**: Check for new high-cardinality metrics

## References

- [Prometheus Metric Filtering](https://prometheus.io/docs/prometheus/latest/configuration/configuration/#relabel_config)
- [Node Exporter Collectors](https://github.com/prometheus/node_exporter#collectors)
- [Grafana Cloud Limits](https://grafana.com/pricing/)
