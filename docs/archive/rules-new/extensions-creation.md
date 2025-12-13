---
description: Comprehensive specification for extension creation including code structure, API reference, and scopes
trigger: model_decision
---

# Extension Creation Guide

Extensions allow server administrators to add custom functionality running in a secure, isolated sandbox environment.

**Importance Score: 80/100**

## Extension Types

| Type | Trigger | Module |
|------|---------|--------|
| **Command** | User runs command with prefix | `require("command")` |
| **Keyword** | Keywords appear in messages | `require("keyword")` |
| **Event** | Discord events (join, leave, etc.) | `require("event")` |
| **Timer** | Scheduled intervals (min 5 min) | N/A |

## Sandbox Environment

- **Runtime**: V8 isolate via `isolated-vm`
- **Memory Limit**: 128MB
- **Execution Timeout**: 5 seconds (default)
- **Storage Limit**: 25KB per extension per server
- **No External Requests**: `fetch`, `rss`, `xmlparser` unavailable
- **No File System Access**: Extensions cannot read/write files

## Available Modules

### Core Modules (No Scope Required)

| Module | Description |
|--------|-------------|
| `message` | Triggering message data |
| `user` / `author` | Message author as user |
| `bot` | Bot user information |
| `command` | Command data (command type only) |
| `keyword` | Keyword data (keyword type only) |
| `event` | Event data (event type only) |
| `extension` | Extension metadata |
| `utils` | Utility functions |
| `embed` | Embed builder helper |

### Scope-Required Modules

| Module | Scope Required |
|--------|----------------|
| `channel` | `channels_read` |
| `guild` | `guild_read` |
| `member` | `members_read` |
| `roles` | `roles_read` |
| `config` | `config` |
| `points` / `economy` | `members_read` (read), `economy_manage` (write) |

## Extension Scopes (22 Total)

### By Category

**Moderation**
- `ban` - Ban members from guild
- `kick` - Kick members from guild
- `timeout` - Timeout members
- `modlog` - Access moderation logs

**Roles**
- `roles_read` - Access guild role information
- `roles_manage` - Assign/remove roles from members

**Channels**
- `channels_read` - Access channel information
- `channels_manage` - Modify channels, pin messages
- `threads` - Manage threads

**Guild**
- `guild_read` - Access guild settings and info
- `guild_manage` - Modify guild settings

**Members**
- `members_read` - Access member information
- `members_manage` - Manage members (nicknames, etc.)

**Messages**
- `messages_read` - Read message history
- `messages_global` - Read messages in all channels
- `messages_write` - Send messages in all channels
- `messages_manage` - Delete messages
- `reactions` - Add/remove reactions

**Economy**
- `economy_read` - Read economy/points data
- `economy_manage` - Modify user points

**Data**
- `config` - Read Skynet configuration
- `storage` - Access extension storage

**Network/Advanced**
- `http_request` - Make HTTP requests
- `webhooks` - Manage webhooks
- `embed_links` - Embed links in messages

## API Quick Reference

### Message Module

```javascript
const message = require("message");

message.id              // Message snowflake ID
message.content         // Raw message content
message.suffix          // Content after command
message.author.id       // User ID
message.author.username // Username
message.author.tag      // Username#discriminator
message.channel.id      // Channel ID
message.guild.id        // Guild ID
```

### Utils Module

```javascript
const utils = require("utils");

// Text utilities
utils.text.upper("hello")           // "HELLO"
utils.text.truncate("long", 3)      // "lo..."
utils.text.escapeMarkdown("**x**")  // "\\*\\*x\\*\\*"

// Random utilities
utils.random.int(1, 10)             // Random 1-10
utils.random.pick(["a", "b"])       // Random element
utils.random.dice("2d6+3")          // { rolls: [3,5], total: 11 }

// Math utilities
utils.math.clamp(15, 0, 10)         // 10
utils.math.round(3.14159, 2)        // 3.14

// Format utilities
utils.format.number(1234567)        // "1,234,567"
utils.format.duration(3661000)      // "1h 1m"
utils.format.ordinal(1)             // "1st"

// Time utilities
utils.time.now()                    // Current timestamp (ms)
utils.time.discord(Date.now())      // "<t:1234567890:f>"
utils.time.relative(oldTimestamp)   // "2 hours ago"

// Discord utilities
utils.discord.userMention("123")    // "<@123>"
utils.discord.channelMention("123") // "<#123>"
utils.discord.codeBlock("code", "js") // ```js\ncode\n```
```

