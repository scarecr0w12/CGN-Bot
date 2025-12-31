# Social Media Alerts

Get instant Discord notifications when your favorite content creators go live or upload new content! The Social Media Alerts system monitors Twitch streams and YouTube channels, sending customizable alerts to your server.

## Supported Platforms

- **Twitch** - Live stream notifications
- **YouTube** - New video upload notifications

## Features

### Real-Time Monitoring
- Automatic detection when streamers go live
- Instant notifications for new YouTube videos
- Configurable check intervals

### Customizable Alerts
- Custom embed messages with placeholders
- Role mentions for important notifications
- Channel-specific alert destinations

### Tier Gating
- **Free Tier:** 3 alerts per server
- **Tier 1 (Starter):** 10 alerts per server
- **Tier 2 (Premium):** Unlimited alerts

## Getting Started

### Using Slash Commands

#### Add an Alert
```
/socialalerts add platform:twitch account:shroud channel:#notifications
```

**Parameters:**
- `platform` - Choose `twitch` or `youtube`
- `account` - Twitch username or YouTube channel ID/username
- `channel` - Discord channel for notifications

#### List Your Alerts
```
/socialalerts list
```
Shows all configured alerts with their status and IDs.

#### Toggle an Alert
```
/socialalerts toggle id:alert_123 enabled:true
```
Enable or disable an alert without deleting it.

#### Remove an Alert
```
/socialalerts remove id:alert_123
```
Permanently delete an alert.

### Using the Dashboard

1. Navigate to **Dashboard → Social Alerts**
2. Click **"Add Alert"**
3. Select platform (Twitch/YouTube)
4. Enter account username or channel ID
5. Choose Discord notification channel
6. (Optional) Customize message template
7. (Optional) Add role mentions
8. Click **"Add Alert"**

## Custom Message Templates

Personalize your alert messages with placeholders:

### Available Placeholders

**Twitch:**
- `{username}` - Streamer's username
- `{title}` - Stream title
- `{game}` - Game/category being played
- `{url}` - Direct link to stream
- `{viewers}` - Current viewer count

**YouTube:**
- `{username}` - Channel name
- `{title}` - Video title
- `{url}` - Direct link to video
- `{description}` - Video description (truncated)

### Example Templates

**Twitch:**
```
🔴 {username} is now LIVE playing {game}!
{title}
Watch now: {url}
```

**YouTube:**
```
🎬 New video from {username}!
{title}
Watch: {url}
```

## Role Mentions

Alert specific roles when content goes live:

1. In dashboard, enter role names separated by commas: `@Notifications, @Streamers`
2. Or use role IDs for precision: `123456789, 987654321`
3. Ensure bot has permission to mention the roles

## API Setup

### Twitch API

1. Visit [Twitch Developer Console](https://dev.twitch.tv/console/apps)
2. Create a new application
3. Note your **Client ID** and **Client Secret**
4. Add to `.env`:
```bash
TWITCH_CLIENT_ID=your_client_id
TWITCH_CLIENT_SECRET=your_client_secret
```

### YouTube Data API

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable **YouTube Data API v3**
4. Create API credentials (API Key)
5. Add to `.env`:
```bash
YOUTUBE_API_KEY=your_api_key
```

## Troubleshooting

### Alert Not Triggering

**Check:**
- Alert is enabled (green toggle)
- Bot has permission to send messages in the channel
- API keys are correctly configured
- Account username/ID is correct

### Account Not Found

**Twitch:**
- Use exact Twitch username (case-insensitive)
- Account must exist and be public

**YouTube:**
- Use channel ID (e.g., `UC...`) or custom URL username
- Channel must be public

### Rate Limiting

If you experience delays:
- YouTube API has daily quotas (10,000 units/day default)
- Consider spreading alerts across multiple API keys
- Upgrade your Google Cloud quota if needed

## Best Practices

### Notification Channels
- Create dedicated channels (e.g., `#stream-alerts`, `#youtube-updates`)
- Keep notifications separate from general chat
- Use appropriate permissions

### Alert Management
- Remove inactive streamers/channels
- Group similar content creators
- Test alerts before announcing to members

### Role Mentions
- Create specific notification roles (@Stream-Alerts)
- Make roles opt-in to avoid spam
- Use `@everyone` sparingly

## Limitations

### Free Tier
- Maximum 3 alerts
- Suitable for small communities
- Basic monitoring

### Tier 1 (Starter)
- Maximum 10 alerts
- Ideal for growing servers
- Multiple platform support

### Tier 2 (Premium)
- Unlimited alerts
- Enterprise-level monitoring
- Priority support

## Frequently Asked Questions

**Q: How often does the bot check for updates?**
A: Twitch streams are checked every 2 minutes. YouTube channels are checked every 5 minutes.

**Q: Can I get notifications for multiple languages?**
A: Yes, the bot monitors all content regardless of language.

**Q: Will I get notified for re-streams?**
A: Twitch alerts detect when a stream goes live, including re-streams. Set appropriate filters if needed.

**Q: Can I monitor private streams?**
A: No, only public content can be monitored.

**Q: Do alerts work with YouTube Shorts?**
A: Yes, new Shorts are detected as video uploads.

## Related Features

- [Server Profile](Server-Profile) - Showcase your creator content
- [Premium Features](Premium-Features) - Upgrade for unlimited alerts
- [Dashboard Guide](Dashboard-Guide) - Learn more about the dashboard

---

Need help? Join our [support server](https://discord.gg/SE6xHmvKrZ) or use `/help socialalerts` in Discord.

*Last updated: December 31, 2025*
