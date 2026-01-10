# Bot Personalization - Tier 3 Enterprise Architecture
**Date:** December 31, 2025  
**Version:** 1.0  
**Status:** Design Phase

---

## Executive Summary

Tier 3 (Enterprise) bot personalization offers dedicated bot instances with full white-label customization, providing enterprise customers with complete control over bot appearance, branding, and identity.

## Current Implementation (Tier 2)

### ✅ Completed Features
- **Custom Nickname:** Server-specific bot display name
- **Custom Status:** Global bot presence (Playing/Watching/Listening/Competing)
- **Status State:** Online/Idle/DND presence state
- **Dashboard UI:** Visual configuration interface
- **Slash Commands:** `/botcustom` for management

### Technical Limitations
- **Avatar:** Global (cannot be per-server without dedicated instance)
- **Status:** Global (last update wins across all servers)
- **Branding:** Limited to nickname changes

---

## Tier 3 Architecture Design

### Core Concept

Instead of sharing a single bot instance across all servers, Tier 3 customers get their own dedicated Discord bot application with a unique token, allowing full customization without limitations.

### Architecture Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Master Coordinator                        │
│  (Main CGN-Bot instance - manages Tier 3 provisioning)     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Provisions & Monitors
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Tier 3      │    │  Tier 3      │    │  Tier 3      │
│  Instance A  │    │  Instance B  │    │  Instance C  │
│              │    │              │    │              │
│  Custom Bot  │    │  Custom Bot  │    │  Custom Bot  │
│  Token       │    │  Token       │    │  Token       │
└──────────────┘    └──────────────┘    └──────────────┘
     Server 1            Server 2            Server 3
```

### Database Schema

```javascript
// New collection: tier3_instances
{
  _id: "instance_uuid",
  server_id: "123456789",
  bot_token: "encrypted_token", // Encrypted customer-provided token
  bot_config: {
    client_id: "987654321",
    username: "CustomBot",
    avatar_hash: "abc123...",
    banner_hash: "def456...",
    accent_color: "#5865F2",
  },
  customization: {
    nickname: "Custom Name",
    status_text: "Custom Status",
    status_type: "PLAYING",
    status_state: "online",
    avatar_url: "https://...", // Custom uploaded avatar
    banner_url: "https://...", // Custom banner
  },
  instance_status: "active", // active, stopped, provisioning, error
  process_id: 12345, // PM2 process ID
  shard_id: 0,
  created_at: Date,
  last_restart: Date,
  uptime_stats: {
    total_uptime: 123456789,
    last_24h_uptime: 86400,
  },
}
```

### Provisioning Workflow

#### Step 1: Customer Onboarding
1. Customer subscribes to Tier 3 ($29.99/month)
2. Dashboard presents bot creation wizard:
   - Option A: **Create New Bot** (guided flow)
   - Option B: **Use Existing Bot** (provide token)

#### Step 2: Bot Creation (Option A)
```
User Flow:
1. Click "Create Discord Application"
   → Opens Discord Developer Portal in new tab
   → Shows step-by-step instructions with screenshots
   
2. User creates application, enables bot
   → Copies Bot Token
   → Copies Application ID
   
3. User pastes credentials into dashboard form
   → System validates token
   → Stores encrypted token in database
   
4. System generates OAuth invite link
   → User adds bot to their server
```

#### Step 3: Instance Provisioning
```javascript
// Modules/Tier3InstanceManager.js

class Tier3InstanceManager {
  async provisionInstance(serverId, botToken, clientId) {
    // 1. Validate bot token
    const isValid = await this.validateToken(botToken);
    
    // 2. Encrypt token
    const encryptedToken = await Encryption.encrypt(botToken);
    
    // 3. Create instance record
    const instance = await Tier3Instances.create({
      _id: uuid(),
      server_id: serverId,
      bot_token: encryptedToken,
      bot_config: { client_id: clientId },
      instance_status: "provisioning",
    });
    
    // 4. Launch dedicated process (PM2)
    const processId = await this.launchBotProcess(instance._id);
    
    // 5. Update instance with process info
    instance.process_id = processId;
    instance.instance_status = "active";
    await instance.save();
    
    return instance;
  }
  
  async launchBotProcess(instanceId) {
    const pm2 = require("pm2");
    
    return new Promise((resolve, reject) => {
      pm2.connect(err => {
        if (err) return reject(err);
        
        pm2.start({
          script: "./tier3-instance.js",
          name: `cgn-bot-tier3-${instanceId}`,
          args: `--instance=${instanceId}`,
          instances: 1,
          exec_mode: "fork",
          max_memory_restart: "512M",
        }, (err, proc) => {
          pm2.disconnect();
          if (err) return reject(err);
          resolve(proc[0].pm_id);
        });
      });
    });
  }
}
```

#### Step 4: Instance Runtime
```javascript
// tier3-instance.js (Entry point for dedicated instances)

