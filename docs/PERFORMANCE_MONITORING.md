# Performance Monitoring Guide

**Version:** 1.7.2  
**Phase:** 5A - Performance Monitoring Enhancement  
**Status:** Complete

## Overview

CGN-Bot integrates with Prometheus and Grafana for comprehensive performance monitoring. Phase 5 extends the existing monitoring infrastructure with detailed instrumentation for Phase 2 architectural improvements.

---

## Architecture

### Components

```
┌─────────────────┐
│   CGN-Bot App   │
│  (Metrics SDK)  │
└────────┬────────┘
         │ /metrics endpoint
         ↓
┌─────────────────┐
│   Prometheus    │
│ (Time-series DB)│
└────────┬────────┘
         │ PromQL queries
         ↓
┌─────────────────┐
│     Grafana     │
│  (Dashboards)   │
└─────────────────┘
```

### Metrics Flow

1. **Application** - Records metrics using `prom-client`
2. **Prometheus** - Scrapes `/metrics` endpoint every 10s
3. **Grafana** - Visualizes metrics from Prometheus
4. **Alertmanager** - Sends alerts based on rules

---

## Available Metrics

### Phase 2 Performance Metrics

#### Cache Events (`Modules/CacheEvents.js`)

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `skynetbot_cache_invalidations_total` | Counter | Total cache invalidations | `cache_key_pattern`, `invalidation_type` |
| `skynetbot_cache_handlers_total` | Gauge | Registered invalidation handlers | - |
| `skynetbot_cache_invalidation_duration_seconds` | Histogram | Invalidation operation duration | `invalidation_type` |

**Example Queries:**
```promql
# Cache invalidation rate (per minute)
rate(skynetbot_cache_invalidations_total[5m]) * 60

# P95 invalidation latency
histogram_quantile(0.95, rate(skynetbot_cache_invalidation_duration_seconds_bucket[5m]))

# Single vs pattern invalidations
sum by (invalidation_type) (rate(skynetbot_cache_invalidations_total[5m]))
```

#### Command Executor (`Internals/CommandExecutor.js`)

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `skynetbot_command_execution_duration_seconds` | Histogram | Command execution time | `command`, `type`, `status` |
| `skynetbot_command_validation_duration_seconds` | Histogram | Validation operation duration | `validation_type` |
| `skynetbot_command_cooldowns_active` | Gauge | Active command cooldowns | - |
| `skynetbot_command_validation_failures_total` | Counter | Validation failure count | `failure_type` |

**Example Queries:**
```promql
# Command success rate
sum(rate(skynetbot_command_execution_duration_seconds_count{status="success"}[5m])) 
/ 
sum(rate(skynetbot_command_execution_duration_seconds_count[5m]))

# P99 command latency
histogram_quantile(0.99, sum by (le) (rate(skynetbot_command_execution_duration_seconds_bucket[5m])))

# Top 10 slowest commands
topk(10, avg by (command) (rate(skynetbot_command_execution_duration_seconds_sum[5m]) / rate(skynetbot_command_execution_duration_seconds_count[5m])))
```

#### Command Middleware (`Internals/CommandMiddleware.js`)

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `skynetbot_middleware_execution_duration_seconds` | Histogram | Middleware execution time | `middleware_name` |
| `skynetbot_middleware_registered_total` | Gauge | Registered middleware count | - |
| `skynetbot_middleware_blocked_total` | Counter | Requests blocked by middleware | `middleware_name`, `reason` |

**Example Queries:**
```promql
# Middleware block rate
rate(skynetbot_middleware_blocked_total[5m])

# Average middleware latency
rate(skynetbot_middleware_execution_duration_seconds_sum[5m]) 
/ 
rate(skynetbot_middleware_execution_duration_seconds_count[5m])

# Slowest middleware functions
topk(5, avg by (middleware_name) (rate(skynetbot_middleware_execution_duration_seconds_sum[5m]) / rate(skynetbot_middleware_execution_duration_seconds_count[5m])))
```

### Existing Bot Metrics

- `skynetbot_discord_guilds_total` - Total Discord servers
- `skynetbot_discord_users_total` - Cached users
- `skynetbot_discord_commands_total` - Commands executed
- `skynetbot_http_request_duration_seconds` - HTTP request latency
- `skynetbot_db_query_duration_seconds` - Database query latency
- See `Modules/Metrics.js` for full list

---

## Grafana Dashboards

### Phase 2 Performance Dashboard

**Location:** `monitoring/grafana/provisioning/dashboards/phase2-performance-dashboard.json`

**Panels:**

1. **Cache Events Performance**
   - Total invalidations rate
   - Registered handlers count
   - Average invalidation latency
   - P95 invalidation duration graph

2. **Command Executor Performance**
   - Commands executed rate
   - Active cooldowns
   - Validation failure rate
   - P50/P95/P99 execution duration
   - Success rate graph

