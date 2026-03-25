# Audio System Setup Guide

The Audio System uses `play-dl` to stream music from YouTube. YouTube requires authentication cookies to work properly.

## Quick Setup

### 1. Get YouTube Cookies

You need to extract your YouTube cookies to use the music system. Follow these steps:

#### Method 1: Using Browser Extension (Recommended)

1. Install a cookie export extension:
   - Chrome: [EditThisCookie](https://chrome.google.com/webstore/detail/editthiscookie/fngmhnnpilhplaeedifhccceomclgfbg)
   - Firefox: [cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)

2. Go to [YouTube](https://www.youtube.com)
3. Make sure you're logged in to your YouTube account
4. Export cookies for `youtube.com`
5. Save the exported cookies

#### Method 2: Manual Cookie Extraction

1. Open YouTube in your browser
2. Press `F12` to open Developer Tools
3. Go to the "Application" or "Storage" tab
4. Find "Cookies" → "https://www.youtube.com"
5. Copy all cookie values

### 2. Create Cookie File

Create a file named `.youtube-cookies.json` in the bot's root directory:

```json
{
  "cookie": "PASTE_YOUR_COOKIES_HERE"
}
```

**Example format:**
```json
{
  "cookie": "VISITOR_INFO1_LIVE=xyz123; PREF=f1=50000000; YSC=abc456; ..."
}
```

### 3. Restart the Bot

After creating the cookie file, restart the bot. You should see:
```
[INFO] YouTube cookies loaded for play-dl
[INFO] Audio System initialized!
```

## Troubleshooting

### "Music commands may not work properly" Warning

This warning appears if the `.youtube-cookies.json` file is not found. Create the file as described above.

### Search Returns No Results

1. **Check cookies are valid**: YouTube cookies expire periodically. Re-export and update your `.youtube-cookies.json`
2. **Check logs**: Look for "Search error" messages in the logs
3. **Verify YouTube access**: Make sure the account used for cookies can access YouTube normally

### Connection Issues

- Ensure the bot has `Connect` and `Speak` permissions in voice channels
- Check that @discordjs/voice and ffmpeg-static are installed
- Verify voice channel is not full

### Audio Quality Issues

The bot uses high-quality audio (quality: 2) by default. If you experience issues, this can be adjusted in `Internals/Audio/AudioManager.js`.

## Cookie Security

**Important:** Keep your `.youtube-cookies.json` file secure:
- Add it to `.gitignore` (already done)
- Never commit it to version control
- Never share it publicly
- Cookies contain authentication data for your YouTube account

## Advanced Configuration

### Refreshing Cookies

Cookies can be refreshed without restarting:

```javascript
// In bot console or maintainer panel
const AudioInit = require('./Internals/Audio/AudioInit');
await AudioInit.refreshCookies();
```

### Using Different YouTube Account

Simply replace the cookies in `.youtube-cookies.json` with cookies from a different YouTube account.

## Reference

For more information about play-dl cookie setup:
- [play-dl Documentation](https://github.com/play-dl/play-dl)
- [play-dl Instructions](https://github.com/play-dl/play-dl/tree/main/instructions)
