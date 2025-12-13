---
description: Command structure, categories, rate limiting, and execution patterns
trigger: model_decision
---

# Command Framework

The bot uses a categorized command system with rate limiting, permission controls, and cooldown management.

**Importance Score: 70/100**

## Command Categories

Path: `Commands/`

| Category | Path | Purpose |
|----------|------|---------|
| **PM** | `Commands/PM/` | Private message commands (11 files) |
| **Private** | `Commands/Private/` | Server admin only commands (4 files) |
| **Public** | `Commands/Public/` | General user commands (112 files) |
| **Shared** | `Commands/Shared/` | Cross-context commands (4 files) |

### Category Base Files

Each category has a `_base.js` file defining shared behavior:

- `Commands/PM/_base.js`
- `Commands/Public/_base.js`
- `Commands/Shared/_base.js`

## Command Structure

### Basic Command Template

```javascript
module.exports = {
    name: 'commandname',
    aliases: ['alias1', 'alias2'],
    description: 'What the command does',
    usage: '<required> [optional]',
    category: 'Category',
    cooldown: 5,  // seconds
    permissions: ['SEND_MESSAGES'],
    botPermissions: ['EMBED_LINKS'],
    
    async execute(client, msg, args) {
        // Command logic
    }
};
```

### With Tier Gating

```javascript
const TierManager = require('../../Modules/TierManager');

module.exports = {
    name: 'premium-command',
    // ... other properties
    
    async execute(client, msg, args) {
        // Check server subscription
        const hasAccess = await TierManager.canAccess(msg.guild.id, 'feature_key');
        if (!hasAccess) {
            return msg.reply('This feature requires a premium subscription.');
        }
        
        // Command logic
    }
};
```

## Key Public Commands

| Command | File | Purpose |
|---------|------|---------|
| `ai.js` | AI conversation (tier-gated) |
| `imagine.js` | AI image generation (tier-gated) |
| `room.js` | Temporary voice/text rooms |
| `points.js` | Economy/points system |
| `ranks.js` | Ranking system |
| `trivia.js` | Trivia games |
| `poll.js` | Create polls |
| `afk.js` | AFK status |

## PM Commands

Path: `Commands/PM/`

| Command | Purpose |
|---------|---------|
| `afk.js` | DM AFK management |
| `config.js` | User configuration |
| `mute.js` | Mute notifications |
| `notify.js` | Notification settings |
| `remind.js` | Personal reminders |
| `streamers.js` | Streamer notifications |
| `youtube.js` | YouTube notifications |

## Rate Limiting

### Command Cooldowns

```javascript
module.exports = {
    cooldown: 5,  // 5 second cooldown per user
    // ...
};
```

### Global Rate Limiting

Handled in command processor:

- Per-user cooldown tracking
- Per-channel rate limits for certain commands
- Server-wide rate limits for resource-intensive commands

## Permission System

### User Permissions

```javascript
permissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES']
```

### Bot Permissions

```javascript
botPermissions: ['MANAGE_MESSAGES', 'ADD_REACTIONS']
```

### Admin Levels

| Level | Access |
|-------|--------|
| 0 | All users |
| 1 | Moderators |
| 2 | Admins |
| 3 | Server owner |

## Command Configuration

Path: `Configurations/commands.js`

- Global command settings
- Disabled commands list
- Category configurations
- Prefix settings

## Slash Commands

Path: `Internals/SlashCommands/`

Discord slash command integration:

- Command registration
- Interaction handling
- Autocomplete support

### Key Slash Commands

| Command | Purpose |
|---------|---------|
| `strike.js` | Moderation strikes |
| `tempban.js` | Temporary bans |
| `points.js` | Points management |

## Integration with Extensions

Extensions can create custom commands:

```javascript
// Extension command type
const command = require("command");
const message = require("message");

// command.prefix - Server's command prefix
// command.suffix - Everything after command name
// command.key - Command trigger word

message.reply(`You said: ${command.suffix}`);
```

See `docs/EXTENSION_DEVELOPMENT.md` for full extension API.

## Utility Modules for Commands

### PaginatedEmbed

Path: `Modules/MessageUtils/PaginatedEmbed.js`

```javascript
const PaginatedEmbed = require('./Modules/MessageUtils/PaginatedEmbed');

const pages = [embed1, embed2, embed3];
await PaginatedEmbed.create(msg, pages);
```

### DurationParser

Path: `Modules/MessageUtils/DurationParser.js`

```javascript
const DurationParser = require('./Modules/MessageUtils/DurationParser');

const ms = DurationParser.parse('2h30m');  // Returns milliseconds
```

## Key Files

| File | Purpose |
|------|---------|
| `Commands/index.js` | Command loader |
| `Configurations/commands.js` | Command config |
| `Internals/SlashCommands/` | Slash command system |
| `Modules/MessageUtils/` | Command utilities |
