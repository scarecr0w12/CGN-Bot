/* eslint-disable */
/**
 * Wiki Documentation Seed Script
 * Run with: node scripts/seed-wiki.js
 *
 * This script populates the wiki with comprehensive bot documentation including:
 * - Home page
 * - Getting Started guide
 * - Command Reference (by category)
 * - Server Owner Guide
 * - Admin Levels & Permissions
 * - Extensions Guide
 * - FAQ
 *
 * Supports both MongoDB and MariaDB via the Database driver.
 */

require("dotenv").config();
const Database = require("../Database/Driver");

// Import command definitions for documentation
const commands = require("../Configurations/commands.js");

// Wiki page content definitions
const wikiPages = [
	{
		_id: "Home",
		content: `# Welcome to SkynetBot Wiki

Welcome to the official documentation for **SkynetBot** - your all-in-one Discord server management companion!

## Quick Links

- 🚀 [Getting Started](Getting-Started) - New here? Start here!
- 📖 [Command Reference](Commands) - Full list of all commands
- 👑 [Server Owner Guide](Server-Owner-Guide) - Configure your server
- 🛡️ [Admin Levels](Admin-Levels) - Understanding permissions
- 🧩 [Extensions](Extensions) - Extend your bot's functionality
- ❓ [FAQ](FAQ) - Frequently Asked Questions

## Features Overview

### 🎪 Fun & Entertainment
Engage your community with games, memes, jokes, trivia, and interactive commands.

### ⚒️ Powerful Moderation
Keep your server safe with comprehensive moderation tools including bans, kicks, mutes, strikes, and detailed moderation logs.

### 📊 Statistics & Points
Track server activity with SkynetPoints, leaderboards, ranks, and detailed server statistics.

### 🔍 Search & Media
Search Google, YouTube, Wikipedia, anime databases, and more directly from Discord.

### 🤖 AI Assistant
Get AI-powered assistance with the \`ai\` command featuring multi-provider LLM support.

### 🔦 Utility Tools
Calculators, translators, reminders, polls, giveaways, and much more!

---

## Getting Help

- Use \`@SkynetBot help\` or \`!help\` in Discord for command help
- Visit our [support server](https://discord.gg/skynet) for assistance
- Check the [FAQ](FAQ) for common questions

---

*Last updated: ${new Date().toLocaleDateString()}*
`,
		reactions: [],
		updates: [{
			_id: "218536118591684613",
			timestamp: new Date(),
			diff: null,
		}],
	},
	{
		_id: "Getting-Started",
		content: `# Getting Started with SkynetBot

Welcome! This guide will help you set up SkynetBot on your Discord server.

## Step 1: Invite the Bot

1. Click the invite link or use the \`invite\` command
2. Select your server from the dropdown
3. Authorize the required permissions
4. Complete the verification if prompted

## Step 2: Basic Configuration

Once the bot joins your server, it's ready to use with default settings!

### Default Prefix
The default command prefix is \`!\` (exclamation mark). You can change this with:
\`\`\`
!prefix <new prefix>
\`\`\`

### Getting Help
Use the help command to see available commands:
\`\`\`
!help
!help <command name>
\`\`\`

## Step 3: Set Up Moderation (Recommended)

### Enable Moderation Logging
Track all moderation actions in a dedicated channel:
\`\`\`
!modlog enable #mod-logs
\`\`\`

### Configure Admin Levels
SkynetBot uses 4 admin levels (0-3). See [Admin Levels](Admin-Levels) for details.

You can manage admins through the web dashboard or by configuring roles.

## Step 4: Configure Features

### Points & Ranks
Enable the points system through the web dashboard to:
- Track member activity
- Assign automatic ranks based on points
- Create leaderboards

### Starboard
Highlight popular messages:
\`\`\`
!starboard channel #starboard
!starboard threshold 5
!starboard enable
\`\`\`

### Suggestions
Let members submit suggestions:
\`\`\`
!suggest channel #suggestions
!suggest enable
\`\`\`

## Step 5: Web Dashboard

Access the full web dashboard for advanced configuration:

1. Visit the bot's website
2. Login with Discord
3. Select your server
4. Configure all features with a visual interface

### Dashboard Features:
- Command management (enable/disable, permissions)
- Admin and role configuration  
- Points and ranks setup
- Automated messages
- RSS feeds
- And much more!

## Common Commands to Know

| Command | Description |
|---------|-------------|
| \`!help\` | View all commands |
| \`!ping\` | Check bot status |
| \`!info\` | Server information |
| \`!prefix\` | Change command prefix |
| \`!quiet\` | Temporarily disable bot |

## Next Steps

- 📖 Browse the [Command Reference](Commands)
- 👑 Read the [Server Owner Guide](Server-Owner-Guide)
- 🛡️ Configure [Admin Levels](Admin-Levels)

---

Need more help? Join our support server or check the [FAQ](FAQ)!
`,
		reactions: [],
		updates: [{
			_id: "218536118591684613",
			timestamp: new Date(),
			diff: null,
		}],
	},
	{
		_id: "Commands",
		content: generateCommandsPage(commands),
		reactions: [],
		updates: [{
			_id: "218536118591684613",
			timestamp: new Date(),
			diff: null,
		}],
	},
	{
		_id: "Commands-Moderation",
		content: generateCategoryPage(commands, "Moderation ⚒"),
		reactions: [],
		updates: [{
			_id: "218536118591684613",
			timestamp: new Date(),
			diff: null,
		}],
	},
	{
		_id: "Commands-Fun",
		content: generateCategoryPage(commands, "Fun 🎪"),
		reactions: [],
		updates: [{
			_id: "218536118591684613",
			timestamp: new Date(),
			diff: null,
		}],
	},
	{
		_id: "Commands-Utility",
		content: generateCategoryPage(commands, "Utility 🔦"),
		reactions: [],
		updates: [{
			_id: "218536118591684613",
			timestamp: new Date(),
			diff: null,
		}],
	},
	{
		_id: "Commands-Search",
		content: generateCategoryPage(commands, "Search & Media 🎬"),
		reactions: [],
		updates: [{
			_id: "218536118591684613",
			timestamp: new Date(),
			diff: null,
		}],
	},
	{
		_id: "Commands-Stats",
		content: generateCategoryPage(commands, "Stats & Points ⭐️"),
		reactions: [],
		updates: [{
			_id: "218536118591684613",
			timestamp: new Date(),
			diff: null,
		}],
	},
	{
		_id: "Server-Owner-Guide",
		content: `# Server Owner Guide

This comprehensive guide covers everything server owners need to know to get the most out of SkynetBot.

## Web Dashboard Overview

The web dashboard is your central hub for configuring SkynetBot. Access it by:
1. Visiting the bot website
2. Logging in with Discord
3. Selecting your server

### Dashboard Sections

| Section | Description |
|---------|-------------|
| **Overview** | Quick stats and server health |
| **Commands** | Enable/disable commands, set permissions |
| **Admins** | Manage bot administrators |
| **Moderation** | Configure moderation settings |
| **Points & Ranks** | Set up the points system |
| **Messages** | Automated welcome/leave messages |
| **Logs** | View bot activity logs |

## Command Management

### Enabling/Disabling Commands
You can control which commands are available on your server:

**Via Discord:**
\`\`\`
!disable <command>
!enable <command>
\`\`\`

**Via Dashboard:**
Navigate to Commands → toggle commands on/off

### Setting Command Permissions
Each command can require a specific admin level (0-3). See [Admin Levels](Admin-Levels).

### Channel-Specific Controls
- Disable commands in specific channels
- Set up bot-only channels
- Configure NSFW command restrictions

## Moderation Setup

### Moderation Log
Track all moderation actions:
\`\`\`
!modlog enable #mod-logs
\`\`\`

This logs:
- Bans, kicks, mutes
- Strikes/warnings
- Message deletions
- Role changes

### Strike System
Configure automatic actions based on strike count:

| Strikes | Default Action |
|---------|---------------|
| 3 | Warning |
| 5 | Temporary mute |
| 7 | Kick |
| 10 | Ban |

*Configure thresholds in the dashboard*

### Auto-Moderation
Set up automatic moderation through the dashboard:
- Spam protection
- Link filtering
- Word filters
- Mention spam prevention

## Points & Ranks System

### Enabling Points
1. Go to Dashboard → Points & Ranks
2. Enable "SkynetPoints Collection"
3. Configure point values:
   - Messages sent
   - Voice channel time
   - Command usage

### Setting Up Ranks
Create automatic ranks based on points:

1. Go to Dashboard → Ranks
2. Add ranks with point thresholds:
   - Newcomer: 0 points
   - Regular: 100 points
   - Active: 500 points
   - Veteran: 1000 points

### Rank Rewards
Assign Discord roles as rank rewards for automatic role assignment.

## Automated Messages

### Welcome Messages
Greet new members automatically:
1. Dashboard → Messages → Welcome
2. Set the welcome channel
3. Customize the message with variables:
   - \`{user}\` - Mentions the user
   - \`{server}\` - Server name
   - \`{membercount}\` - Member count

### Leave Messages
Announce when members leave with similar customization.

### Message of the Day
Set rotating messages or announcements.

## RSS Feeds

Subscribe to RSS feeds for automatic updates:
1. Dashboard → RSS Feeds
2. Add feed URL
3. Select output channel
4. Set check interval

## Streamers

Get notified when configured streamers go live:
1. Dashboard → Streamers
2. Add Twitch/YouTube usernames
3. Configure announcement channel

## Extensions

Extend bot functionality with community extensions:
1. Browse the [Extension Gallery](/extensions/gallery)
2. Review extension permissions
3. Install with one click
4. Configure in Dashboard → Extensions

See [Extensions](Extensions) for more details.

## Security Best Practices

### Recommended Permissions
Grant only necessary permissions:
- ✅ Send Messages
- ✅ Embed Links
- ✅ Manage Messages (for moderation)
- ✅ Kick/Ban Members (for moderation)
- ❌ Administrator (not recommended)

### Admin Access
- Limit admin level 3 to trusted individuals
- Regularly audit admin list
- Use role-based permissions when possible

### Audit Logs
Regularly check:
- Bot command usage
- Moderation actions
- Configuration changes

## Troubleshooting

### Bot Not Responding
1. Check bot is online (\`!ping\`)
2. Verify bot has channel permissions
3. Check if channel is "quiet" (\`!quiet start\` was used)
4. Verify command prefix

### Commands Not Working
1. Ensure command is enabled
2. Check user has required admin level
3. Verify command isn't disabled in channel
4. Check bot role hierarchy for moderation commands

### Missing Permissions
The bot needs to have roles above users it moderates. Check role hierarchy in Server Settings.

---

Still need help? Check the [FAQ](FAQ) or join our support server!
`,
		reactions: [],
		updates: [{
			_id: "218536118591684613",
			timestamp: new Date(),
			diff: null,
		}],
	},
	{
		_id: "Admin-Levels",
		content: `# Admin Levels & Permissions

SkynetBot uses a hierarchical admin level system to control access to commands and features.

## Admin Level Overview

| Level | Name | Description |
|-------|------|-------------|
| **0** | Member | Regular server members |
| **1** | Moderator | Basic moderation capabilities |
| **2** | Admin | Advanced moderation |
| **3** | Server Admin | Full bot control |

## Level 0 - Member

All server members start at level 0.

### Available Commands:
- Fun commands (8ball, cat, dog, joke, meme, etc.)
- Utility commands (calc, time, translate, etc.)
- Search commands (google, youtube, wiki, etc.)
- Self-management (profile, afk, remindme)
- Points & stats viewing

### Restrictions:
- Cannot use moderation commands
- Cannot change bot settings
- Subject to cooldowns and rate limits

## Level 1 - Moderator

Entry-level moderation access for trusted members.

### Additional Capabilities:
- \`kick\` - Remove members from server
- \`mute\`/\`unmute\` - Restrict member messaging
- \`strike\` - Issue warnings
- \`nuke\` - Bulk delete messages
- \`cool\` - Set channel cooldowns
- \`lock\`/\`unlock\` - Lock channels
- \`slowmode\` - Set slowmode
- \`starboard\` - Configure starboard
- \`reason\` - Update modlog entries
- \`list\` - Manage to-do lists

### Use Cases:
- Day-to-day moderation
- Handling spam and rule violations
- Managing chat flow

## Level 2 - Admin

Advanced moderation for senior staff.

### Additional Capabilities:
- \`softban\` - Ban and immediately unban (clears messages)
- \`tempban\` - Temporary bans with duration

### Use Cases:
- Handling serious violations
- Temporary punishments
- Advanced member management

## Level 3 - Server Admin

Full control over the bot on this server.

### Additional Capabilities:
- \`ban\`/\`unban\` - Permanent bans
- \`prefix\` - Change command prefix
- \`disable\`/\`enable\` - Toggle commands
- \`quiet\` - Disable bot in channels
- \`nick\` - Manage nicknames
- \`modlog\` - Configure moderation logging

### Dashboard Access:
Level 3 admins have full dashboard access including:
- All configuration settings
- Admin management
- Extension installation
- Server-wide settings

## Configuring Admins

### Via Dashboard (Recommended)
1. Go to Dashboard → Admins
2. Search for user by name or ID
3. Set their admin level
4. Click Save

### Via Roles
You can assign admin levels to entire roles:
1. Dashboard → Admins → Role Permissions
2. Select a role
3. Assign admin level
4. All members with that role get that level

### Multiple Levels
If a user has multiple admin levels (e.g., from different roles), the **highest** level applies.

## Permission Inheritance

Higher levels inherit all permissions from lower levels:

\`\`\`
Level 3 → has all Level 2, 1, 0 permissions
Level 2 → has all Level 1, 0 permissions  
Level 1 → has all Level 0 permissions
Level 0 → base permissions
\`\`\`

## Special Permissions

Some commands have special permission requirements:

### Server Owner
- Certain destructive actions may require being server owner
- Full override of all admin levels

### Bot Owner
- Access to maintenance and debug commands
- Can override any restriction

### Command Overrides
Individual commands can be configured to require different admin levels than their defaults via the dashboard.

## Best Practices

### Role Hierarchy
Ensure the bot's role is higher than users it needs to moderate:
\`\`\`
@SkynetBot (highest possible)
@Admin
@Moderator  
@Member
@everyone
\`\`\`

### Least Privilege
Assign the minimum admin level needed:
- Helpers/Trial Mods → Level 1
- Full Moderators → Level 1-2
- Senior Staff → Level 2
- Server Management → Level 3

### Separation of Duties
- Use Level 1 for daily moderation
- Reserve Level 3 for configuration changes
- Regularly audit admin list

## Checking Permissions

### Check Your Level
Contact a server admin or check the dashboard.

### Check Command Requirements
\`\`\`
!help <command>
\`\`\`
Shows the required admin level for each command.

---

See also: [Server Owner Guide](Server-Owner-Guide) | [Commands](Commands)
`,
		reactions: [],
		updates: [{
			_id: "218536118591684613",
			timestamp: new Date(),
			diff: null,
		}],
	},
	{
		_id: "Extensions",
		content: `# Extensions Guide

Extensions allow you to add custom functionality to SkynetBot on your server.

## What Are Extensions?

Extensions are community-created additions that extend the bot's capabilities. They can add:
- New commands
- Automated responses
- Custom features
- Integrations with other services

## Finding Extensions

### Extension Gallery
Browse available extensions at [/extensions/gallery](/extensions/gallery)

Extensions are categorized by:
- **Published** - Reviewed and approved
- **Queue** - Pending review
- **Third-Party** - Unreviewed community extensions

### Extension Information
Each extension listing shows:
- Name and description
- Author information
- Required permissions
- Installation count
- User ratings

## Installing Extensions

### Prerequisites
- You must be a Level 3 admin
- You must have dashboard access

### Installation Steps
1. Browse to the extension you want
2. Click "Install"
3. Select your server
4. Review required permissions
5. Confirm installation

### Permission Review
**Always review extension permissions before installing!**

Extensions may request:
- Read messages
- Send messages
- Manage messages
- Access to user data
- External API access

Only install extensions from trusted authors.

## Managing Extensions

### Dashboard Management
Navigate to Dashboard → Extensions to:
- View installed extensions
- Enable/disable extensions
- Configure extension settings
- Uninstall extensions

### Extension Settings
Many extensions have configurable options:
- Trigger words/phrases
- Channel restrictions
- Response formatting
- Cooldowns

## Creating Extensions

Interested in building your own extensions? Check out our developer guide!

👉 **[Extension Development Guide](Extension-Development)**

### Extension Builder
Create your own extensions at [/extensions/builder](/extensions/builder)

### Requirements
- Discord account
- Basic understanding of extension format
- Test server (recommended)

### Extension Format
Extensions are JSON-based configurations that define:
- Trigger conditions
- Actions to perform
- Response templates
- Permission requirements

### Submission Process
1. Create extension in the builder
2. Test on your server
3. Submit for review
4. Wait for approval
5. Published to gallery

### Guidelines for Creators
- Clear, descriptive names
- Accurate descriptions
- Minimal required permissions
- No malicious code
- Respect Discord ToS

## Extension States

| State | Description |
|-------|-------------|
| **Gallery** | Approved and publicly visible |
| **Queue** | Submitted, awaiting review |
| **Published** | Available for installation |
| **Third-Party** | Unreviewed, use at own risk |

## Troubleshooting

### Extension Not Working
1. Check extension is enabled
2. Verify trigger conditions
3. Check channel permissions
4. Review extension settings

### Permission Errors
- Ensure bot has required permissions
- Check extension permission scope
- Verify your admin level

### Conflicts
If multiple extensions conflict:
- Disable one to isolate the issue
- Adjust trigger conditions
- Contact extension author

## Safety & Security

### Trusted Extensions
- Prefer gallery (reviewed) extensions
- Check author reputation
- Read user reviews

### Red Flags
Avoid extensions that:
- Request excessive permissions
- Have no reviews
- Come from unknown authors
- Promise "too good to be true" features

### Reporting Issues
Report problematic extensions through the gallery interface.

---

See also: [Server Owner Guide](Server-Owner-Guide) | [FAQ](FAQ)
`,
		reactions: [],
		updates: [{
			_id: "218536118591684613",
			timestamp: new Date(),
			diff: null,
		}],
	},
	{
		_id: "Extension-Development",
		content: `# Extension Development

Welcome to the comprehensive guide for developing SkynetBot extensions! This page covers technical details, API references, and best practices.

## Overview

SkynetBot extensions run in a secure, isolated sandbox environment (using \`isolated-vm\`). This ensures safety but imposes some limitations on what code can execute. Extensions are written in JavaScript (ES6+).

## Getting Started

1.  **Access the Builder**: Go to [/extensions/builder](/extensions/builder).
2.  **Define Metadata**: Set the name, description, type (Command, Keyword, or Event), and permissions.
3.  **Write Code**: Use the code editor to write your logic.
4.  **Test**: Save and install the extension to your test server.

## Extension Structure

Extensions consist of **Metadata** and **Code**.

### Metadata
-   **Name**: Unique identifier.
-   **Type**:
    -   \`command\`: Triggered by a command prefix (e.g., \`!mycmd\`).
    -   \`keyword\`: Triggered by specific words in chat.
    -   \`event\`: Triggered by Discord events (e.g., \`memberJoin\`).
-   **Permissions**: Admin level required to use it.
-   **Scopes**: Access rights (e.g., \`channels_read\`, \`guild_read\`).

### Code
The code is executed asynchronously within an \`async () => { ... }\` wrapper.

## API Reference

### Global Objects

-   **\`require(moduleName)\`**: Loads specific modules.
-   **\`console\`**:
    -   \`console.log(msg)\`: Logs to debug console.
    -   \`console.warn(msg)\`: Logs warnings.
    -   \`console.error(msg)\`: Logs errors.

### Available Modules

Load these using \`const module = require('module_name');\`.

#### \`command\` (Type: Command only)
-   \`prefix\`: The server's command prefix.
-   \`suffix\`: The text after the command command.
-   \`key\`: The command name used.

#### \`keyword\` (Type: Keyword only)
-   \`keywords\`: Array of keywords that triggered the extension.

#### \`message\`
Available for Command and Keyword types. **Read-only**.
-   \`id\`: Message ID.
-   \`content\`: Full message content.
-   \`author\`: \`{ id, username, discriminator, tag, bot }\`
-   \`channel\`: \`{ id, name, type }\`
-   \`guild\`: \`{ id, name }\`
-   \`createdAt\`: ISO timestamp.

#### \`channel\`
Requires **\`channels_read\`** scope.
-   \`id\`: Channel ID.
-   \`name\`: Channel name.
-   \`type\`: Channel type.
-   \`topic\`: Channel topic.
-   \`nsfw\`: Boolean.

#### \`guild\`
Requires **\`guild_read\`** scope.
-   \`id\`: Guild ID.
-   \`name\`: Guild name.
-   \`memberCount\`: Total members.
-   \`ownerId\`: Owner's user ID.
-   \`icon\`: Icon URL hash.

#### \`bot\`
-   \`user\`: \`{ id, username, tag }\`
-   \`prefix\`: Default prefix.

#### \`event\` (Type: Event only)
Contains serialized event data specific to the event type.

#### \`moment\`
-   \`now\`: Current timestamp (\`Date.now()\`).

### Unavailable Modules
Due to sandbox limitations, the following are **NOT** available:
-   \`fs\` (File System)
-   \`http\` / \`https\` / \`fetch\` (Network requests)
-   \`rss\`
-   \`xmlparser\`

## Examples

### 1. Simple Ping-Pong Command
*Type: Command*
\`\`\`javascript
const msg = require('message');
console.log("Ping command triggered by " + msg.author.tag);

// Note: To send messages, you currently rely on the system handling the return or side effects which are currently limited in the sandbox.
// Complex interactions often require integration with built-in bot features.
\`\`\`

### 2. Keyword Auto-Responder
*Type: Keyword*
*Keywords: ["help", "support"]*
\`\`\`javascript
const msg = require('message');
const keywords = require('keyword').keywords;

console.log("Found keywords: " + keywords.join(", "));
// Logic to determine response...
\`\`\`

## Best Practices

1.  **Input Validation**: Always sanitize and validate \`msg.content\` or \`suffix\`.
2.  **Performance**: Extensions have a 5-second execution timeout. Avoid heavy computations.
3.  **Error Handling**: Use \`try-catch\` blocks to prevent crashes.
4.  **Scopes**: Only request the permissions you absolutely need.

## Limitations

-   **No Persistance**: Extensions cannot save data to disk or database directly.
-   **No External Requests**: You cannot make API calls (e.g., to Google or OpenAI).
-   **Read-Only Context**: You cannot modify the \`message\` or \`guild\` objects directly to change state in Discord; these are copies.

## Publishing

Once your extension is ready:
1.  Go to **My Extensions**.
2.  Click **Publish**.
3.  Your extension will enter the **Queue** for review by SkynetBot maintainers.
4.  Once approved, it appears in the **Gallery**.

---
[← Back to Extensions](Extensions) | [Home](Home)
`,
		reactions: [],
		updates: [{
			_id: "218536118591684613",
			timestamp: new Date(),
			diff: null,
		}],
	},
	{
		_id: "FAQ",
		content: `# Frequently Asked Questions

## General Questions

### How do I add SkynetBot to my server?
Use the \`!invite\` command in any server where the bot is present, or click the invite link on our website. You need "Manage Server" permission to add bots.

### What is the default command prefix?
The default prefix is \`!\` (exclamation mark). You can also mention the bot: \`@SkynetBot help\`

### How do I change the prefix?
Server admins (Level 3) can change the prefix:
\`\`\`
!prefix <new prefix>
\`\`\`
Example: \`!prefix ?\` changes prefix to \`?\`

### Is SkynetBot free?
Yes! SkynetBot is free to use. Some premium features may require donations to support hosting costs.

---

## Commands

### How do I see all commands?
\`\`\`
!help
\`\`\`
Or visit the [Commands](Commands) wiki page.

### A command isn't working. Why?
Common reasons:
1. **Command disabled** - Admin may have disabled it
2. **Wrong channel** - Some commands are channel-restricted
3. **Missing permissions** - You need a higher admin level
4. **Bot is quiet** - Bot was silenced in this channel
5. **On cooldown** - Wait and try again

### How do I use a command with multiple options?
Use the pipe character \`|\` to separate options:
\`\`\`
!ban @user | 7 | Spamming
\`\`\`
(bans user, deletes 7 days of messages, reason: "Spamming")

### What do the symbols in command usage mean?
- \`<required>\` - You must provide this
- \`[optional]\` - You can skip this
- \`a | b\` - Choose either a or b
- \`...\` - Can repeat multiple times

---

## Permissions & Admins

### How do admin levels work?
SkynetBot has 4 levels (0-3):
- **0**: Regular members
- **1**: Moderators (kick, mute, strike)
- **2**: Admins (tempban, softban)
- **3**: Server admins (full control)

See [Admin Levels](Admin-Levels) for details.

### How do I become an admin?
Contact your server owner. They can add you through the dashboard.

### Why can't I use a moderation command?
You may not have the required admin level. Check with \`!help <command>\` to see the required level.

---

## Points & Ranks

### How do I earn points?
Points are earned by:
- Sending messages
- Being in voice channels
- Server activity

The exact values depend on server configuration.

### How do I check my points?
\`\`\`
!points me
\`\`\`

### Why aren't my points showing?
The server may not have points enabled. Ask a server admin.

### What are ranks?
Ranks are achievements based on points. Servers can configure automatic rank roles at certain point thresholds.

---

## Moderation

### How do I set up a mod log?
\`\`\`
!modlog enable #channel
\`\`\`

### How do I warn a user?
\`\`\`
!strike @user | Reason for warning
\`\`\`

### How do I check a user's strikes?
\`\`\`
!strikes @user
\`\`\`

### What happens when users get strikes?
Depends on server configuration. Defaults:
- Warnings accumulate
- Automatic actions at thresholds (mute, kick, ban)

### How do I temporarily ban someone?
\`\`\`
!tempban @user 7d | Reason
\`\`\`
(Bans for 7 days)

---

## Dashboard

### How do I access the dashboard?
1. Visit the bot website
2. Click "Login with Discord"
3. Select your server

### I can't see my server on the dashboard
- Ensure you have "Manage Server" permission
- Make sure the bot is in the server
- Try logging out and back in

### Changes aren't saving
- Check your internet connection
- Ensure you have Level 3 admin
- Clear browser cache and try again

---

## Extensions

### What are extensions?
Custom additions created by the community. They add new commands and features. See [Extensions](Extensions).

### How do I install an extension?
1. Go to Extensions → Gallery
2. Find an extension
3. Click Install
4. Select your server

### An extension isn't working
- Check it's enabled in dashboard
- Verify trigger conditions
- Check bot permissions

---

## Troubleshooting

### The bot is offline
- Check our status page
- The bot may be updating
- Report extended outages on our support server

### The bot is slow
- High traffic periods may cause delays
- Check your internet connection
- Try again in a few minutes

### I found a bug!
Report it:
\`\`\`
!about bug <description of the bug>
\`\`\`
Or join our support server.

### How do I suggest a feature?
\`\`\`
!about suggestion <your idea>
\`\`\`

---

## Privacy & Data

### What data does the bot collect?
- Server settings and configuration
- Command usage statistics
- Points and message counts (if enabled)

### How do I delete my data?
Contact us through the support server for data deletion requests.

### Is my data shared?
No, server data is not shared with third parties.

---

## Still Need Help?

- Read the [Getting Started](Getting-Started) guide
- Browse the full [Wiki](Home)
- Join our [support server](https://discord.gg/skynet)
`,
		reactions: [],
		updates: [{
			_id: "218536118591684613",
			timestamp: new Date(),
			diff: null,
		}],
	},
];

