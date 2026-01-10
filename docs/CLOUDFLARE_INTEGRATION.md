# Cloudflare Integration Guide

This guide covers the comprehensive Cloudflare integration for CGN-Bot, including Turnstile bot protection, R2 object storage, and advanced security features.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Turnstile Bot Protection](#turnstile-bot-protection)
- [R2 Object Storage](#r2-object-storage)
- [Security Features](#security-features)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

## Overview

CGN-Bot integrates with multiple Cloudflare services:

1. **Turnstile** - CAPTCHA-free bot protection for forms
2. **R2** - S3-compatible object storage for assets and extension files
3. **Cache Management** - Automated cache purging and control
4. **Security** - IP filtering, threat detection, and DDoS protection
5. **Analytics** - Traffic and performance monitoring

## Prerequisites

- Cloudflare account (Free tier supports Turnstile and basic features)
- Domain configured with Cloudflare DNS
- Node.js 18+ with npm

### Required Packages

The following packages are needed for full Cloudflare integration:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

These are already included in `package.json` if you're installing from scratch.

## Turnstile Bot Protection

Turnstile provides invisible bot protection without annoying CAPTCHAs.

### Setup

1. **Create Turnstile Widget**
   - Go to [Cloudflare Dashboard → Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile)
   - Click "Add Site"
   - Enter your domain
   - Choose widget mode: Managed (recommended), Non-Interactive, or Invisible
   - Copy the **Sitekey** and **Secret Key**

2. **Configure Environment Variables**

```bash
# .env
CLOUDFLARE_TURNSTILE_SITEKEY=1x00000000000000000000AA
CLOUDFLARE_TURNSTILE_SECRET=1x0000000000000000000000000000000AA
CLOUDFLARE_TURNSTILE_THEME=auto  # auto, light, dark
CLOUDFLARE_TURNSTILE_SIZE=normal # normal, compact
```

3. **Add Widget to Forms**

In your EJS templates, include the Turnstile widget:

```ejs
<form method="POST" action="/login">
  <input type="email" name="email" required>
  <input type="password" name="password" required>
  
  <%- include('../partials/turnstile-widget') %>
  
  <button type="submit">Log In</button>
</form>
```

4. **Verify Token on Server**

In your route handlers:

```javascript
const { verifyTurnstile } = require('../middleware/turnstile');

// Protected route
router.post('/login', verifyTurnstile, async (req, res) => {
  // req.turnstileVerified = true
  // Token already verified, proceed with login
});

// Optional verification (logs but doesn't block)
router.post('/feedback', verifyTurnstileOptional, async (req, res) => {
  // Continues regardless of verification status
  // Check req.turnstileVerified to see if bot
});
```

### Testing Turnstile

Cloudflare provides test keys for development:

**Always Passes:**
- Sitekey: `1x00000000000000000000AA`
- Secret: `1x0000000000000000000000000000000AA`

**Always Fails:**
- Sitekey: `2x00000000000000000000AB`
- Secret: `2x0000000000000000000000000000000AA`

## R2 Object Storage

R2 provides S3-compatible object storage with zero egress fees.

### Setup

1. **Create R2 Bucket**
   - Go to [Cloudflare Dashboard → R2](https://dash.cloudflare.com/?to=/:account/r2)
   - Click "Create Bucket"
   - Name it (e.g., `skynet-assets`)
   - Choose location (automatic is recommended)

2. **Generate API Credentials**
   - Click "Manage R2 API Tokens"
   - Create API Token with permissions: Object Read & Write
   - Copy **Access Key ID** and **Secret Access Key**

3. **Configure Environment Variables**

```bash
# .env
CLOUDFLARE_R2_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key-id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-access-key
CLOUDFLARE_R2_BUCKET_NAME=skynet-assets

# Optional: Public bucket for CDN
CLOUDFLARE_R2_PUBLIC_BUCKET_NAME=skynet-public
CLOUDFLARE_R2_PUBLIC_DOMAIN=cdn.yourdomain.com
```

4. **Usage in Code**

```javascript
const { getInstance: getR2 } = require('../Modules/CloudflareR2');

// Upload file
const r2 = getR2();
await r2.upload('images/avatar.png', fileBuffer, {
  contentType: 'image/png',
  cacheControl: 'public, max-age=31536000',
});

// Download file
const data = await r2.download('images/avatar.png');

// Upload asset with automatic key generation
const result = await r2.uploadAsset('photo.jpg', photoBuffer, {
  prefix: 'user-uploads',
});
console.log(result.url); // Public URL

// Generate presigned URL for temporary access
const signedUrl = await r2.getSignedUrl('private/file.pdf', {
  expiresIn: 3600, // 1 hour
});
```

### R2 for Extension Packages

The system automatically uses R2 for storing extension packages if configured:

```javascript
// Upload extension package
const key = await r2.uploadExtensionPackage(extensionId, packageData);

// Download for installation
const packageData = await r2.download(`extensions/${extensionId}.skypkg`);
```

## Security Features

### IP Forwarding

The system automatically extracts real visitor IPs from Cloudflare headers:

```javascript
// Middleware automatically sets req.realIP
const visitorIP = req.realIP; // Uses CF-Connecting-IP header
```

### Country Blocking

Block requests from specific countries:

```bash
# .env
CLOUDFLARE_BLOCKED_COUNTRIES=CN,RU,KP
```

### Proxy Requirement

Force all traffic through Cloudflare (block direct origin access):

```bash
# .env
CLOUDFLARE_REQUIRE_PROXY=true
```

### Bot Management

The middleware automatically detects and provides bot scores:

```javascript
if (req.cloudflare.botManagement) {
  const { score, verifiedBot } = req.cloudflare.botManagement;
  // score: 1-99 (higher = more human-like)
  // verifiedBot: true for search engines
}
```

## Configuration

### Full Environment Variables

```bash
# Core Cloudflare API (for cache/analytics)
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_ZONE_ID=your-zone-id
CLOUDFLARE_ACCOUNT_ID=your-account-id

# Turnstile Bot Protection
CLOUDFLARE_TURNSTILE_SITEKEY=1x00000000000000000000AA
CLOUDFLARE_TURNSTILE_SECRET=1x0000000000000000000000000000000AA
CLOUDFLARE_TURNSTILE_THEME=auto
CLOUDFLARE_TURNSTILE_SIZE=normal

# R2 Object Storage
CLOUDFLARE_R2_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=access-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=secret-key
CLOUDFLARE_R2_BUCKET_NAME=skynet-assets
CLOUDFLARE_R2_PUBLIC_BUCKET_NAME=skynet-public
CLOUDFLARE_R2_PUBLIC_DOMAIN=cdn.yourdomain.com

# Security Settings
CLOUDFLARE_PROXY_ENABLED=true
CLOUDFLARE_REQUIRE_PROXY=false
CLOUDFLARE_BLOCKED_COUNTRIES=
```

### Nginx Configuration

If using Cloudflare with nginx, configure real IP forwarding:

```nginx
# /etc/nginx/sites-available/skynetbot.conf

# Set real IP from Cloudflare
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
# ... add all Cloudflare IP ranges
# Full list: https://www.cloudflare.com/ips/

real_ip_header CF-Connecting-IP;
```

## Usage Examples

### Cache Management

```javascript
const { getInstance: getCF } = require('../Modules/CloudflareService');

const cf = getCF();

// Purge entire cache
await cf.purgeAllCache();

// Purge specific URLs
await cf.purgeUrls([
  'https://yourdomain.com/index',
  'https://yourdomain.com/about',
]);

// Purge by prefix
await cf.purgePrefixes(['/blog/', '/extensions/']);
```

### Analytics

```javascript
// Get zone analytics
const analytics = await cf.getAnalytics({ days: 7 });
console.log(analytics.result.totals);

// Get bandwidth stats
const bandwidth = await cf.getBandwidthStats({ days: 30 });
console.log(bandwidth.cacheHitRatio);

// Get request stats
const requests = await cf.getRequestStats({ days: 1 });
```

### Security Level

```javascript
// Enable "I'm Under Attack" mode
await cf.enableUnderAttackMode();

// Disable after DDoS
await cf.disableUnderAttackMode();

// Block specific IP
await cf.blockIP('1.2.3.4', 'Spam bot');

// Whitelist trusted IP
await cf.whitelistIP('5.6.7.8', 'Office IP');
```

## Best Practices

### Turnstile

1. **Use Invisible Mode** for better UX when possible
2. **Test with Test Keys** in development
3. **Handle Errors Gracefully** - provide retry options
4. **Log Failures** for security monitoring
5. **Skip for Trusted Users** if they're already authenticated

### R2 Storage

1. **Use Presigned URLs** for temporary access to private files
2. **Set Cache Headers** appropriately (long for static assets)
3. **Organize with Prefixes** (folders): `images/`, `extensions/`, `backups/`
4. **Enable Public Bucket** for CDN-served assets
5. **Monitor Usage** - R2 has free tier limits

### Security

1. **Always Enable Proxy Mode** when using Cloudflare
2. **Use HTTPS Only** - enable HTTPS redirect in Cloudflare
3. **Set Security Level** based on threat landscape
4. **Monitor Bot Traffic** with analytics
5. **Keep IP Ranges Updated** for trust proxy configuration

### Performance

1. **Enable Auto Minify** in Cloudflare dashboard
2. **Use Argo Smart Routing** for faster global delivery
3. **Enable Brotli Compression** in Cloudflare settings
4. **Set Appropriate Cache Levels** - Aggressive for static content
5. **Use R2 for Large Files** to avoid origin bandwidth

## Troubleshooting

### Turnstile Widget Not Appearing

- Check `CLOUDFLARE_TURNSTILE_SITEKEY` is set
- Ensure `turnstileMiddleware.addTurnstileConfig` is loaded
- Verify script loads: check browser console for errors
- Check CSP headers allow Cloudflare domains

### Verification Always Fails

- Confirm `CLOUDFLARE_TURNSTILE_SECRET` matches dashboard
- Check server can reach `challenges.cloudflare.com`
- Verify token is being sent in `cf-turnstile-response` field
- Test with test keys first

### R2 Upload Failures

- Verify all R2 credentials are correct
- Check bucket name matches configuration
- Ensure bucket exists in correct region
- Test credentials with AWS CLI: `aws s3 ls --endpoint-url=https://ACCOUNT_ID.r2.cloudflarestorage.com`

### Real IP Not Detected

- Enable `app.enable('trust proxy')` in Express
- Configure nginx to forward CF-Connecting-IP
- Check `CLOUDFLARE_PROXY_ENABLED=true`
- Verify middleware order in WebServer.js

## Migration Guide

### From Local Storage to R2

```javascript
const fs = require('fs');
const { getInstance: getR2 } = require('./Modules/CloudflareR2');

async function migrateToR2() {
  const r2 = getR2();
  const files = fs.readdirSync('./public/uploads');
  
  for (const file of files) {
    const data = fs.readFileSync(`./public/uploads/${file}`);
    await r2.upload(`uploads/${file}`, data);
    console.log(`Migrated: ${file}`);
  }
}
```

### From reCAPTCHA to Turnstile

1. Update forms to use Turnstile widget partial
2. Replace reCAPTCHA verification with `verifyTurnstile` middleware
3. Update client-side JavaScript (Turnstile auto-renders)
4. Test with Turnstile test keys
5. Deploy with production keys

## Additional Resources

- [Cloudflare Turnstile Documentation](https://developers.cloudflare.com/turnstile/)
- [R2 Documentation](https://developers.cloudflare.com/r2/)
- [Cloudflare API Documentation](https://developers.cloudflare.com/api/)
- [Security Best Practices](https://developers.cloudflare.com/security/)

## Support

For issues or questions:
- Check [Cloudflare Community](https://community.cloudflare.com/)
- Review [Status Page](https://www.cloudflarestatus.com/)
- Contact support via dashboard if on paid plan
