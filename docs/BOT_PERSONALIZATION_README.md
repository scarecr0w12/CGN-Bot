# Bot Personalization System

**Status:** Tier 2 Implemented ✅ | Tier 3 Designed 📝  
**Version:** 1.0  
**Last Updated:** December 31, 2025

---

## Overview

Bot Personalization allows server owners to customize how the bot appears in their server, providing a more branded and personalized experience. The system is implemented in two tiers:

- **Tier 2 (Premium):** Custom nickname and status per server
- **Tier 3 (Enterprise):** Dedicated bot instances with full customization (planned)

---

## Tier 2 Features (Implemented)

### Custom Nickname
- Set a custom display name for the bot in your server
- Server-specific (doesn't affect other servers)
- Max 32 characters
- Can be reset to default anytime

### Custom Status
- Set custom activity status (Playing, Watching, Listening to, Competing in)
- Choose status state (Online, Idle, Do Not Disturb)
- Max 128 characters
- **Note:** Status is global and affects all servers

---

## Usage

### Dashboard

Navigate to: `Dashboard → Bot Customization`

1. **Enable Customization:** Toggle the switch to activate
2. **Set Nickname:** Enter custom name (leave empty for default)
3. **Configure Status:** Set text, type, and state
4. **Preview:** See changes in real-time preview
5. **Save:** Click "Save Changes" to apply

### Slash Commands

```
/botcustom nickname [name]       - Set custom nickname
/botcustom status [text] [type] [state] - Set custom status
/botcustom enable                - Enable customization
/botcustom disable               - Disable and reset to defaults
/botcustom view                  - View current settings
```

**Examples:**
```
/botcustom nickname name:My Server Bot
/botcustom status text:Managing your server type:Watching state:online
/botcustom view
```

---

## Technical Implementation

### Architecture

```
┌─────────────────────────────────────────────────┐
│           BotCustomizationManager                │
│  - Manages per-server customization             │
│  - Applies nickname on guild join               │
│  - Handles global status rotation               │
└─────────────────────────────────────────────────┘
                      │
                      │ Used by
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
  Dashboard UI  Slash Commands  Event Handlers
```

### Key Files

**Backend:**
- `Modules/BotCustomizationManager.js` - Core manager
- `Database/Schemas/serverConfigSchema.js` - Schema definition
- `Internals/SlashCommands/commands/botcustom.js` - Slash commands
- `Internals/Events/guildCreate/Skynet.BotCustomization.js` - Auto-apply on join
- `Internals/Events/ready/Skynet.Ready.js` - Initialization

**Frontend:**
- `Web/controllers/dashboard/customization.js` - Controller
- `Web/views/pages/admin-bot-customization.ejs` - UI
- `Web/routes/dashboard.js` - Routing

**Database:**
- `Database/migrations/034_add_bot_customization.sql` - Migration

### Database Schema

```javascript
bot_customization: {
  nickname: String,        // Custom nickname (max 32 chars)
  status_text: String,     // Status text (max 128 chars)
  status_type: String,     // PLAYING, WATCHING, LISTENING, COMPETING
  status_state: String,    // online, idle, dnd, invisible
  isEnabled: Boolean,      // Enable/disable customization
}
```

### API Methods

```javascript
// Get customization manager
const manager = client.botCustomization;

// Apply on guild join
await manager.applyOnGuildJoin(guild);

// Update settings
await manager.updateCustomization(guildId, {
  nickname: "Custom Name",
  status_text: "Custom Status",
  status_type: "PLAYING",
  status_state: "online",
  isEnabled: true,
});

// Reset to defaults
await manager.resetCustomization(guildId);

// Get current settings
const settings = await manager.getCustomization(guildId);
```

---

## Tier Gating

### Tier 2 (Premium) Required

**Validation:**
```javascript
const TierManager = require("./Modules/TierManager");
const tier = await TierManager.getServerTier(guildId);

if (!tier || (tier.tier_id !== "premium" && tier.tier_id !== "enterprise")) {
  throw new Error("Bot customization requires Tier 2 (Premium) or higher");
}
```

**Upgrade Paths:**
1. **Paid Subscription:** $9.99/month via Stripe or BTCPay
2. **Vote Rewards:** 10,000 points (100 votes) = 30 days

---

## Limitations & Considerations

### Technical Limitations

1. **Avatar:** Cannot be customized per-server (Discord limitation)
   - Requires webhook proxy or Tier 3 dedicated instance
   
2. **Status:** Global across all servers
   - Last server to update status wins
   - Status rotation every 5 minutes checks for custom status
   
3. **Nickname:** Server-specific ✅
   - Works correctly via `guild.members.me.setNickname()`

### Best Practices

**For Status:**
- Coordinate with other Tier 2+ servers if sharing bot
- Use descriptive status that works globally
- Avoid server-specific references in status

**For Nickname:**
- Keep names recognizable
- Avoid excessive length
- Consider mobile display width

---

## Troubleshooting

### Issue: Nickname not applying

**Causes:**
1. Bot lacks "Change Nickname" permission
2. Bot role is below target position in role hierarchy
3. Server owner trying to change (cannot change owner's nickname)

**Solution:**
1. Grant "Change Nickname" permission
2. Move bot role higher in Server Settings → Roles
3. Use dashboard or slash commands as server admin

### Issue: Status not updating

**Causes:**
1. Another Tier 2+ server updated status after you
2. Status rotation interval (5 minutes) hasn't run yet
3. Bot restarted recently

**Solution:**
1. Status is global - coordinate with other servers
2. Wait for rotation or restart bot
3. Check `isEnabled` is true in settings

### Issue: Dashboard shows "Tier 2 Required"

**Causes:**
1. Server doesn't have Tier 2 subscription
2. Subscription expired
3. Tier check failed

**Solution:**
1. Upgrade via `/subscribe` or dashboard
2. Renew subscription or use vote points
3. Contact support if tier is correct but not detected

---

## Roadmap

### Tier 3 (Enterprise) - Q2-Q3 2026

Full white-label customization with dedicated bot instances:

**Features:**
- ✅ Custom avatar per-server
- ✅ Custom banner
- ✅ Full branding control
- ✅ Dedicated bot token
- ✅ Isolated process
- ✅ 99.9% uptime SLA

**Pricing:** $29.99/month

**Documentation:** See `BOT_PERSONALIZATION_TIER3.md`

---

## Security

**Token Security (Tier 3):**
- Bot tokens encrypted at rest (AES-256)
- Never exposed in dashboard or logs
- Decrypted only in memory during bot startup
- Customer-controlled (can regenerate anytime)

**Permission Validation:**
- Tier checks on every operation
- Dashboard and slash command enforcement
- API endpoint protection

**Resource Limits:**
- Nickname: 32 characters
- Status: 128 characters
- Status rotation: 5 minute intervals
- No abuse detection needed (tier-gated)

---

## Support

**Common Questions:**

**Q: Can I change the bot's avatar?**  
A: Not in Tier 2. Avatar customization requires Tier 3 (Enterprise) with dedicated instance.

**Q: Why does my custom status affect other servers?**  
A: Discord bot status is global. Only Tier 3 dedicated instances have independent status.

**Q: Can I have different nicknames in different servers?**  
A: Yes! Nicknames are server-specific and work in Tier 2.

**Q: Do I need to provide my own bot token?**  
A: No for Tier 2. Yes for Tier 3 (you create your own bot application).

**Need Help?**
- [Support Server](https://discord.gg/SE6xHmvKrZ)
- [Documentation](https://skynetbot.net/wiki)
- Email: support@skynetbot.net

---

## Changelog

### v1.0 (December 31, 2025)
- ✅ Initial Tier 2 implementation
- ✅ Custom nickname per server
- ✅ Custom status (global)
- ✅ Dashboard UI with live preview
- ✅ Slash commands (/botcustom)
- ✅ Tier gating and validation
- ✅ Event handlers (auto-apply on join)
- 📝 Tier 3 architecture designed

---

**Authors:** Development Team  
**Maintainer:** CGN-Bot Development  
**License:** Proprietary
