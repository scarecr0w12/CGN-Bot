# Fixing 401 Authentication Errors

## The Problem

You're seeing `401 Unauthorized` errors because the API keys don't have the correct permissions (scopes). The error message says:
```
"authentication error: invalid scope requested"
```

## The Solution

You need to create **new API keys** with the correct token scopes in Grafana Cloud.

## Step-by-Step Fix

### 1. Delete Old API Keys (Optional)

Go to: https://scarecr0w12.grafana.net/
- **My Account** → **API Keys**
- Delete any keys you created for Loki/Prometheus (if you want to start fresh)

### 2. Create Loki API Key (For Logs)

1. Go to: **Connections** → **Add new connection** → **Hosted Logs**
2. OR go to: **My Account** → **Cloud Access Policies**
3. Click **"Create access policy"** or **"Generate API Key"**
4. Configure:
   - **Name**: `skynetbot-loki`
   - **Display Name**: SkynetBot Loki Push
   - **Scopes**: Select **"logs:write"** (this is critical!)
   - **Realm**: Select your stack
5. Click **Create** and **copy the token immediately** (you can't see it again)

### 3. Create Prometheus API Key (For Metrics)

1. Go to: **Connections** → **Add new connection** → **Hosted Prometheus**
2. OR go to: **My Account** → **Cloud Access Policies**
3. Click **"Create access policy"** or **"Generate API Key"**
4. Configure:
   - **Name**: `skynetbot-prometheus`
   - **Display Name**: SkynetBot Metrics Push
   - **Scopes**: Select **"metrics:write"** (this is critical!)
   - **Realm**: Select your stack
5. Click **Create** and **copy the token immediately**

### 4. Get Your Endpoints

#### For Loki:
- Go to: **Connections** → **Data sources** → **Loki**
- Copy the **URL** (format: `https://logs-prod-036.grafana.net/loki/api/v1/push`)
- Copy the **User** / **Username** (a numeric ID)

#### For Prometheus:
- Go to: **Connections** → **Data sources** → **Prometheus**  
- Look for **"Remote Write"** section
- Copy the **URL** (format: `https://prometheus-prod-XXX.grafana.net/api/prom/push`)
- Copy the **Username** (a numeric ID)

### 5. Update Your .env File

Replace your existing values with the new credentials:

```bash
# Loki (Logs)
GRAFANA_LOKI_URL=https://logs-prod-036.grafana.net/loki/api/v1/push
GRAFANA_LOKI_USERNAME=123456
GRAFANA_LOKI_API_KEY=glc_your_new_token_here

# Prometheus (Metrics)
GRAFANA_PROMETHEUS_URL=https://prometheus-prod-013.grafana.net/api/prom/push
GRAFANA_PROMETHEUS_USERNAME=654321
GRAFANA_PROMETHEUS_API_KEY=glc_your_new_token_here
```

**Important:**
- Use the **full URLs** including `/loki/api/v1/push` and `/api/prom/push`
- The username is typically a **numeric ID**, not an email
- The API key starts with `glc_` or `glsa_`

### 6. Restart Services

```bash
# Restart Promtail
docker-compose restart promtail

# Restart Prometheus
docker-compose restart prometheus
```

### 7. Verify It Works

**Check Promtail logs:**
```bash
docker logs skynetbot-promtail --tail 20
```
✅ **Good**: No more 401 errors, you see "batch sent" messages
❌ **Bad**: Still seeing 401 errors

**Check Prometheus logs:**
```bash
docker logs skynetbot-prometheus --tail 20
```
✅ **Good**: No "unsupported protocol scheme" or 401 errors
❌ **Bad**: Still seeing errors

**View in Grafana Cloud:**
1. Go to: https://scarecr0w12.grafana.net/explore
2. Select **Loki** → Query: `{job="skynetbot"}`
3. Select **Prometheus** → Query: `up`

## Common Issues

### "Invalid scope requested"
- Your API key doesn't have the right permissions
- Create a new key with **logs:write** (for Loki) or **metrics:write** (for Prometheus)

### "Unsupported protocol scheme"
- Environment variables aren't being substituted
- Make sure you ran: `docker-compose up -d` after updating configs
- Check `.env` file has no typos in variable names

### Still getting 401 after creating new keys
- Wait 1-2 minutes for key propagation
- Verify the URL includes the full path (`/loki/api/v1/push` or `/api/prom/push`)
- Ensure username is the numeric ID, not your email
- Check for extra spaces or quotes in `.env` file

### Username vs API Key confusion
- **Username**: Numeric ID (e.g., `123456`)
- **API Key**: Long token starting with `glc_` or `glsa_`
- Don't swap these!

## Alternative: Using Grafana Cloud Portal

If the above doesn't work, try the simplified approach:

1. Go to: https://grafana.com/docs/grafana-cloud/send-data/
2. Follow the guide for your specific integration
3. Use the provided credentials exactly as shown

---

**Need more help?** Check Grafana Cloud docs: https://grafana.com/docs/grafana-cloud/