/**
 * Generate the main commands overview page
 */
function generateCommandsPage(cmds) {
	const publicCmds = cmds.public;
	
	// Group commands by category
	const categories = {};
	for (const [name, cmd] of Object.entries(publicCmds)) {
		const category = cmd.category || "Other";
		if (!categories[category]) {
			categories[category] = [];
		}
		categories[category].push({ name, ...cmd });
	}
	
	let content = `# Command Reference

Complete list of all SkynetBot commands organized by category.

## Quick Navigation

| Category | Commands |
|----------|----------|
`;
	
	// Add category links
	for (const category of Object.keys(categories).sort()) {
		const count = categories[category].length;
		const anchor = category.replace(/[^a-zA-Z]/g, "").toLowerCase();
		content += `| [${category}](#${anchor}) | ${count} commands |\n`;
	}
	
	content += `\n## Category Pages

For detailed information, visit the category-specific pages:
- [Moderation Commands](Commands-Moderation)
- [Fun Commands](Commands-Fun)
- [Utility Commands](Commands-Utility)
- [Search & Media Commands](Commands-Search)
- [Stats & Points Commands](Commands-Stats)

## Command Usage Guide

### Reading Command Syntax
- \`<required>\` - You must provide this argument
- \`[optional]\` - This argument is optional
- \`a | b\` - Choose either a or b
- \`...\` - Can repeat the argument

### Examples
\`\`\`
!help               - No arguments needed
!help ban           - One required argument
!ban @user | reason - Multiple arguments with pipe separator
\`\`\`

---

`;

	// Add each category section
	for (const [category, cmdList] of Object.entries(categories).sort()) {
		const anchor = category.replace(/[^a-zA-Z]/g, "").toLowerCase();
		content += `## ${category}

| Command | Description | Admin Level |
|---------|-------------|-------------|
`;
		
		for (const cmd of cmdList.sort((a, b) => a.name.localeCompare(b.name))) {
			const adminLevel = (cmd.defaults && cmd.defaults.adminLevel) || 0;
			const adminText = adminLevel === 0 ? "Everyone" : `Level ${adminLevel}`;
			const desc = (cmd.description || "No description").replace(/\|/g, "\\|");
			const aliases = cmd.aliases ? ` (${cmd.aliases.join(", ")})` : "";
			content += `| \`${cmd.name}\`${aliases} | ${desc} | ${adminText} |\n`;
		}
		
		content += "\n";
	}
	
	content += `---

## PM Commands

These commands work in direct messages with the bot:

| Command | Usage | Description |
|---------|-------|-------------|
`;
	
	for (const [name, cmd] of Object.entries(cmds.pm)) {
		content += `| \`${name}\` | \`${cmd.usage || ""}\` | PM version |\n`;
	}
	
	content += `
---

*Use \`!help <command>\` in Discord for detailed command information.*
`;
	
	return content;
}

