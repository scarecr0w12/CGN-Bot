---
layout: default
title: Getting Started
nav_order: 2
parent: Guide
description: "Quick start guide for SkynetBot server owners"
permalink: /guide/getting-started/
---

# Getting Started

Welcome! This guide helps server owners set up SkynetBot on their Discord server.

---

## Step 1: Invite the Bot

1. Visit the bot's website or use an invite link
2. Select your server from the dropdown
3. Authorize the required permissions
4. Complete verification if prompted

---

## Step 2: Basic Configuration

Once the bot joins, it's ready with default settings!

### Default Prefix

The default command prefix is `!` (exclamation mark). Change it with:

```
!prefix <new prefix>
```

### Getting Help

```
!help              # View all commands
!help <command>    # Get help for specific command
!wiki Home         # Browse documentation
```

---

## Step 3: Set Up Moderation

### Enable Moderation Logging

Track all moderation actions:

```
!modlog enable #mod-logs
```

This logs bans, kicks, mutes, strikes, and message deletions.

### Configure Admin Levels

SkynetBot uses 4 admin levels (0-3):

| Level | Role | Capabilities |
|:------|:-----|:-------------|
| 0 | Member | Basic commands |
| 1 | Moderator | Kick, mute, strike |
| 2 | Admin | Tempban, softban |
| 3 | Server Admin | Full control |

Configure admins through the web dashboard or via roles.

---

## Step 4: Configure Features

### Points & Ranks

Enable the points system in the dashboard:

1. Go to Dashboard → Points & Ranks
2. Enable "SkynetPoints Collection"
3. Configure point values for messages, voice time, etc.
4. Set up rank thresholds and role rewards

### Starboard

Highlight popular messages:

```
!starboard channel #starboard
!starboard threshold 5
!starboard enable
```

### Suggestions

Let members submit suggestions:

```
!suggest channel #suggestions
!suggest enable
```

### Welcome Messages

Configure in Dashboard → Messages → Welcome:

- Set welcome channel
- Customize message with variables: `{user}`, `{server}`, `{membercount}`

---

## Step 5: Web Dashboard

Access full configuration through the web dashboard:

1. Visit the bot's website
2. Login with Discord
3. Select your server
4. Configure all features visually

### Dashboard Sections

| Section | Description |
|:--------|:------------|
| Overview | Quick stats and server health |
| Commands | Enable/disable commands, set permissions |
| Admins | Manage bot administrators |
| Moderation | Configure moderation settings |
| Points & Ranks | Set up points system |
| Messages | Automated welcome/leave messages |
| Extensions | Install and manage extensions |
| Logs | View bot activity logs |

---

## Common Commands

| Command | Description |
|:--------|:------------|
| `!help` | View all commands |
| `!ping` | Check bot status |
| `!info` | Server information |
| `!prefix` | Change command prefix |
| `!quiet` | Temporarily disable bot |
| `!stats` | Bot statistics |

---

## Economy System

SkynetBot includes a full economy system:

### Getting Started with Economy

```
!daily          # Claim daily reward
!balance        # Check your balance
!work           # Work for coins
!shop           # Browse the shop
```

### Economy Commands

| Command | Description |
|:--------|:------------|
| `!daily` | Claim daily coins (streak bonuses!) |
| `!balance` | View wallet and bank |
| `!deposit` | Put coins in bank (safe from theft) |
| `!withdraw` | Take coins from bank |
| `!give @user` | Send coins to someone |
| `!shop` | Browse and buy items |
| `!inventory` | View your items |
| `!gamble` | Gamble coins |
| `!slots` | Play slot machine |

---

## AI Assistant

Chat with the AI assistant:

```
!ai ask <message>      # Ask the AI anything
!ai stream <message>   # Get streaming response
!ai search <query>     # Web search with AI
!ai clear              # Clear conversation memory
```

### Template Variables

Use variables in your messages:

| Variable | Description |
|:---------|:------------|
| `{{user}}` | Your username |
| `{{server}}` | Server name |
| `{{date}}` | Current date |
| `{{time}}` | Current time |

---

## Extensions

Extend functionality with community extensions:

1. Browse the Extension Gallery (`/extensions/gallery`)
2. Review extension permissions
3. Install with one click
4. Configure in Dashboard → Extensions

### Popular Extensions

- **Blackjack** - Classic card game
- **Trivia** - Quiz competitions
- **Pet System** - Virtual pets
- **Wordle** - Daily word game
- **Mafia** - Social deduction game

---

## Premium Features

Unlock advanced features with premium subscriptions:

- Enhanced AI access (GPT-4, Claude)
- Increased rate limits
- Extended log retention
- Custom branding
- Priority support

Subscriptions are **per-server** - all members benefit!

Visit the Membership page to subscribe.

---

## Security Best Practices

### Recommended Bot Permissions

Grant only necessary permissions:

- ✅ Send Messages
- ✅ Embed Links
- ✅ Manage Messages (for moderation)
- ✅ Kick/Ban Members (for moderation)
- ❌ Administrator (not recommended)

### Admin Access

- Limit admin level 3 to trusted individuals
- Regularly audit the admin list
- Use role-based permissions when possible

---

## Next Steps

- [Commands Reference](/guide/commands) - Full command list
- [Configuration Guide](/guide/configuration) - Advanced setup
- [Extensions Guide](/guide/extensions) - Create extensions
- [Troubleshooting](/guide/troubleshooting) - Common issues
