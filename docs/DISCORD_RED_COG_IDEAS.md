# Discord Red Cog Index - NEW Extension Ideas

> Compiled from https://index.discord.red/ (650 cogs reviewed)
> Date: December 14, 2025
> **Filtered to show only ideas NOT already implemented in CGN-Bot**

This document contains extension ideas from the Red Discord Bot ecosystem that are NOT yet implemented in CGN-Bot as either built-in commands or seeded extensions.

---

## Table of Contents

1. [Games - NEW](#games---new)
2. [Social & Community - NEW](#social--community---new)
3. [Voice & Audio - NEW](#voice--audio---new)
4. [Automation - NEW](#automation---new)
5. [Integration & APIs - NEW](#integration--apis---new)
6. [Image Manipulation - NEW](#image-manipulation---new)
7. [Seasonal & Events - NEW](#seasonal--events---new)
8. [Miscellaneous - NEW](#miscellaneous---new)

---

## Games - NEW

### Word Games

| Cog Name | Description | Priority | Notes |
|----------|-------------|----------|-------|
| **boggle** | Boggle word search game (find words in letter grid) | Medium | Timed word game, unique mechanic |
| **codenames** | Codenames board game adaptation | High | Team-based, great for parties |

### Trivia & Quiz

| Cog Name | Description | Priority | Notes |
|----------|-------------|----------|-------|
| **jeopardy** | Jeopardy-style game with categories | Medium | Answer-in-question format |
| **millionaire** | Who Wants to Be a Millionaire format | Medium | Lifelines, escalating difficulty |
| **twenty** | 20 Questions guessing game | Medium | AI-guessing style |

### Minigames

| Cog Name | Description | Priority | Notes |
|----------|-------------|----------|-------|
| **heist** | Cooperative heist game | Medium | Team-based economy game |
| **race** | Racing mini-game with betting | Low | Random outcome gambling |

### Gambling

| Cog Name | Description | Priority | Notes |
|----------|-------------|----------|-------|
| **wheel** | Wheel of Fortune spin game | Medium | Visual gambling, popular format |

---

## Social & Community - NEW

### Birthday System

| Cog Name | Description | Priority | Notes |
|----------|-------------|----------|-------|
| **birthday** | Birthday tracking and announcements | **High** | High community value |

**Suggested Implementation:**
```
/birthday set <month> <day> - Set your birthday
/birthday remove - Remove your birthday
/birthday upcoming - View upcoming birthdays
/birthday list - List all server birthdays
/birthday channel - Set announcement channel
/birthday role - Auto-assign birthday role
/birthday message - Custom birthday message
```

### Relationship System

| Cog Name | Description | Priority | Notes |
|----------|-------------|----------|-------|
| **marry** | Marriage/partner system | Medium | Social engagement |
| **ship** | Compatibility calculator | Medium | Fun social feature |
| **adopt** | Adopt users (family tree) | Low | Extended social bonds |

**Suggested Implementation:**
```
/marry propose <user> - Propose to another user
/marry accept - Accept proposal
/marry divorce - End marriage
/marry partner - View partner info
/ship <user1> <user2> - Calculate compatibility %
```

### Profiles

| Cog Name | Description | Priority | Notes |
|----------|-------------|----------|-------|
| **pronouns** | Pronoun role/display system | Medium | Inclusivity feature |
| **bio** | User biography system | Low | Social profiles |

---

## Voice & Audio - NEW

| Cog Name | Description | Priority | Notes |
|----------|-------------|----------|-------|
| **soundboard** | Sound effect buttons in voice | Medium | Fun voice feature |
| **tts** | Text-to-speech in voice channels | Medium | Accessibility/fun |
| **activities** | Discord voice activities launcher | Low | Watch Together, Poker Night, etc. |

**Suggested Implementation:**
```
/soundboard add <name> <url> - Add sound effect
/soundboard play <name> - Play sound in voice
/soundboard list - List available sounds
/soundboard remove <name> - Remove sound
/tts say <text> - Speak text in voice channel
/activity start <activity> - Launch Discord activity
```

---

## Automation - NEW

| Cog Name | Description | Priority | Notes |
|----------|-------------|----------|-------|
| **scheduler** | Cron-style action scheduling | Medium | Power user feature |
| **autopublish** | Auto-publish in announcement channels | Low | News channels |
| **autothread** | Auto-create threads on messages | Low | Organization |

**Suggested Implementation:**
```
/schedule create <time> <action> - Schedule action
/schedule list - View scheduled actions
/schedule delete <id> - Cancel scheduled action
/schedule repeat <cron> <action> - Recurring schedule
```

---

## Integration & APIs - NEW

### Gaming Platforms

| Cog Name | Description | Priority | Notes |
|----------|-------------|----------|-------|
| **xbox/xtools** | Xbox profile/clips/achievements | Low | Platform specific |
| **playstation** | PSN profile integration | Low | Platform specific |
| **apex** | Apex Legends stats | Medium | Popular BR game |
| **osrs** | Old School RuneScape lookup | Low | Niche audience |
| **wowtools** | World of Warcraft integration | Low | MMO community |
| **osu** | osu! stats and profiles | Low | Rhythm game community |

### Social Platforms

| Cog Name | Description | Priority | Notes |
|----------|-------------|----------|-------|
| **lastfm** | Last.fm scrobble integration | Medium | Music tracking |
| **tiktok** | TikTok video fetching | Low | Trending content |
| **instagram** | Instagram post embedding | Low | Social media |

### External Services

| Cog Name | Description | Priority | Notes |
|----------|-------------|----------|-------|
| **imdb** | IMDB movie/show search | Medium | Entertainment lookup |
| **shorturl** | URL shortening service | Low | Utility |

---

## Image Manipulation - NEW

| Cog Name | Description | Priority | Notes |
|----------|-------------|----------|-------|
| **pride** | Pride flag avatar overlays | Medium | Seasonal/social |
| **deepfry** | Deep fry meme effect | Medium | Meme culture |
| **jpeg** | JPEG artifact meme effect | Low | Meme effect |
| **blur** | Blur image effect | Low | Basic effect |
| **invert** | Invert colors effect | Low | Basic effect |
| **grayscale** | Grayscale conversion | Low | Basic effect |
| **tierlist** | Tier list image generator | Medium | User-generated rankings |
| **alignment** | D&D alignment chart generator | Low | Meme format |

**Suggested Implementation:**
```
/image pride <flag> [user] - Add pride flag overlay
/image deepfry [user] - Deep fry avatar
/image tierlist <items...> - Generate tier list
```

---

## Seasonal & Events - NEW

### Holiday Features

| Cog Name | Description | Priority | Notes |
|----------|-------------|----------|-------|
| **adventcalendar** | December advent calendar rewards | Low | December only |
| **halloween** | Halloween-themed features | Low | October only |
| **christmas** | Christmas-themed features | Low | December only |
| **newyear** | New Year countdown | Low | January only |
| **valentine** | Valentine's Day features | Low | February only |
| **easter** | Easter egg hunt game | Low | April only |

### Event Management

| Cog Name | Description | Priority | Notes |
|----------|-------------|----------|-------|
| **tournament** | Tournament bracket management | Medium | Competitive events |
| **signup** | Event signup/RSVP system | Medium | Event organization |

**Suggested Implementation:**
```
/tournament create <name> <type> - Create bracket (single/double elim)
/tournament join <id> - Join tournament
/tournament bracket <id> - View bracket image
/tournament report <id> <winner> - Report match result
/tournament start <id> - Start tournament
/event create <name> <time> - Create event
/event signup <id> - Sign up for event
/event list - View upcoming events
```

---

## Miscellaneous - NEW

### Leveling Enhancements

| Cog Name | Description | Priority | Notes |
|----------|-------------|----------|-------|
| **prestige** | Prestige/rebirth system for leveling | Medium | Endgame content |
| **mee6import** | Import levels from MEE6 | Low | Migration tool |

### Role Enhancements

| Cog Name | Description | Priority | Notes |
|----------|-------------|----------|-------|
| **boostroles** | Custom color roles for boosters | Medium | Nitro perks |
| **timeroles** | Roles after X time in server | Medium | Engagement reward |
| **stickyroles** | Persistent roles on rejoin | Low | Utility |

### Reputation

| Cog Name | Description | Priority | Notes |
|----------|-------------|----------|-------|
| **rep** | Reputation/karma system | Medium | Social standing |
| **thanks** | Thank you tracking | Low | Positive reinforcement |

### Predictions

| Cog Name | Description | Priority | Notes |
|----------|-------------|----------|-------|
| **predictions** | Event prediction betting | Medium | Community engagement |
| **bet** | User-to-user betting | Low | Social gambling |

---

## Implementation Priority Summary

### 🔴 High Priority (Recommended Next)

1. **Birthday System** - High community value, frequently requested
2. **Codenames** - Engaging party game, team-based
3. **Tournament Brackets** - Competitive event management

### 🟡 Medium Priority (Good Additions)

4. **Marriage/Relationship System** - Social engagement
5. **Soundboard** - Voice channel fun
6. **Wheel of Fortune** - Visual gambling game
7. **Tier List Generator** - User content creation
8. **Prestige System** - Leveling endgame
9. **Last.fm Integration** - Music community feature
10. **Jeopardy/Millionaire** - Quiz game variants

### 🟢 Low Priority (Niche)

- Platform-specific game integrations (Xbox, PSN, osu!)
- Seasonal holiday features
- Basic image effects (blur, invert, grayscale)
- MEE6 import tool

---

## Quick Reference: What's Already Implemented

**Built-in Commands:** AFK, leveling, economy (points/coins), starboard, welcome/goodbye, autoroles, moderation suite, custom commands, logging, giveaways, polls, music, AI chat, tickets, analytics, developer tools, voice management, role panels, emoji management, invites, onboarding, backup, verification, antinuke

**Seeded Extensions:** Word games (wordle, hangman, scramble, anagram, wordchain, ghost, acronym, aki), card games (blackjack, poker, uno, war, highlow), board games (chess, checkers, tictactoe, connect4, minesweeper, battleship), trivia variants, RPG games (adventure, dungeon, duel, hunt, pet), casino (slots, roulette, crash), image effects (ship, wanted, triggered, pixel, wasted, etc.), text manipulation (zalgo, mock, owo, etc.), anime/gaming lookups (anime, manga, valorant, lol, fortnite, minecraft, steam)

---

*Last Updated: December 14, 2025*
*Total NEW Ideas: ~50 features across 8 categories*