/**
 * Generate a category-specific commands page
 */
function generateCategoryPage(cmds, categoryName) {
	const publicCmds = cmds.public;
	const categoryCommands = [];
	
	for (const [name, cmd] of Object.entries(publicCmds)) {
		if (cmd.category === categoryName) {
			categoryCommands.push({ name, ...cmd });
		}
	}
	
	let content = `# ${categoryName} Commands

Detailed reference for all ${categoryName.toLowerCase()} commands.

## Commands Overview

| Command | Admin Level | Description |
|---------|-------------|-------------|
`;

	for (const cmd of categoryCommands.sort((a, b) => a.name.localeCompare(b.name))) {
		const adminLevel = (cmd.defaults && cmd.defaults.adminLevel) || 0;
		const adminText = adminLevel === 0 ? "Everyone" : `Level ${adminLevel}`;
		const desc = (cmd.description || "No description").replace(/\|/g, "\\|");
		content += `| \`${cmd.name}\` | ${adminText} | ${desc} |\n`;
	}

	content += `\n---\n\n## Detailed Command Reference\n\n`;

	// Detailed entries for each command
	for (const cmd of categoryCommands.sort((a, b) => a.name.localeCompare(b.name))) {
		const adminLevel = (cmd.defaults && cmd.defaults.adminLevel) || 0;
		const adminText = adminLevel === 0 ? "Everyone" : `Level ${adminLevel}`;
		
		content += `### ${cmd.name}\n\n`;
		content += `**Description:** ${cmd.description || "No description"}\n\n`;
		content += `**Usage:** \`!${cmd.name} ${cmd.usage || ""}\`\n\n`;
		content += `**Required Level:** ${adminText}\n\n`;
		
		if (cmd.aliases && cmd.aliases.length > 0) {
			content += `**Aliases:** ${cmd.aliases.map(a => `\`${a}\``).join(", ")}\n\n`;
		}
		
		if (cmd.defaults) {
			const nsfw = cmd.defaults.isNSFWFiltered ? "Yes" : "No";
			content += `**NSFW Filtered:** ${nsfw}\n\n`;
		}
		
		content += "---\n\n";
	}

	content += `\n[← Back to Commands](Commands) | [Home](Home)`;
	
	return content;
}

// Main execution
async function seedWiki() {
	console.log("🚀 Starting Wiki Seed Script...\n");
	
	const databaseType = process.env.DATABASE_TYPE || "mongodb";
	console.log(`📡 Initializing ${databaseType} database...\n`);
	
	try {
		await Database.initialize();
		console.log("✅ Connected to database\n");
		
		const Wiki = global.Wiki;
		
		// Check existing pages
		const existingCount = await Wiki.count({});
		console.log(`📊 Existing wiki pages: ${existingCount}`);
		
		if (existingCount > 0) {
			console.log("\n⚠️  Wiki already has content.");
			console.log("   Run with --force to overwrite existing pages.");
			
			if (!process.argv.includes("--force")) {
				console.log("\n❌ Aborting. Use --force to overwrite.");
				process.exit(0);
				return;
			}
			
			console.log("\n🗑️  --force flag detected. Removing existing wiki pages...");
			await Wiki.delete({});
			console.log("✅ Existing pages removed\n");
		}
		
		// Insert wiki pages
		console.log(`📝 Inserting ${wikiPages.length} wiki pages...\n`);
		
		for (const page of wikiPages) {
			const doc = Wiki.new(page);
			await doc.save();
			console.log(`   ✅ Created: ${page._id}`);
		}
		
		console.log("\n🎉 Wiki seeding complete!");
		console.log(`\n📚 Created pages:`);
		wikiPages.forEach(p => console.log(`   - ${p._id}`));
		
		console.log("\n🌐 Access the wiki at: /wiki");
		
	} catch (error) {
		console.error("\n❌ Error seeding wiki:", error.message);
		throw error;
	} finally {
		console.log("\n📡 Database connection closed");
		process.exit(0);
	}
}

// Run the script
seedWiki().catch(err => {
	console.error(err);
	process.exit(1);
});