3. **Middleware Performance**
   - Registered middleware count
   - Block rate
   - Average execution latency
   - Per-middleware duration breakdown

**Access:** http://localhost:3000/d/phase2-performance

### Main Bot Dashboard

**Location:** `monitoring/grafana/provisioning/dashboards/skynetbot-dashboard.json`

**Panels:**
- Discord guild/user counts
- Shard status and latency
- HTTP request metrics
- Database performance

**Access:** http://localhost:3000/d/skynetbot-main

---

## Alerting Rules

### Phase 2 Performance Alerts

**Location:** `monitoring/prometheus/alerts/phase2-performance.yml`

#### Cache Alerts

**HighCacheInvalidationLatency**
- **Trigger:** P95 invalidation latency > 100ms for 5 minutes
- **Severity:** Warning
- **Action:** Investigate cache invalidation handlers for slow operations

**CacheInvalidationStorm**
- **Trigger:** > 100 invalidations/second for 2 minutes
- **Severity:** Warning
- **Action:** Check for invalidation loops or excessive pattern matching

#### Command Alerts

**HighCommandExecutionLatency**
- **Trigger:** P95 execution time > 2 seconds for 5 minutes
- **Severity:** Warning
- **Action:** Profile slow commands, check database queries

**CommandExecutionFailureRate**
- **Trigger:** > 5% commands failing for 5 minutes
- **Severity:** Critical
- **Action:** Check logs, investigate command errors

**HighCommandValidationFailures**
- **Trigger:** > 10 validation failures/second for 5 minutes
- **Severity:** Warning
- **Action:** Review permission configurations or user behavior

**ExcessiveCooldowns**
- **Trigger:** > 1000 active cooldowns for 5 minutes
- **Severity:** Warning
- **Action:** Consider increasing cooldown expiry or memory optimization

#### Middleware Alerts

**HighMiddlewareLatency**
- **Trigger:** Average latency > 10ms for 5 minutes
- **Severity:** Warning
- **Action:** Profile middleware functions for slow operations

**HighMiddlewareBlockRate**
- **Trigger:** > 5 blocks/second for 5 minutes
- **Severity:** Warning
- **Action:** Review middleware rules or potential attacks

#### Regression Detection

**CommandPerformanceRegression**
- **Trigger:** P95 latency 50% slower than 24 hours ago
- **Severity:** Warning
- **Action:** Compare recent deployments, investigate changes

**CachePerformanceRegression**
- **Trigger:** P95 latency 2x slower than 24 hours ago
- **Severity:** Warning
- **Action:** Review recent cache changes or load increases

---

## Configuration

### Prometheus Configuration

**File:** `monitoring/prometheus/prometheus.yml`

```yaml
scrape_configs:
  - job_name: 'skynetbot'
    static_configs:
      - targets: ['172.17.0.1:8080']
    metrics_path: '/metrics'
    scrape_interval: 10s
```

**Alert Rules:**
```yaml
# Add to prometheus.yml
rule_files:
  - 'alerts/phase2-performance.yml'
```

### Application Configuration

Metrics are automatically exposed at:
```
http://localhost:8080/metrics
```

**Environment Variables:**
- None required - metrics are always enabled

---

## Usage Examples

### Querying Metrics

