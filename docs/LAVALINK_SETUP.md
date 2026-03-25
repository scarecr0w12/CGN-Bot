# Lavalink Audio System Setup Guide

The bot uses **Lavalink** for music streaming - a standalone audio server that handles YouTube, SoundCloud, and other sources without requiring cookies or authentication.

## Overview

**Lavalink** provides:
- ✅ **No cookies required** - Works out of the box
- ✅ **Stable streaming** - Professional-grade audio server
- ✅ **Multiple sources** - YouTube, SoundCloud, Bandcamp, Twitch
- ✅ **High performance** - Optimized for Discord voice
- ✅ **Easy scaling** - Separate from bot process

## Quick Start

### 1. Configuration (Already Done!)

The Lavalink server is already configured in `docker-compose.yml` and `lavalink-config.yml`. Default settings:

```env
LAVALINK_HOST=127.0.0.1
LAVALINK_PORT=2333
LAVALINK_PASSWORD=youshallnotpass
```

### 2. Start Lavalink

Lavalink starts automatically with the bot:

```bash
docker compose up -d
```

### 3. Verify It's Running

Check Lavalink logs:

```bash
docker compose logs lavalink
```

You should see:
```
Lavalink is ready to accept connections.
```

### 4. Test Music Commands

Try playing a song:
```
!play never gonna give you up
```

## Configuration

### Environment Variables

Edit `.env` to customize Lavalink connection:

```env
LAVALINK_HOST=127.0.0.1      # Lavalink server host
LAVALINK_PORT=2333           # Lavalink server port
LAVALINK_PASSWORD=youshallnotpass  # Change for production!
```

### Lavalink Server Config

Edit `lavalink-config.yml` to configure:

**Enabled Sources:**
```yaml
sources:
  youtube: true
  soundcloud: true
  bandcamp: true
  twitch: true
  vimeo: true
  http: true
```

**Performance Tuning:**
```yaml
bufferDurationMs: 400          # Audio buffer
youtubePlaylistLoadLimit: 6    # Max playlist size
```

## Available Music Commands

| Command | Description |
|---------|-------------|
| `!play <song/url>` | Play a song or playlist |
| `!queue [page]` | Show the music queue |
| `!skip` | Skip current track |
| `!dj pause` | Pause playback |
| `!dj resume` | Resume playback |
| `!dj stop` | Stop and clear queue |
| `!dj volume <0-200>` | Adjust volume |
| `!dj loop <off/track/queue>` | Set loop mode |
| `!dj shuffle` | Shuffle queue |
| `!dj remove <position>` | Remove track from queue |
| `!dj clear` | Clear entire queue |
| `!dj disconnect` | Disconnect from voice |
| `!filters` | Apply audio filters |

## Troubleshooting

### "Audio system is not available"

**Cause:** Lavalink server is not running or not connected.

**Solution:**
1. Check if Lavalink container is running:
   ```bash
   docker compose ps lavalink
   ```

2. Check Lavalink logs:
   ```bash
   docker compose logs lavalink --tail=50
   ```

3. Restart Lavalink:
   ```bash
   docker compose restart lavalink
   ```

### "No results found for your query"

**Cause:** YouTube search failed or query is invalid.

**Solutions:**
- Try a different search term
- Use a direct YouTube URL instead
- Check if YouTube is accessible from your server

### Bot doesn't join voice channel

**Cause:** Missing voice permissions or connection issues.

**Solutions:**
- Verify bot has `Connect` and `Speak` permissions
- Check voice channel isn't full
- Restart bot: `docker compose restart bot`

### Audio quality issues

**Cause:** Network latency or buffer settings.

**Solutions:**
1. Increase buffer in `lavalink-config.yml`:
   ```yaml
   bufferDurationMs: 800
   ```

2. Check server network performance

3. Lower music volume: `!dj volume 80`

### Lavalink won't start

**Cause:** Port conflict or configuration error.

**Solutions:**
1. Check if port 2333 is available:
   ```bash
   lsof -i :2333
   ```

2. Verify `lavalink-config.yml` syntax:
   ```bash
   docker compose config lavalink
   ```

3. Check logs for errors:
   ```bash
   docker compose logs lavalink
   ```

## Advanced Configuration

### Custom Lavalink Node

To use an external Lavalink server, update `.env`:

```env
LAVALINK_HOST=lavalink.example.com
LAVALINK_PORT=443
LAVALINK_PASSWORD=your-secure-password
```

### Multiple Nodes (Load Balancing)

Edit `Modules/LavalinkManager.js` to add additional nodes:

```javascript
nodes: [
  {
    host: "lavalink1.example.com",
    port: 2333,
    password: "password1",
  },
  {
    host: "lavalink2.example.com",
    port: 2333,
    password: "password2",
  },
]
```

### Enable/Disable Sources

Edit `lavalink-config.yml` to control which sources are available:

```yaml
sources:
  youtube: true
  soundcloud: false    # Disable SoundCloud
  bandcamp: true
  twitch: false        # Disable Twitch
```

## Monitoring

### Prometheus Metrics

Lavalink exposes metrics at `http://localhost:2333/metrics`

Configure Prometheus to scrape Lavalink metrics by adding to `monitoring/prometheus/prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'lavalink'
    static_configs:
      - targets: ['localhost:2333']
```

### Health Check

Check Lavalink version and health:

```bash
curl http://localhost:2333/version
```

## Comparison to play-dl

| Feature | Lavalink | play-dl |
|---------|----------|---------|
| **Setup** | Docker container | Requires cookies |
| **Maintenance** | Auto-updates | Manual cookie refresh |
| **Stability** | Very stable | Breaks frequently |
| **Performance** | Optimized | Good |
| **Scalability** | Excellent | Limited |
| **Sources** | Multiple | YouTube only |
| **Authentication** | None needed | Cookies required |

## Migration from play-dl

If you're migrating from the old play-dl system:

1. ✅ **Done:** Lavalink is now installed
2. ✅ **Done:** Commands are updated
3. 🗑️ **Cleanup:** Remove old files (optional):
   ```bash
   rm -f .youtube-cookies.json
   rm -rf Internals/Audio/AudioInit.js
   rm -rf Internals/Audio/AudioManager.js
   ```

## Resources

- [Lavalink GitHub](https://github.com/lavalink-devs/Lavalink)
- [erela.js Documentation](https://erelajs-docs.netlify.app/)
- [Discord.js Voice Guide](https://discordjs.guide/voice/)

## Support

If you encounter issues:
1. Check logs: `docker compose logs bot lavalink`
2. Verify permissions in Discord voice channels
3. Test with a simple query: `!play test`
4. Restart services: `docker compose restart bot lavalink`
