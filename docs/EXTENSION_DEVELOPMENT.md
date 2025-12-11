# Extension Development Guide

This comprehensive guide covers everything you need to know to develop extensions for Skynet Bot.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Extension Types](#extension-types)
3. [Available Modules](#available-modules)
4. [API Reference](#api-reference)
5. [Scopes & Permissions](#scopes--permissions)
6. [Best Practices](#best-practices)
7. [Examples](#examples)

---

## Introduction

Extensions allow server administrators to add custom functionality to their bot without modifying the core codebase. Extensions run in a secure, isolated sandbox environment with controlled access to Discord and server data.

### Key Features

- **Isolated Execution**: Extensions run in a secure V8 isolate (isolated-vm)
- **Scope-Based Permissions**: Fine-grained control over what extensions can access
- **Persistent Storage**: Each extension can store data (up to 25KB)
- **Multiple Types**: Commands, keywords, events, and timers

---

## Extension Types

### Command Extensions

Triggered when a user runs a specific command with the bot's prefix.

```javascript
const command = require("command");
const message = require("message");

// command.prefix - The server's command prefix
// command.suffix - Everything after the command name
// command.key - The command trigger word

message.reply(`You said: ${command.suffix}`);
```

### Keyword Extensions

Triggered when specific keywords appear in messages.

```javascript
const keyword = require("keyword");
const message = require("message");

// keyword.keywords - Array of trigger keywords

if (message.content.toLowerCase().includes("hello")) {
    message.reply("Hello there! 👋");
}
```

### Event Extensions

Triggered by Discord events (member join, leave, message delete, etc.).

```javascript
const event = require("event");
const guild = require("guild");

// Available events: guildMemberAdd, guildMemberRemove, messageDelete, etc.
console.log(`Event triggered in ${guild.name}`);
```

### Timer Extensions

Run at specified intervals (minimum 5 minutes).

```javascript
const guild = require("guild");
const bot = require("bot");

// Runs every X minutes as configured
console.log(`Timer executed for ${guild.name}`);
```

---

## Available Modules

### Core Modules

| Module | Description | Scope Required |
|--------|-------------|----------------|
| `message` | The triggering message | None |
| `channel` | Channel information | `channels_read` |
| `guild` | Server information | `guild_read` |
| `member` | Message author as member | `members_read` |
| `user` / `author` | Message author as user | None |
| `roles` | Guild role information | `roles_read` |
| `config` | Server Skynet config | `config` |
| `bot` | Bot user information | None |
| `command` | Command data (command type) | None |
| `keyword` | Keyword data (keyword type) | None |
| `event` | Event data (event type) | None |
| `extension` | Extension metadata | None |
| `utils` | Utility functions | None |
| `embed` | Embed builder helper | None |
| `points` / `economy` | Server economy/points data | `members_read` |

---

## API Reference

### Message Module

```javascript
const message = require("message");

// Properties
message.id              // Message snowflake ID
message.content         // Raw message content
message.suffix          // Content after command (for commands)
message.createdAt       // ISO date string

// Author info (always available)
message.author.id       // User ID
message.author.username // Username
message.author.tag      // Username#discriminator
message.author.bot      // Boolean

// Channel info (in message)
message.channel.id      // Channel ID
message.channel.name    // Channel name
message.channel.type    // Channel type number

// Guild info (in message)
message.guild.id        // Guild ID
message.guild.name      // Guild name
```

### Member Module

```javascript
const member = require("member"); // Requires members_read scope

// Properties
member.id                   // Member/User ID
member.nickname             // Server nickname or null
member.displayName          // Nickname or username
member.joinedTimestamp      // When they joined (ms)
member.roles                // Array of role IDs
member.avatarURL            // Avatar URL
member.kickable             // Can bot kick them?
member.bannable             // Can bot ban them?
member.manageable           // Can bot manage them?
member.isOwner              // Is server owner?
member.pending              // Pending verification?

// Nested user object
member.user.id
member.user.username
member.user.tag
member.user.bot
member.user.createdTimestamp
```

### User/Author Module

```javascript
const user = require("user");
// OR
const author = require("author");

// Properties
user.id                 // User snowflake ID
user.username           // Username
user.displayName        // Display name or username
user.discriminator      // Discriminator (usually "0")
user.tag                // Full tag
user.bot                // Is a bot?
user.system             // Is system user?
user.avatar             // Avatar hash
user.banner             // Banner hash
user.accentColor        // Accent color
user.createdTimestamp   // Account creation time
user.avatarURL          // Avatar URL
user.defaultAvatarURL   // Default avatar URL
```

### Guild Module

```javascript
const guild = require("guild"); // Requires guild_read scope

// Properties
guild.id                        // Guild ID
guild.name                      // Guild name
guild.icon                      // Icon hash
guild.banner                    // Banner hash
guild.description               // Guild description
guild.ownerId                   // Owner's user ID
guild.memberCount               // Total members
guild.premiumTier               // Boost level (0-3)
guild.premiumSubscriptionCount  // Number of boosts
guild.verificationLevel         // Verification level
guild.verified                  // Is verified?
guild.partnered                 // Is partnered?
guild.preferredLocale           // Locale string
guild.vanityURLCode             // Vanity URL code
guild.afkChannelId              // AFK channel ID
guild.systemChannelId           // System channel ID
guild.rulesChannelId            // Rules channel ID
guild.createdTimestamp          // Creation time
```

### Channel Module

```javascript
const channel = require("channel"); // Requires channels_read scope

// Properties
channel.id              // Channel ID
channel.name            // Channel name
channel.type            // Channel type number
channel.topic           // Channel topic
channel.nsfw            // Is NSFW?
channel.position        // Position in list
channel.parentId        // Category ID
channel.rateLimitPerUser // Slowmode seconds
channel.lastMessageId   // Last message ID
channel.guildId         // Guild ID
channel.createdTimestamp // Creation time
```

### Roles Module

```javascript
const roles = require("roles"); // Requires roles_read scope

// Properties
roles.count             // Number of roles
roles.list              // Array of role objects
roles.byId              // Object keyed by role ID
roles.highest           // Highest role { id, name }
roles.everyone          // @everyone role { id, name }

// Each role object contains:
// - id, name, color, hexColor, position
// - hoist, mentionable, managed, permissions, members
```

### Utils Module

The utils module provides extensive helper functions organized by category.

#### Text Utilities

```javascript
const utils = require("utils");

utils.text.upper("hello")           // "HELLO"
utils.text.lower("HELLO")           // "hello"
utils.text.capitalize("hello world") // "Hello World"
utils.text.capitalizeFirst("hello") // "Hello"
utils.text.reverse("hello")         // "olleh"
utils.text.truncate("long text", 5) // "lo..."
utils.text.pad("hi", 5, "-")        // "hi---"
utils.text.clean("  too   many  ")  // "too many"
utils.text.slugify("Hello World!")  // "hello-world"
utils.text.count("hello", "l")      // 2
utils.text.includes("Hello", "ell") // true
utils.text.mock("hello")            // "hElLo"
utils.text.replaceAll("aaa", "a", "b") // "bbb"
utils.text.words("hello world")     // ["hello", "world"]
utils.text.escapeHtml("<script>")   // "&lt;script&gt;"
utils.text.escapeMarkdown("**bold**") // "\\*\\*bold\\*\\*"
```

#### Random Utilities

```javascript
const utils = require("utils");

utils.random.int(1, 10)             // Random integer 1-10
utils.random.float(0, 1)            // Random float 0-1
utils.random.pick(["a", "b", "c"])  // Random element
utils.random.pickMultiple(arr, 3)   // 3 random unique elements
utils.random.shuffle([1, 2, 3])     // Shuffled array
utils.random.bool()                 // true or false (50%)
utils.random.bool(0.7)              // true 70% of the time
utils.random.string(8)              // "xK2mN9pQ"
utils.random.string(8, "hex")       // "a3f2c1e9"
utils.random.dice("2d6+3")          // { rolls: [3,5], total: 11 }
utils.random.weighted([
    { item: "common", weight: 70 },
    { item: "rare", weight: 25 },
    { item: "legendary", weight: 5 }
])                                  // Weighted selection
```

#### Math Utilities

```javascript
const utils = require("utils");

utils.math.clamp(15, 0, 10)         // 10
utils.math.lerp(0, 100, 0.5)        // 50
utils.math.map(5, 0, 10, 0, 100)    // 50
utils.math.round(3.14159, 2)        // 3.14
utils.math.percentage(25, 100)      // 25
utils.math.sum([1, 2, 3])           // 6
utils.math.average([1, 2, 3])       // 2
utils.math.min([5, 2, 8])           // 2
utils.math.max([5, 2, 8])           // 8
utils.math.between(5, 1, 10)        // true
```

#### Array Utilities

```javascript
const utils = require("utils");

utils.array.unique([1, 1, 2, 2, 3]) // [1, 2, 3]
utils.array.chunk([1,2,3,4,5], 2)   // [[1,2], [3,4], [5]]
utils.array.flatten([[1,2], [3,4]]) // [1, 2, 3, 4]
utils.array.first([1, 2, 3], 2)     // [1, 2]
utils.array.last([1, 2, 3], 2)      // [2, 3]
utils.array.compact([0, 1, "", 2])  // [1, 2]
utils.array.countBy(["a","a","b"])  // { a: 2, b: 1 }
utils.array.groupBy(arr, "type")    // Groups by property
utils.array.intersection([1,2], [2,3]) // [2]
utils.array.difference([1,2,3], [2]) // [1, 3]
```

#### Format Utilities

```javascript
const utils = require("utils");

utils.format.number(1234567)        // "1,234,567"
utils.format.currency(29.99)        // "$29.99"
utils.format.currency(29.99, "EUR") // "€29.99"
utils.format.bytes(1536)            // "1.5 KB"
utils.format.duration(3661000)      // "1h 1m"
utils.format.duration(3661000, true) // "1 hour, 1 minute, 1 second"
utils.format.ordinal(1)             // "1st"
utils.format.ordinal(22)            // "22nd"
utils.format.list(["a", "b", "c"])  // "a, b, and c"
utils.format.pluralize(1, "cat")    // "cat"
utils.format.pluralize(3, "cat")    // "cats"
utils.format.progressBar(50, 100)   // "█████░░░░░"
```

#### Time Utilities

```javascript
const utils = require("utils");

utils.time.now()                    // Current timestamp (ms)
utils.time.unix()                   // Current timestamp (seconds)
utils.time.parse("2024-01-01")      // Timestamp from string
utils.time.iso()                    // ISO string
utils.time.discord(Date.now())      // "<t:1234567890:f>"
utils.time.discord(Date.now(), "R") // "<t:1234567890:R>" (relative)
utils.time.relative(oldTimestamp)   // "2 hours ago"
utils.time.add(Date.now(), 1, "h")  // Add 1 hour
utils.time.startOf(Date.now(), "day") // Start of today
```

#### Discord Utilities

```javascript
const utils = require("utils");

utils.discord.userMention("123")    // "<@123>"
utils.discord.channelMention("123") // "<#123>"
utils.discord.roleMention("123")    // "<@&123>"
utils.discord.emoji("name", "123")  // "<:name:123>"
utils.discord.codeBlock("code", "js") // ```js\ncode\n```
utils.discord.inlineCode("code")    // `code`
utils.discord.bold("text")          // "**text**"
utils.discord.italic("text")        // "*text*"
utils.discord.underline("text")     // "__text__"
utils.discord.strikethrough("text") // "~~text~~"
utils.discord.spoiler("text")       // "||text||"
utils.discord.quote("text")         // "> text"
utils.discord.blockQuote("text")    // ">>> text"
utils.discord.hyperlink("text", "url") // "[text](url)"
utils.discord.snowflakeToTimestamp("123456789") // Creation time
```

### Embed Module

```javascript
const embed = require("embed");

// Create an embed
const myEmbed = embed.create({
    title: "My Title",
    description: "My description",
    color: embed.colors.BLUE,
    fields: [
        { name: "Field 1", value: "Value 1", inline: true },
        { name: "Field 2", value: "Value 2", inline: true }
    ],
    footer: { text: "Footer text" },
    thumbnail: { url: "https://example.com/image.png" },
    image: { url: "https://example.com/image.png" },
    author: { name: "Author", iconURL: "https://..." },
    timestamp: new Date().toISOString()
});

// Available colors
embed.colors.DEFAULT    // Black
embed.colors.BLUE       // Blue
embed.colors.GREEN      // Green
embed.colors.RED        // Red
embed.colors.GOLD       // Gold
embed.colors.PURPLE     // Purple
embed.colors.ORANGE     // Orange
embed.colors.BLURPLE    // Discord Blurple
embed.colors.SUCCESS    // Bright Green
embed.colors.ERROR      // Bright Red
embed.colors.WARNING    // Orange
embed.colors.INFO       // Blue

// Parse custom color
embed.resolveColor("#FF5500")
embed.resolveColor("RANDOM")
embed.resolveColor([255, 85, 0])
```

### Points/Economy Module

Access the server's points and ranking system.

```javascript
const points = require("points"); // Requires members_read scope for reading
// OR
const economy = require("economy"); // Alias

// Check if points system is enabled
points.isEnabled              // Boolean
points.canWrite               // Boolean - true if economy_manage scope granted

// Your points data (requires members_read scope)
points.self.userId            // Your user ID
points.self.rankScore         // Your rank score
points.self.messages          // Total messages sent
points.self.voice             // Voice activity time
points.self.rank              // Current rank name
points.self.position          // Leaderboard position

// Server leaderboard (top 25 by default)
points.leaderboard            // Array of user entries
points.leaderboard[0].userId
points.leaderboard[0].rankScore
points.leaderboard[0].position

// Server ranks configuration
points.ranks                  // Array of rank objects
points.ranks[0].name          // Rank name
points.ranks[0].maxScore      // Score threshold
points.ranks[0].roleId        // Associated role ID (if any)

// Server economy statistics
points.stats.totalMembers     // Members with points data
points.stats.totalRankScore   // Sum of all rank scores
points.stats.totalMessages    // Sum of all messages
points.stats.averageRankScore // Average rank score
points.stats.ranksConfigured  // Number of configured ranks

// Total members count
points.totalMembers           // Number of tracked members

// --- READ METHODS (require members_read scope) ---

// Get your own points data
points.getSelf()              // Returns { userId, rankScore, messages, voice, rank, position, found }

// Get another user's points data
points.getUser(userId)        // Returns { userId, rankScore, messages, voice, rank, position, found }

// Get server leaderboard
points.getLeaderboard(limit)  // Returns array of user entries (default: 10, max: 100)

// Get configured ranks
points.getRanks()             // Returns array of rank objects

// Get server stats
points.getStats()             // Returns stats object

// Get total member count
points.getTotalMembers()      // Returns number

// --- WRITE METHODS (require economy_manage scope) ---

// Add points to a user (max 10,000 per call)
points.addPoints(userId, amount, reason)
// Returns: { success, userId, previousBalance, newBalance, amountAdded, reason }

// Remove points from a user (max 10,000 per call)
points.removePoints(userId, amount, reason)
// Returns: { success, userId, previousBalance, newBalance, amountRemoved, reason }
// Returns: { success: false, error: "Insufficient points", ... } if not enough

// Transfer points between users (max 10,000 per call)
points.transfer(fromUserId, toUserId, amount, reason)
// Returns: { success, fromUserId, toUserId, amount, fromNewBalance, toNewBalance, reason }

// Set user's points to specific value (0-100,000)
points.setPoints(userId, amount, reason)
// Returns: { success, userId, previousBalance, newBalance, reason }
```

#### Points Module Read Example

```javascript
const points = require("points");
const message = require("message");
const embed = require("embed");
const utils = require("utils");

if (!points.isEnabled) {
    message.reply("Points system is not enabled on this server!");
} else {
    const myData = points.self;
    
    // Build leaderboard display
    const top5 = points.leaderboard.slice(0, 5);
    const leaderboardText = top5
        .map(entry => `${utils.format.ordinal(entry.position)} - ${utils.discord.userMention(entry.userId)}: **${entry.rankScore}** pts`)
        .join("\n");
    
    const statsEmbed = embed.create({
        title: "📊 Server Economy",
        color: embed.colors.GOLD,
        fields: [
            { name: "Your Rank", value: myData.rank, inline: true },
            { name: "Your Score", value: `${myData.rankScore}`, inline: true },
            { name: "Your Position", value: `#${myData.position}`, inline: true },
            { name: "🏆 Top 5", value: leaderboardText || "No data", inline: false },
        ],
        footer: { text: `Total members tracked: ${points.totalMembers}` }
    });
    
    message.reply({ embeds: [statsEmbed] });
}
```

#### Points Module Write Example (Gambling Command)

```javascript
// Requires scopes: ["messages_write", "members_read", "economy_manage"]
const economy = require("economy");
const message = require("message");
const command = require("command");
const embed = require("embed");
const utils = require("utils");

const bet = parseInt(command.suffix);
const userData = economy.getSelf();

if (!bet || isNaN(bet) || bet <= 0) {
    message.reply("Usage: gamble <amount>");
} else if (bet > userData.rankScore) {
    message.reply("You don't have enough points! Balance: " + userData.rankScore);
} else if (bet > 1000) {
    message.reply("Maximum bet is 1,000 points!");
} else {
    const win = Math.random() > 0.5;
    
    if (win) {
        const result = economy.addPoints(message.author.id, bet, "Gamble win");
        message.reply({
            embeds: [embed.create({
                title: "🎰 You Won!",
                description: `You won **${bet}** points!\nNew Balance: **${result.newBalance}**`,
                color: embed.colors.SUCCESS
            })]
        });
    } else {
        const result = economy.removePoints(message.author.id, bet, "Gamble loss");
        message.reply({
            embeds: [embed.create({
                title: "🎰 You Lost!",
                description: `You lost **${bet}** points.\nNew Balance: **${result.newBalance}**`,
                color: embed.colors.ERROR
            })]
        });
    }
}
```

### Extension Module

```javascript
const extension = require("extension");

// Extension metadata
extension.name          // Extension name
extension.version       // Version string
extension.type          // "command", "keyword", "event", "timer"
```

### Bot Module

```javascript
const bot = require("bot");

bot.user.id             // Bot's user ID
bot.user.username       // Bot's username
bot.user.tag            // Bot's tag
bot.prefix              // Server's command prefix
```

### Config Module

```javascript
const config = require("config"); // Requires config scope

// Access server Skynet configuration
config.command_prefix   // Command prefix
config.name_display     // Name display setting
// ... other config options
```

---

## Scopes & Permissions

Extensions must declare which scopes they need. Users installing the extension will see what permissions it requires.

| Scope | Permission | Description |
|-------|------------|-------------|
| `ban` | Ban members | Can ban members from the guild |
| `kick` | Kick members | Can kick members from the guild |
| `roles_read` | Read roles | Can access guild role information |
| `roles_manage` | Manage roles | Can assign/remove roles from members |
| `channels_read` | Read channels | Can access channel information |
| `channels_manage` | Manage channels | Can modify channels, pin messages |
| `guild_read` | Read guild | Can access guild settings and info |
| `guild_manage` | Manage guild | Can modify guild settings |
| `members_read` | Read members | Can access member information |
| `members_manage` | Manage members | Can manage members (nicknames, etc.) |
| `messages_read` | Read messages | Can read message history |
| `messages_global` | Global messages | Can read messages in all channels |
| `messages_write` | Send messages | Can send messages in all channels |
| `messages_manage` | Manage messages | Can delete messages |
| `config` | Read config | Can read Skynet configuration |

---

## Best Practices

### 1. Error Handling

Always wrap potentially failing code in try-catch:

```javascript
try {
    const member = require("member");
    // Use member...
} catch (err) {
    console.log("Error:", err.message);
    message.reply("Something went wrong!");
}
```

### 2. Check Before Acting

Verify conditions before performing actions:

```javascript
const member = require("member");

if (!member.manageable) {
    message.reply("I cannot manage this member!");
    return;
}

// Safe to proceed...
```

### 3. Use Appropriate Scopes

Only request scopes your extension actually needs. Users are more likely to install extensions with minimal permissions.

### 4. Respect Rate Limits

Don't spam messages or actions. The sandbox has built-in limits but be considerate.

### 5. Handle Missing Data

Always check if data exists before using it:

```javascript
const member = require("member");

const nickname = member.nickname || member.user.username;
const joinDate = member.joinedTimestamp 
    ? new Date(member.joinedTimestamp).toLocaleDateString()
    : "Unknown";
```

### 6. Use Storage Wisely

Extension storage is limited to 25KB. Store only essential data:

```javascript
// Good: Store minimal data
extension.storage.write("scores", { user1: 100, user2: 50 });

// Bad: Store large objects
extension.storage.write("history", hugeArrayOfMessages); // May fail!
```

---

## Examples

### Simple Greeting Command

```javascript
const message = require("message");
const utils = require("utils");

const greetings = [
    "Hello there! 👋",
    "Hey! How's it going?",
    "Greetings, traveler!",
    "Hi! Nice to see you!"
];

const greeting = utils.random.pick(greetings);
message.reply(greeting);
```

### User Info Command

```javascript
const message = require("message");
const member = require("member");
const embed = require("embed");
const utils = require("utils");

const targetUser = member.user;
const joinDate = utils.time.discord(member.joinedTimestamp, "D");
const accountAge = utils.time.relative(targetUser.createdTimestamp);

const infoEmbed = embed.create({
    title: `${targetUser.displayName}'s Info`,
    color: embed.colors.BLUE,
    thumbnail: { url: member.avatarURL },
    fields: [
        { name: "Username", value: targetUser.tag, inline: true },
        { name: "ID", value: targetUser.id, inline: true },
        { name: "Joined Server", value: joinDate, inline: false },
        { name: "Account Age", value: accountAge, inline: true },
        { name: "Roles", value: `${member.roles.length} roles`, inline: true },
        { name: "Is Bot", value: targetUser.bot ? "Yes" : "No", inline: true }
    ],
    footer: { text: `Requested by ${message.author.tag}` }
});

message.reply({ embeds: [infoEmbed] });
```

### Dice Rolling Command

```javascript
const command = require("command");
const message = require("message");
const utils = require("utils");
const embed = require("embed");

const notation = command.suffix.trim() || "1d6";
const result = utils.random.dice(notation);

if (result.rolls.length === 0) {
    message.reply("Invalid dice notation! Use format like `2d6` or `1d20+5`");
} else {
    const rollEmbed = embed.create({
        title: "🎲 Dice Roll",
        color: embed.colors.GOLD,
        fields: [
            { name: "Notation", value: `\`${notation}\``, inline: true },
            { name: "Rolls", value: result.rolls.join(", "), inline: true },
            { name: "Total", value: `**${result.total}**`, inline: true }
        ]
    });
    message.reply({ embeds: [rollEmbed] });
}
```

### Welcome Message Event

```javascript
// Event type: guildMemberAdd
const event = require("event");
const guild = require("guild");
const utils = require("utils");
const embed = require("embed");

const member = event.member;
const welcomeEmbed = embed.create({
    title: "Welcome! 🎉",
    description: `Welcome to **${guild.name}**, ${utils.discord.userMention(member.id)}!`,
    color: embed.colors.GREEN,
    thumbnail: { url: member.avatarURL },
    fields: [
        { name: "Member #", value: `${guild.memberCount}`, inline: true },
        { name: "Account Created", value: utils.time.relative(member.user.createdTimestamp), inline: true }
    ],
    footer: { text: "Enjoy your stay!" },
    timestamp: new Date().toISOString()
});

// Note: You'll need to send this to a specific channel configured in your extension
```

### Leaderboard with Storage

```javascript
const command = require("command");
const message = require("message");
const extension = require("extension");
const utils = require("utils");
const embed = require("embed");

// Get or initialize scores
let scores = extension.storage.get("scores") || {};
const userId = message.author.id;

// Add point for participation
scores[userId] = (scores[userId] || 0) + 1;
await extension.storage.write("scores", scores);

// Build leaderboard
const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

const leaderboard = sorted
    .map((entry, i) => `${utils.format.ordinal(i + 1)} - ${utils.discord.userMention(entry[0])}: **${entry[1]}** points`)
    .join("\n");

const lbEmbed = embed.create({
    title: "🏆 Leaderboard",
    description: leaderboard || "No scores yet!",
    color: embed.colors.GOLD,
    footer: { text: `Your score: ${scores[userId]} points` }
});

message.reply({ embeds: [lbEmbed] });
```

---

## Limitations

1. **Execution Timeout**: Extensions have a maximum execution time (default 5 seconds)
2. **Memory Limit**: Isolated VM has 128MB memory limit
3. **Storage Limit**: 25KB per extension per server
4. **No External Requests**: `fetch`, `rss`, and `xmlparser` modules are not available in isolated-vm
5. **No File System Access**: Extensions cannot read/write files
6. **Rate Limits**: Discord's rate limits still apply

---

## Troubleshooting

### "MISSING_SCOPES" Error

Your extension is trying to access a module that requires a scope you haven't declared. Add the required scope to your extension settings.

### "UNKNOWN_MODULE" Error

You're trying to require a module that doesn't exist or isn't available for your extension type (e.g., `command` module in an event extension).

### Extension Not Running

- Check that the extension is enabled for the server
- Verify the trigger (command key, keyword, event type) is correct
- Check the extension status in the dashboard for error messages

### Storage Issues

- Ensure you're not exceeding the 25KB limit
- Use `JSON.stringify()` for complex objects
- Clear old data with `extension.storage.clear()` if needed

---

*Last Updated: December 2024*
*Extension API Version: 2.0*