### Embed Module

```javascript
const embed = require("embed");

const myEmbed = embed.create({
    title: "My Title",
    description: "My description",
    color: embed.colors.BLUE,
    fields: [
        { name: "Field 1", value: "Value 1", inline: true }
    ],
    footer: { text: "Footer text" },
    timestamp: new Date().toISOString()
});

// Available colors
embed.colors.DEFAULT, embed.colors.BLUE, embed.colors.GREEN,
embed.colors.RED, embed.colors.GOLD, embed.colors.PURPLE,
embed.colors.SUCCESS, embed.colors.ERROR, embed.colors.WARNING
```

### Points/Economy Module

```javascript
const points = require("points");  // Requires members_read

// Read-only properties
points.isEnabled          // Boolean
points.self.rankScore     // Your rank score
points.self.rank          // Current rank name
points.leaderboard        // Top 25 users

// Read methods
points.getSelf()          // Your points data
points.getUser(userId)    // Another user's data
points.getLeaderboard(10) // Top N users

// Write methods (require economy_manage scope)
points.addPoints(userId, amount, reason)
points.removePoints(userId, amount, reason)
points.transfer(fromId, toId, amount, reason)
points.setPoints(userId, amount, reason)
```

### Extension Storage

```javascript
const extension = require("extension");

// Read storage (up to 25KB)
let data = extension.storage.get("key") || {};

// Write storage
await extension.storage.write("key", data);

// Clear storage
await extension.storage.clear();
```

## Code Examples

### Simple Command

```javascript
const message = require("message");
const utils = require("utils");

const greetings = ["Hello! 👋", "Hey!", "Greetings!"];
message.reply(utils.random.pick(greetings));
```

### User Info Command

```javascript
const message = require("message");
const member = require("member");
const embed = require("embed");
const utils = require("utils");

const infoEmbed = embed.create({
    title: `${member.user.displayName}'s Info`,
    color: embed.colors.BLUE,
    thumbnail: { url: member.avatarURL },
    fields: [
        { name: "ID", value: member.id, inline: true },
        { name: "Joined", value: utils.time.discord(member.joinedTimestamp, "D"), inline: true },
        { name: "Roles", value: `${member.roles.length} roles`, inline: true }
    ]
});

message.reply({ embeds: [infoEmbed] });
```

### Gambling Command (Economy Write)

```javascript
// Requires scopes: ["messages_write", "members_read", "economy_manage"]
const economy = require("economy");
const message = require("message");
const command = require("command");
const embed = require("embed");

const bet = parseInt(command.suffix);
const userData = economy.getSelf();

if (!bet || bet <= 0 || bet > 1000) {
    message.reply("Usage: gamble <1-1000>");
} else if (bet > userData.rankScore) {
    message.reply("Insufficient points! Balance: " + userData.rankScore);
} else {
    const win = Math.random() > 0.5;
    const result = win 
        ? economy.addPoints(message.author.id, bet, "Gamble win")
        : economy.removePoints(message.author.id, bet, "Gamble loss");
    
    message.reply({
        embeds: [embed.create({
            title: win ? "🎰 You Won!" : "🎰 You Lost!",
            description: `${win ? "Won" : "Lost"} **${bet}** points.\nNew Balance: **${result.newBalance}**`,
            color: win ? embed.colors.SUCCESS : embed.colors.ERROR
        })]
    });
}
```

## Error Handling

```javascript
try {
    const member = require("member");
    // Use member...
} catch (err) {
    console.log("Error:", err.message);
    message.reply("Something went wrong!");
}
```

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `MISSING_SCOPES` | Module requires undeclared scope | Add scope to extension settings |
| `UNKNOWN_MODULE` | Invalid module for extension type | Use correct module for type |
| `STORAGE_LIMIT` | Exceeded 25KB storage | Clear old data |

## Builder Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save extension |
| `Ctrl+/` | Toggle comment |
| `Ctrl+D` | Duplicate line |
| `Ctrl+Shift+F` | Format code |

## Key Files

| File | Purpose |
|------|---------|
| `Internals/Extensions/API/IsolatedSandbox.js` | Sandbox (8KB) |
| `Internals/Extensions/API/Structures/` | API structures |
| `Internals/Extensions/API/Utils/Points.js` | Economy module (15KB) |
| `docs/EXTENSION_DEVELOPMENT.md` | Full API reference |
