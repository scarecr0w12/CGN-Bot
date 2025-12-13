---
layout: default
title: Commands
nav_order: 3
parent: Guide
description: "Complete command reference for SkynetBot"
permalink: /guide/commands/
---

# Command Reference

Complete list of all SkynetBot commands organized by category.

---

## Command Syntax

- `<required>` - Required argument
- `[optional]` - Optional argument
- `arg1 | arg2` - Choose one option
- `...` - Can repeat multiple times

---

## Moderation ⚒

Commands for server moderation. Require appropriate admin levels.

| Command | Description | Admin Level |
|:--------|:------------|:------------|
| `ban <user> [reason]` | Permanently ban a user | 3 |
| `unban <user>` | Remove a ban | 3 |
| `tempban <user> <duration> [reason]` | Temporary ban | 2 |
| `softban <user> [reason]` | Ban and unban (clears messages) | 2 |
| `kick <user> [reason]` | Kick user from server | 1 |
| `mute <user> [duration] [reason]` | Mute a user | 1 |
| `unmute <user>` | Unmute a user | 1 |
| `strike <user> [reason]` | Issue a strike/warning | 1 |
| `strikes <user>` | View user's strikes | 1 |
| `modlog [enable/disable] [#channel]` | Configure mod logging | 3 |
| `nuke [count]` | Bulk delete messages | 1 |
| `lock [#channel]` | Lock a channel | 1 |
| `unlock [#channel]` | Unlock a channel | 1 |
| `slowmode <seconds>` | Set channel slowmode | 1 |
| `role <user> <@role>` | Add/remove role from user | 1 |
| `nick <user> <name>` | Change user's nickname | 3 |

---

## Fun 🎪

Entertainment commands for server engagement.

| Command | Description |
|:--------|:------------|
| `8ball <question>` | Ask the magic 8-ball |
| `roll [dice notation]` | Roll dice (e.g., `2d6+3`) |
| `choose <option1> \| <option2> ...` | Random choice |
| `flip` | Flip a coin |
| `joke` | Random joke |
| `meme` | Random meme |
| `cat` | Random cat picture |
| `dog` | Random dog picture |
| `hug <user>` | Hug someone |
| `pat <user>` | Pat someone |
| `slap <user>` | Slap someone |
| `trivia [category]` | Start a trivia question |

---

## Utility 🔦

Helpful utility commands.

| Command | Description |
|:--------|:------------|
| `help [command]` | View help |
| `ping` | Check bot latency |
| `info` | Server information |
| `userinfo [user]` | User information |
| `avatar [user]` | Get user's avatar |
| `calc <expression>` | Calculator |
| `time [timezone]` | Current time |
| `remind <time> <message>` | Set a reminder |
| `poll <question> \| <option1> \| <option2>` | Create a poll |
| `translate <lang> <text>` | Translate text |
| `weather <location>` | Weather information |
| `afk [message]` | Set AFK status |

---

## Search & Media 🎬

Search and media commands.

| Command | Description |
|:--------|:------------|
| `google <query>` | Google search |
| `youtube <query>` | YouTube search |
| `image <query>` | Image search |
| `gif <query>` | GIF search |
| `wiki <query>` | Wikipedia search |
| `urban <term>` | Urban Dictionary |
| `anime <title>` | Anime information |
| `movie <title>` | Movie information |

---

## Stats & Points ⭐

Points system and statistics.

| Command | Description |
|:--------|:------------|
| `points [user]` | Check SkynetPoints |
| `ranks` | View rank leaderboard |
| `leaderboard` | Points leaderboard |
| `profile [user]` | User profile card |
| `stats` | Bot statistics |
| `uptime` | Bot uptime |

---

## Economy 💰

Virtual economy commands.

| Command | Description |
|:--------|:------------|
| `balance` | Check wallet and bank |
| `daily` | Claim daily reward |
| `work` | Work for coins |
| `deposit <amount>` | Deposit to bank |
| `withdraw <amount>` | Withdraw from bank |
| `give <user> <amount>` | Send coins |
| `shop` | Browse shop |
| `shop buy <item>` | Buy an item |
| `inventory` | View your items |
| `sell <item>` | Sell an item |
| `use <item>` | Use an item |
| `gamble <amount>` | Gamble coins |
| `slots <amount>` | Play slots |
| `rob <user>` | Attempt robbery |
| `quest` | View quests |
| `achievements` | View achievements |
| `trade <user>` | Trade with user |

---

## AI & Assistant 🤖

AI-powered commands.

| Command | Description |
|:--------|:------------|
| `ai ask <message>` | Chat with AI |
| `ai stream <message>` | Streaming AI response |
| `ai search <query>` | AI web search |
| `ai clear` | Clear conversation memory |
| `ai stats` | AI usage statistics (admin) |
| `imagine <prompt>` | Generate AI image (premium) |

---

## Server Configuration

Commands for server owners.

| Command | Description | Admin Level |
|:--------|:------------|:------------|
| `prefix <new prefix>` | Change command prefix | 3 |
| `quiet [start/stop]` | Disable bot in channel | 3 |
| `enable <command>` | Enable a command | 3 |
| `disable <command>` | Disable a command | 3 |
| `starboard [channel/threshold/enable]` | Configure starboard | 1 |
| `suggest [channel/enable]` | Configure suggestions | 3 |
| `room [create/settings]` | Temporary voice rooms | 0 |

---

## Wiki & Help

Documentation commands.

| Command | Description |
|:--------|:------------|
| `wiki [page]` | Browse wiki |
| `wiki search <query>` | Search wiki |
| `faq` | Frequently asked questions |
| `invite` | Bot invite link |
| `support` | Support server link |

---

## Extension Commands

Extensions add additional commands. View installed extensions with:

```
Dashboard → Extensions
```

Popular extension commands include:
- `blackjack` - Card game
- `chess` - Play chess
- `wordle` - Word guessing game
- `pet` - Virtual pet system
- `mafia` - Social deduction game

---

## Command Cooldowns

Most commands have cooldowns to prevent spam:

| Category | Default Cooldown |
|:---------|:-----------------|
| Fun | 3 seconds |
| Utility | 2 seconds |
| Economy | 5 seconds |
| AI | 10 seconds |
| Games | 5 seconds |

Premium servers may have reduced cooldowns.

---

## Admin Levels

Commands require specific admin levels:

| Level | Name | Access |
|:------|:-----|:-------|
| 0 | Member | Basic commands |
| 1 | Moderator | Kick, mute, strike |
| 2 | Admin | Tempban, softban |
| 3 | Server Admin | Full control |

---

## Next Steps

- [Configuration](configuration) - Configure commands
- [Extensions](extensions) - Add more commands
- [Troubleshooting](troubleshooting) - Command issues