**Via Prometheus UI** (http://localhost:9090):
```promql
# Cache invalidation rate
rate(skynetbot_cache_invalidations_total[5m])

# Command latency P95
histogram_quantile(0.95, rate(skynetbot_command_execution_duration_seconds_bucket[5m]))
```

**Via HTTP API:**
```bash
curl -g 'http://localhost:9090/api/v1/query?query=skynetbot_cache_handlers_total'
```

**Via Node.js:**
```javascript
const metrics = require('./Modules/Metrics');

// Metrics are recorded automatically via instrumentation
// Manual recording (if needed):
metrics.recordCacheInvalidation('server:*:config', 'pattern');
```

### Creating Custom Dashboards

1. **Access Grafana:** http://localhost:3000
2. **Create Dashboard:** Dashboards → New → Add visualization
3. **Select Data Source:** Prometheus
4. **Add Query:** Use PromQL expressions
5. **Save:** Export JSON to `monitoring/grafana/provisioning/dashboards/`

**Example Panel JSON:**
```json
{
  "title": "My Custom Metric",
  "targets": [{
    "expr": "rate(skynetbot_my_metric_total[5m])",
    "legendFormat": "{{ label_name }}"
  }]
}
```

### Adding Custom Alerts

1. **Edit:** `monitoring/prometheus/alerts/phase2-performance.yml`
2. **Add Rule:**
```yaml
- alert: MyCustomAlert
  expr: my_metric > threshold
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Custom alert triggered"
    description: "Metric exceeded threshold"
```
3. **Reload Prometheus:** `docker-compose restart prometheus`

---

## Performance Baselines

### Expected Metrics (Production)

| Metric | P50 | P95 | P99 |
|--------|-----|-----|-----|
| Cache invalidation | < 0.1ms | < 1ms | < 5ms |
| Command execution | < 50ms | < 200ms | < 500ms |
| Command validation | < 0.1ms | < 1ms | < 5ms |
| Middleware execution | < 0.1ms | < 1ms | < 10ms |

### Performance Targets

- **Cache invalidation rate:** < 50/s sustained
- **Command success rate:** > 99%
- **Validation failure rate:** < 1%
- **Middleware block rate:** < 1/s

### Capacity Planning

**Recommended Limits:**
- Max active cooldowns: 10,000
- Max cache handlers: 1,000
- Max registered middleware: 20

---

## Troubleshooting

### High Latency

**Symptom:** P95 latency exceeds thresholds

**Diagnosis:**
1. Check dashboard for specific component
2. Query slowest operations:
   ```promql
   topk(10, avg by (command) (rate(skynetbot_command_execution_duration_seconds_sum[5m]) / rate(skynetbot_command_execution_duration_seconds_count[5m])))
   ```
3. Review application logs for errors

**Solutions:**
- Optimize slow command handlers
- Add caching for expensive operations
- Review database query performance

### High Error Rate

**Symptom:** Command failure rate > 5%

**Diagnosis:**
1. Check error logs: `docker-compose logs skynetbot | grep ERROR`
2. Query errors by command:
   ```promql
   sum by (command) (rate(skynetbot_command_execution_duration_seconds_count{status="error"}[5m]))
   ```

**Solutions:**
- Fix application errors
- Improve error handling
- Add validation for user input

### Memory Issues

**Symptom:** Excessive cooldowns or handlers

**Diagnosis:**
```promql
skynetbot_command_cooldowns_active
skynetbot_cache_handlers_total
```

**Solutions:**
- Run `executor.clearExpiredCooldowns()`
- Review handler registration (possible leaks)
- Adjust cooldown durations

### Metrics Not Appearing

**Symptom:** Metrics missing in Prometheus

**Diagnosis:**
1. Check `/metrics` endpoint: `curl http://localhost:8080/metrics`
2. Verify Prometheus targets: http://localhost:9090/targets
3. Check Prometheus logs: `docker-compose logs prometheus`

**Solutions:**
- Ensure bot is running
- Verify network connectivity
- Check Prometheus scrape configuration

---

## Best Practices

### Metric Naming

- Use `skynetbot_` prefix for all metrics
- Include units in names (`_seconds`, `_total`, `_bytes`)
- Use snake_case for names
- Keep label cardinality low (< 1000 unique combinations)

### Label Usage

**DO:**
- Use labels for dimensions (command name, status, type)
- Keep label values bounded (enum-like)
- Normalize dynamic IDs to avoid high cardinality

**DON'T:**
- Use user IDs as labels
- Use timestamps as labels
- Create labels with unbounded values

### Query Optimization

- Use `rate()` for counters, not `increase()`
- Aggregate before computing quantiles
- Use recording rules for expensive queries
- Keep time ranges reasonable (< 1 hour for dashboards)

### Dashboard Design

- Group related metrics
- Use appropriate visualization types
- Add thresholds for at-a-glance status
- Include legend with meaningful names
- Set appropriate Y-axis scales

---

## Integration with CI/CD

### Performance Testing

Add to test suite:
```javascript
const metrics = require('./Modules/Metrics');

describe('Performance', () => {
  it('should record command metrics', async () => {
    const before = await getMetricValue('skynetbot_command_execution_duration_seconds_count');
    await executeCommand('test');
    const after = await getMetricValue('skynetbot_command_execution_duration_seconds_count');
    expect(after).toBeGreaterThan(before);
  });
});
```

### Deployment Checks

Before deploying:
1. Run `npm test` - ensures metrics don't break functionality
2. Check for new high-cardinality labels
3. Verify alert rules are valid: `promtool check rules alerts/*.yml`

After deploying:
1. Monitor dashboard for regressions
2. Check alert status
3. Verify metrics are being recorded

---

## Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Dashboards](https://grafana.com/docs/grafana/latest/dashboards/)
- [PromQL Guide](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [prom-client NPM](https://www.npmjs.com/package/prom-client)

---

## Summary

Phase 5 performance monitoring provides:
- **10 new metrics** for Phase 2 modules
- **3 Grafana dashboard sections** with 12 panels
- **10 alerting rules** for performance issues
- **2 regression detection rules** for automatic detection
- **Zero runtime overhead** when metrics not scraped
- **Full backward compatibility** with existing monitoring

**Quick Start:**
1. Start monitoring: `docker-compose up -d prometheus grafana`
2. Access Grafana: http://localhost:3000 (admin/admin)
3. View Phase 2 Dashboard: http://localhost:3000/d/phase2-performance
4. Check metrics: http://localhost:8080/metrics

**Next Steps:**
- Establish performance baselines
- Configure alert notifications (Slack, email)
- Create custom dashboards for specific use cases
- Set up recording rules for complex queries