const { Client } = require("discord.js");
const instanceId = process.argv.find(a => a.startsWith("--instance="))
  .split("=")[1];

(async () => {
  // Load instance config from database
  const instance = await Tier3Instances.findOne({ _id: instanceId });
  
  // Decrypt bot token
  const botToken = await Encryption.decrypt(instance.bot_token);
  
  // Create Discord client
  const client = new Client({
    intents: [...], // Same intents as main bot
    shards: [instance.shard_id],
    shardCount: 1,
  });
  
  // Load customization manager
  const customization = new BotCustomizationManager(client);
  
  // Apply custom avatar/banner on ready
  client.on("ready", async () => {
    if (instance.customization.avatar_url) {
      await client.user.setAvatar(instance.customization.avatar_url);
    }
    
    await customization.applyStatus(
      instance.customization.status_text,
      instance.customization.status_type,
      instance.customization.status_state
    );
  });
  
  // Login with customer's bot token
  await client.login(botToken);
})();
```

### Dashboard UI Flow

#### Tier 3 Setup Wizard
```
┌────────────────────────────────────────────────────┐
│  Tier 3 Enterprise Bot Setup                       │
├────────────────────────────────────────────────────┤
│                                                     │
│  Step 1: Create Your Discord Bot Application      │
│  ────────────────────────────────────────────────  │
│  [ ] Go to Discord Developer Portal                │
│  [ ] Create New Application                        │
│  [ ] Enable Bot & Copy Token                       │
│  [ ] Copy Application ID                           │
│                                                     │
│  Step 2: Configure Bot Credentials                 │
│  ────────────────────────────────────────────────  │
│  Bot Token:    [________________] [Validate]       │
│  Application:  [________________]                  │
│                                                     │
│  Step 3: Customize Appearance                      │
│  ────────────────────────────────────────────────  │
│  Avatar:  [Upload] Preview: [img]                  │
│  Banner:  [Upload] Preview: [img]                  │
│  Nickname: [______________]                        │
│  Status:   [______________] [PLAYING ▼]            │
│                                                     │
│  Step 4: Add Bot to Server                         │
│  ────────────────────────────────────────────────  │
│  [Copy Invite Link] [Open in Browser]             │
│                                                     │
│  [< Back]              [Launch Instance >]         │
└────────────────────────────────────────────────────┘
```

### Management Dashboard
```
┌────────────────────────────────────────────────────┐
│  Tier 3 Instance Management                        │
├────────────────────────────────────────────────────┤
│                                                     │
│  Status: ● Active    Uptime: 15d 8h 23m           │
│                                                     │
│  Instance Information                              │
│  ─────────────────────────────────────────────     │
│  Bot Name:     CustomBot#1234                      │
│  Application:  987654321                           │
│  Process ID:   12345                               │
│  Memory:       245 MB / 512 MB                     │
│  Shard:        0/1                                 │
│                                                     │
│  Quick Actions                                      │
│  ─────────────────────────────────────────────     │
│  [Restart Instance] [View Logs] [Stop Instance]   │
│                                                     │
│  Customization                                      │
│  ─────────────────────────────────────────────     │
│  Avatar:    [img] [Change]                         │
│  Banner:    [img] [Change]                         │
│  Nickname:  [______________] [Update]              │
│  Status:    [______________] [Update]              │
│                                                     │
│  Advanced Settings                                  │
│  ─────────────────────────────────────────────     │
│  [Regenerate Token] [Decommission Instance]       │
└────────────────────────────────────────────────────┘
```

---

## Technical Requirements

### Infrastructure

**Compute:**
- Dedicated PM2 process per Tier 3 instance
- 512 MB RAM limit per instance
- Auto-restart on crash
- Graceful shutdown on subscription cancellation

**Storage:**
- Avatar/banner images: S3 or CloudFlare R2
- Max 5 MB per image
- CDN delivery

**Security:**
- Bot tokens encrypted at rest (AES-256)
- Tokens never logged or exposed in UI
- Separate process isolation
- Rate limiting per instance

### Monitoring

**Health Checks:**
- Process alive/dead status
- Memory usage
- CPU usage
- Discord API latency
- Error rate

**Alerts:**
- Instance crash → Auto-restart + notify customer
- High memory usage → Warning to customer
- Discord API errors → Dashboard notification

**Logs:**
- Last 1000 log lines per instance
- Real-time log streaming in dashboard
- Error log retention: 7 days

---

## Pricing & Resource Limits

### Tier 3 Enterprise - $29.99/month

**Included:**
- 1 dedicated bot instance
- Full appearance customization
- Custom avatar & banner
- White-label branding
- 99.9% uptime SLA
- Priority support
- Advanced analytics

**Resource Limits:**
- 512 MB RAM per instance
- 1 shard (suitable for servers up to 2,500 members)
- 10 GB CDN bandwidth/month
- Unlimited commands/messages

**Add-ons:**
- Additional shards: +$10/month per shard
- Increased memory (1 GB): +$5/month
- Custom domain: +$15/month

---

## Migration Path

### From Tier 2 to Tier 3

1. Customer upgrades to Tier 3
2. System presents migration wizard
3. Options:
   - **Keep Existing Bot:** Current nickname/status preserved, avatar/banner now customizable
   - **Create New Bot:** Fresh bot application with full control

4. During transition:
   - Old bot (main instance) remains active
   - Customer adds new bot with same permissions
   - Data migration happens automatically
   - Old bot leaves server once confirmed

### From Tier 3 to Tier 2 (Downgrade)

1. Customer downgrades
2. Warning: "Your dedicated bot instance will be decommissioned"
3. Grace period: 7 days to reconsider
4. After grace period:
   - Dedicated instance stopped
   - Main CGN-Bot invited to server
   - Nickname/status settings preserved (Tier 2 features)
   - Avatar/banner reverts to default

---

## Implementation Phases

### Phase 1: Foundation (Q1 2026)
- [ ] Database schema for Tier 3 instances
- [ ] Encryption/decryption for bot tokens
- [ ] PM2 process management integration
- [ ] Basic provisioning workflow

### Phase 2: Dashboard (Q2 2026)
- [ ] Setup wizard UI
- [ ] Instance management dashboard
- [ ] Real-time status monitoring
- [ ] Log viewer

### Phase 3: Customization (Q2 2026)
- [ ] Avatar/banner upload system
- [ ] S3/R2 storage integration
- [ ] Image processing & optimization
- [ ] CDN delivery

### Phase 4: Operations (Q3 2026)
- [ ] Health monitoring & alerting
- [ ] Auto-restart on failure
- [ ] Graceful shutdown handling
- [ ] Backup & disaster recovery

### Phase 5: Scale & Polish (Q3 2026)
- [ ] Multi-shard support
- [ ] Advanced analytics
- [ ] Performance optimization
- [ ] Enterprise support portal

---

## Security Considerations

### Token Protection
- **Storage:** AES-256 encryption with rotating keys
- **Access:** Only decrypted in memory during bot startup
- **Transmission:** Never sent to frontend
- **Rotation:** Customers can regenerate tokens anytime

### Process Isolation
- Each instance runs in separate PM2 process
- No shared memory between instances
- Resource limits enforced via PM2
- Crash of one instance doesn't affect others

### API Security
- Customer tokens validated before storage
- Permissions checked (bot requires specific intents)
- Rate limiting per instance
- Abuse detection & automatic suspension

---

## Support & SLA

### Uptime Guarantee
- **Target:** 99.9% uptime
- **Monitoring:** 24/7 automated health checks
- **Response:** Auto-restart within 30 seconds
- **Incident:** Manual intervention within 15 minutes

### Customer Support
- **Priority Queue:** Tier 3 tickets escalated
- **Response Time:** 4 hours (business hours)
- **Dedicated Contact:** Email + Discord DM
- **Onboarding:** 1-on-1 setup assistance

---

## Cost Analysis

### Per-Customer Costs
- **Compute:** ~$3/month (AWS EC2 t3.nano equivalent)
- **Storage:** ~$0.50/month (S3 + CDN)
- **Support:** ~$5/month (amortized)
- **Total:** ~$8.50/month per customer

### Profit Margin
- **Revenue:** $29.99/month
- **Cost:** $8.50/month
- **Profit:** $21.49/month (72% margin)

### Break-even
- Need 20 Tier 3 customers to cover development costs ($15K)
- Target: 100 customers by Q4 2026 ($2,150/month profit)

---

## Competitive Analysis

### vs Self-Hosting
**Our Advantages:**
- No technical knowledge required
- Managed infrastructure
- Automatic updates
- 99.9% uptime SLA
- Support included

**Self-Hosting:**
- Free (besides server costs)
- Full control
- Requires technical expertise

### vs Other Bots
**MEE6, Carl-bot, Dyno:**
- None offer dedicated instances
- All use shared bot (avatar/status conflicts)
- No white-label options
- We're unique in this space

---

## Future Enhancements (Post-Launch)

### Custom Branding
- Custom embed colors (per-server)
- Custom command prefix colors
- Custom error messages
- Branded dashboard subdomain

### Advanced Features
- Multi-region deployment
- Custom slash command icons
- Webhook proxy for per-server avatars
- Voice region optimization

### Enterprise Portal
- Team management (multiple admins)
- Usage analytics & reporting
- Invoice management
- Contract management

---

**Document Owner:** Development Team  
**Last Updated:** December 31, 2025  
**Next Review:** March 31, 2026
