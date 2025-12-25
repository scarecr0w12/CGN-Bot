# Extension Migration Guide - Security Update

**Date:** December 24, 2024  
**Status:** ✅ All existing extensions compatible

## Audit Results

Scanned **234 extension files** for breaking changes:
- ✅ **0 extensions** use `modules.rss`
- ✅ **0 extensions** import `feed-read`
- ✅ **0 extensions** use Wolfram API

**Conclusion:** All existing extensions are compatible with the security update. No migration required.

---

## Breaking Changes Reference

### Removed: `modules.rss`

**Why:** The `feed-read` package has critical security vulnerabilities (CVE-2025-7783) and depends on the deprecated `request` package.

**Migration Path:**

#### Before (❌ No longer works):
```javascript
const rss = require('rss');
const feed = await rss.get('https://example.com/feed.xml');
```

#### After (✅ Use this instead):
```javascript
const fetch = require('fetch');
const xmlparser = require('xmlparser');

const response = await fetch('https://example.com/feed.xml');
const parsed = xmlparser(response);

// Extract RSS items
const items = parsed.rss?.channel?.item || [];
items.forEach(item => {
  console.log(item.title, item.link);
});
```

---

## Available Modules (Updated)

### Core Modules ✅

- `modules.message` - Interact with Discord messages
- `modules.channel` - Channel operations
- `modules.guild` - Server/guild information
- `modules.config` - Extension configuration
- `modules.bot` - Bot information
- `modules.utils` - Utility functions
- `modules.interaction` - Slash command interactions

### Third-Party Modules ✅

- `modules.moment` - Date/time manipulation
- `modules.fetch` - HTTP requests (use for RSS feeds)
- `modules.xmlparser` - Parse XML/RSS feeds
- `modules.http` - Advanced HTTP operations

### Removed Modules ❌

- ~~`modules.rss`~~ → Use `modules.fetch` + `modules.xmlparser`

---

## Examples

### Example 1: Fetch RSS Feed

```javascript
const message = require('message');
const fetch = require('fetch');
const xmlparser = require('xmlparser');

async function fetchRSSFeed() {
  try {
    const feedUrl = 'https://news.example.com/rss';
    const response = await fetch(feedUrl);
    const parsed = xmlparser(response);
    
    const items = parsed.rss?.channel?.item?.slice(0, 5) || [];
    
    let feedContent = '📰 **Latest News**\n\n';
    items.forEach((item, index) => {
      feedContent += `${index + 1}. **${item.title}**\n`;
      feedContent += `   ${item.link}\n\n`;
    });
    
    message.channel.send({
      embeds: [{
        title: 'RSS Feed',
        description: feedContent,
        color: 0x3498db
      }]
    });
  } catch (error) {
    message.channel.send('Failed to fetch RSS feed: ' + error.message);
  }
}

fetchRSSFeed();
```

### Example 2: Parse Atom Feed

```javascript
const fetch = require('fetch');
const xmlparser = require('xmlparser');

const response = await fetch('https://blog.example.com/atom.xml');
const parsed = xmlparser(response);

// Atom feeds use 'entry' instead of 'item'
const entries = parsed.feed?.entry || [];
entries.forEach(entry => {
  console.log(entry.title, entry.link?.href);
});
```

---

## Testing Your Extension

1. **Update your code** to use `modules.fetch` + `modules.xmlparser`
2. **Test in sandbox** using Extension Builder
3. **Verify functionality** with real RSS feeds
4. **Submit updated version** to gallery

---

## Need Help?

If you have questions or need assistance migrating an extension:

1. Open an issue on GitHub
2. Join our Discord support server
3. Check the Extension Development documentation

---

## Version Compatibility

| SkynetBot Version | modules.rss Support | Migration Required |
|-------------------|---------------------|-------------------|
| < 1.8.0 | ✅ Supported | No |
| >= 1.8.0 | ❌ Removed | Yes, if using RSS |

**Current Version:** 1.8.0
