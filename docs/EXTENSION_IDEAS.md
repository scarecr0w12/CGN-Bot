# Extension Ideas - Comprehensive List

This document contains all researched extension ideas for the Discord bot.
Organized by category with command names and descriptions.

## Legend

- ✅ SEEDED - Extension exists and is seeded in the database
- ❌ BUILT-IN - Duplicates a built-in command (do not implement as extension)
- 🔄 HYBRID - Planned as mix of built-in and extension
- 🚧 PLANNED - To be built into core system
- 📦 EXTENSION - Planned as an extension
- 🛑 HOLDING - Feature in holding pattern

## 🔒 TIER GATING POLICY

All extensions and high-resource built-in features must check Server Tiers.

### Tier 1 (Free)

- Basic Economy (points, ranks, daily, work)
- Basic Utilities (reminders, calculator, polls)
- Information & Stats
- Social & Fun commands
- Basic Games (party games, simple card/board games)
- Text Manipulation

### Tier 2 (Premium)

- Advanced Analytics (heatmaps, exports, engagement metrics)
- Music & Audio (resource-intensive streaming)
- AI Features (image generation, advanced chat)
- High-res Image Generation
- Server Ticket Panel Extension
- Multi-server features (rolesync, crosspost, broadcast)
- Backup & Restore features
- Advanced Moderation (antiraid, antinuke, alt detection)
- Gaming API Integrations (Valorant, LoL, Fortnite, etc.)
- Log Export & Advanced Audit
- Developer Tools (secure code execution)

### Tier 3 (Enterprise)

- Custom Bots / Whitelabeling
- Priority Support
- Dedicated Resources
- Custom Branding

---

## 💰 ECONOMY & PROGRESSION

*Core system uses built-in "SkyNet Points" and coin-based economy. Features are Built-in unless listed as Exceptions.*

### Built-in Economy (Coins + SkyNet Points)

| Command | Description | Status |
|---------|-------------|--------|
| `points` | Check SkyNet points balance | ❌ BUILT-IN (`points.js`) |
| `ranks` | Check rank/level | ❌ BUILT-IN (`ranks.js`) |
| `balance` | Check wallet/bank balance | ❌ BUILT-IN (`balance.js`) |
| `leaderboard` | Economy leaderboard | ❌ BUILT-IN (`leaderboard.js`) |
| `daily` | Claim daily rewards with streaks | ❌ BUILT-IN (`daily.js`) |
| `work` | Work a job for coins | ❌ BUILT-IN (`work.js`) |
| `shop` | Buy items/roles | ❌ BUILT-IN (`shop.js`) |
| `inventory` | View items | ❌ BUILT-IN (`inventory.js`) |
| `giveaway` | Manage giveaways | ❌ BUILT-IN (`giveaway.js`) |
| `lottery` | Lottery system | ❌ BUILT-IN (`lottery.js`) |
| `rob` | Attempt to rob others | ❌ BUILT-IN (`rob.js`) |
| `deposit` | Deposit to bank | ❌ BUILT-IN (`deposit.js`) |
| `withdraw` | Withdraw from bank | ❌ BUILT-IN (`withdraw.js`) |
| `give` | Send coins to others | ❌ BUILT-IN (`give.js`) |
| `gamble` | Gamble coins | ❌ BUILT-IN (`gamble.js`) |
| `slots` | Slot machine game | ❌ BUILT-IN (`slots.js`) |
| `sell` | Sell items back | ❌ BUILT-IN (`sell.js`) |
| `use` | Use consumable items | ❌ BUILT-IN (`use.js`) |
| `gift` | Gift items to others | ❌ BUILT-IN (`gift.js`) |
| `quest` | Daily/weekly tasks | ❌ BUILT-IN (`quest.js`) |
| `achievements` | Unlockable achievements | ❌ BUILT-IN (`achievements.js`) |
| `badges` | Collectible badges | ❌ BUILT-IN (`badges.js`) |
| `streaks` | Track activity streaks | ❌ BUILT-IN (`streaks.js`) |
| `craft` | Combine items into new items | ❌ BUILT-IN (`craft.js`) |
| `upgrade` | Upgrade economy stats | ❌ BUILT-IN (`upgrade.js`) |
| `trade` | Trade items with others | ❌ BUILT-IN (`trade.js`) |

### Economy Extensions (Exceptions)

| Command | Description | Status |
|---------|-------------|--------|
| `gacha` | Lootbox/character collection | ✅ SEEDED (Batch 4) |
| `stocks` | Virtual stock market | ✅ SEEDED (Batch 6) |
| `auction` | Auction house | ✅ SEEDED (Batch 2) |
| `crime` | High risk/reward actions | ✅ SEEDED (Batch 1) |
| `season` | Seasonal progression resets | ✅ SEEDED (Batch 8) |

---

## 🛠️ UTILITIES

*All Utilities should be Built-in.*

### Time & Reminders

| Command | Description | Status |
|---------|-------------|--------|
| `remind` | Personal reminders | ❌ BUILT-IN (`remindme.js`) |
| `time` | Timezone info | ❌ BUILT-IN (`time.js`) |
| `timer` | Simple timer | ✅ SEEDED (Move to Built-in) |
| `stopwatch` | Stopwatch functionality | ❌ BUILT-IN (`stopwatch.js`) |
| `countdown` | Event countdowns | ❌ BUILT-IN (`countdown.js`) |
| `pomodoro` | Study/focus timer | ❌ BUILT-IN (`pomodoro.js`) |

### Calculators & Converters

| Command | Description | Status |
|---------|-------------|--------|
| `calc` | Calculator | ❌ BUILT-IN (`calc.js`) |
| `convert` | Unit converter | ❌ BUILT-IN (`convert.js`) |
| `color` | Color code converter | ✅ SEEDED (Move to Built-in) |
| `base` | Number base converter | ❌ BUILT-IN (`base.js`) |

### Generators

| Command | Description | Status |
|---------|-------------|--------|
| `roll` | Dice notation roller | ❌ BUILT-IN (`roll.js`) |
| `choose` | Random picker | ❌ BUILT-IN (`choose.js`) |
| `password` | Generate secure passwords | ❌ BUILT-IN (`password.js`) |
| `uuid` | Generate UUIDs | ❌ BUILT-IN (`uuid.js`) |
| `randomnum` | Generate random numbers | ❌ BUILT-IN (`randomnum.js`) |
| `shuffle` | Shuffle a list | ❌ BUILT-IN (`shuffle.js`) |
| `teampicker` | Random team assignment | ❌ BUILT-IN (`teampicker.js`) |

### Lookup & Info

| Command | Description | Status |
|---------|-------------|--------|
| `weather` | Weather info | ❌ BUILT-IN (`weather.js`) |
| `urban` | Dictionary lookup | ❌ BUILT-IN (`urban.js`) |
| `wiki` | Wikipedia search | ❌ BUILT-IN (`wiki.js`) |
| `google` | Google search | ❌ BUILT-IN (`google.js`) |
| `translate` | Text translation | ❌ BUILT-IN (`translate.js`) |
| `crypto` | Cryptocurrency prices | ❌ BUILT-IN (`crypto.js`) |
| `stock` | Stock market info | ❌ BUILT-IN (`stock.js`) |
| `lyrics` | Song lyrics lookup | ❌ BUILT-IN (`lyrics.js`) |

### Productivity

| Command | Description | Status |
|---------|-------------|--------|
| `poll` | Create polls | ❌ BUILT-IN (`poll.js`) |
| `todo` | Todo lists | ❌ BUILT-IN (`list.js`) |
| `notes` | Personal notes | ❌ BUILT-IN (`notes.js`) |
| `afk` | Set AFK status | ❌ BUILT-IN (`afk.js`) |
| `snooze` | Temporary DND mode | ❌ BUILT-IN (`snooze.js`) |

---

## 📊 INFORMATION & STATS

*All Info & Stats should be Built-in.*

### User Stats

| Command | Description | Status |
|---------|-------------|--------|
| `userstats` | User profile/stats | ❌ BUILT-IN (`userinfo.js`) |
| `avatar` | User avatar | ❌ BUILT-IN (`avatar.js`) |
| `voicetime` | Voice channel time tracking | ❌ BUILT-IN (`voicetime.js`) |

### Server Info

| Command | Description | Status |
|---------|-------------|--------|
| `serverstats` | Server information | ❌ BUILT-IN (`info.js`) |
| `roleinfo` | Role details | ❌ BUILT-IN (`roleinfo.js`) |
| `channelinfo` | Channel details | ❌ BUILT-IN (`channelinfo.js`) |
| `emojilist` | Server emoji list | ❌ BUILT-IN (`emotes.js`) |
| `boosters` | Server boost info | ❌ BUILT-IN (`boosters.js`) |

### Bot Info

| Command | Description | Status |
|---------|-------------|--------|
| `stats` | Bot statistics | ❌ BUILT-IN (`stats.js`) |
| `ping` | Latency check | ❌ BUILT-IN (`ping.js`) |

---

## 🎭 SOCIAL & FUN

*All Social & Fun commands should be Built-in.*

### Social Features

| Command | Description | Status |
|---------|-------------|--------|
| `hug` | Hug user | ❌ BUILT-IN (`hug.js`) |
| `pat` | Pat user | ❌ BUILT-IN (`pat.js`) |
| `slap` | Slap user | ❌ BUILT-IN (`slap.js`) |
| `poke` | Poke user | ❌ BUILT-IN (`poke.js`) |
| `cuddle` | Cuddle user | ❌ BUILT-IN (`cuddle.js`) |
| `kiss` | Kiss user | ❌ BUILT-IN (`kiss.js`) |
| `highfive` | High five user | ❌ BUILT-IN (`highfive.js`) |

### Fun Commands

| Command | Description | Status |
|---------|-------------|--------|
| `8ball` | Magic 8-Ball | ❌ BUILT-IN (`8ball.js`) |
| `roll` | Dice roll | ❌ BUILT-IN (`roll.js`) |
| `choose` | Pick option | ❌ BUILT-IN (`choose.js`) |
| `joke` | Random joke | ❌ BUILT-IN (`joke.js`) |
| `meme` | Random meme | ❌ BUILT-IN (`meme.js`) |
| `cat` | Cat pictures | ❌ BUILT-IN (`cat.js`) |
| `dog` | Dog pictures | ❌ BUILT-IN (`dog.js`) |
| `rate` | Rate something | ❌ BUILT-IN (`rate.js`) |
| `lovecalc` | Love compatibility | ❌ BUILT-IN (`lovecalc.js`) |
| `compliment` | Give compliment | ❌ BUILT-IN (`compliment.js`) |
| `insult` | Generate insult | ❌ BUILT-IN (`insult.js`) |
| `fact` | Random fact | ❌ BUILT-IN (`fact.js`) |

---

## 🎮 GAMING (ALL EXTENSIONS)

*All Gaming features must be Extensions.*

### Card Games

| Command | Description | Status |
|---------|-------------|--------|
| `blackjack` | 21 Card Game | ✅ SEEDED (Batch 1) |
| `poker` | Texas Hold'em | ✅ SEEDED (Batch 4) |
| `uno` | Uno Card Game | ✅ SEEDED (Batch 3) |
| `war` | Simple War card game | ✅ SEEDED |
| `highlow` | Guess if next card higher/lower | ✅ SEEDED (Batch 3) |

### Board Games

| Command | Description | Status |
|---------|-------------|--------|
| `chess` | Chess | ✅ SEEDED (Batch 3) |
| `checkers` | Checkers | ✅ SEEDED (Batch 5) |
| `tictactoe` | Tic-Tac-Toe | ✅ SEEDED (Batch 5) |
| `connect4` | Connect 4 | ✅ SEEDED (Batch 1) |
| `minesweeper` | Minesweeper | ✅ SEEDED (Batch 2) |
| `battleship` | Battleship | ✅ SEEDED (Batch 2) |

### Word Games

| Command | Description | Status |
|---------|-------------|--------|
| `wordle` | Daily word guess | ✅ SEEDED (Batch 2) |
| `hangman` | Hangman | ✅ SEEDED (Batch 2) |
| `scramble` | Unscramble words | ✅ SEEDED (Batch 1) |
| `wordchain` | Each word starts with last letter | ✅ SEEDED (Batch 7) |
| `anagram` | Find words from letters | ✅ SEEDED (Batch 3) |
| `ghost` | Add letters without completing words | ✅ SEEDED (Batch 9) |
| `acronym` | Create funny acronyms | ✅ SEEDED (Batch 9) |
| `reversetype` | Type words backwards | ✅ SEEDED (Batch 9) |
| `aki` | Akinator | ✅ SEEDED (Batch 1) |

### Trivia & Quiz

| Command | Description | Status |
|---------|-------------|--------|
| `trivia` | Trivia Quiz | ❌ BUILT-IN (`trivia.js`) |
| `musicquiz` | Lyrics Guessing | ✅ SEEDED (Batch 5) |
| `flagquiz` | Flag Identification | ✅ SEEDED (Batch 5) |
| `moviequiz` | Guess movies | ✅ SEEDED (Batch 9) |
| `emojiquiz` | Guess words from emojis | ✅ SEEDED (Batch 9) |
| `quotequiz` | Identify famous quotes | ✅ SEEDED (Batch 9) |

### Reaction Games

| Command | Description | Status |
|---------|-------------|--------|
| `reaction` | Test reaction time | ✅ SEEDED (Batch 1) |
| `typerace` | Speed typing competition | ✅ SEEDED (Batch 1) |
| `emojisimon` | Repeat emoji sequences | ✅ SEEDED (Batch 9) |
| `buttonrush` | Click button before it disappears | ✅ SEEDED (Batch 9) |
| `dodge` | React with correct emoji | ✅ SEEDED (Batch 17) |
| `mathsnap` | React to true equations | ✅ SEEDED (Batch 9) |

### Social Deduction

| Command | Description | Status |
|---------|-------------|--------|
| `mafia` | Social deduction | ✅ SEEDED (Batch 2) |
| `spyfall` | Find the spy | ✅ SEEDED (Batch 4) |
| `traitor` | Vote out traitor | ✅ SEEDED (Batch 5) |
| `liar` | Detect who has different info | ✅ SEEDED (Batch 9) |
| `secretroles` | Hidden role games | ✅ SEEDED (Batch 17) |
| `alibi` | Murder mystery | ✅ SEEDED (Batch 9) |

### Puzzle Games

| Command | Description | Status |
|---------|-------------|--------|
| `2048` | Number puzzle | ✅ SEEDED (Batch 2) |
| `escaperoom` | Text adventure puzzle | ✅ SEEDED (Batch 4) |
| `riddle` | Solve riddles | ✅ SEEDED (Batch 1) |
| `mastermind` | Crack the color code | ✅ SEEDED (Batch 3) |
| `pattern` | Complete sequences | ✅ SEEDED (Batch 4) |
| `cipher` | Decode encrypted messages | ✅ SEEDED (Batch 4) |
| `maze` | Navigate text mazes | ✅ SEEDED (Batch 5) |
| `nonogram` | Picross puzzles | ✅ SEEDED (Batch 9) |
| `logicgrid` | Logic deduction puzzles | ✅ SEEDED (Batch 9) |

### Party Games

| Command | Description | Status |
|---------|-------------|--------|
| `truthordare` | Truth or Dare | ✅ SEEDED (Batch 1) |
| `wouldyourather` | Would You Rather | ✅ SEEDED (Batch 1) |
| `neverhaveiever` | Never Have I Ever | ✅ SEEDED (Batch 1) |
| `thisorthat` | This or That choices | ✅ SEEDED (Batch 1) |
| `icebreaker` | Conversation starters | ✅ SEEDED |
| `hottake` | Debate topics | ✅ SEEDED (Batch 5) |
| `debateclash` | Assign pro/con for debates | ✅ SEEDED (Batch 9) |
| `captionbattle` | Caption contest | ✅ SEEDED (Batch 5) |
| `story` | Chain story | ✅ SEEDED (Batch 3) |

### RPG & Adventure

| Command | Description | Status |
|---------|-------------|--------|
| `duel` | PvP Combat | ✅ SEEDED (Batch 3) |
| `bossraid` | Server Boss | ✅ SEEDED (Batch 17) |
| `adventure` | Text Adventure | ✅ SEEDED (Batch 2) |
| `dungeon` | Dungeon Crawler | ✅ SEEDED (Batch 2) |
| `towerclimb` | Tower Climbing | ✅ SEEDED (Batch 4) |
| `hunt` | Hunting mini-game | ✅ SEEDED (Batch 1) |
| `pet` | Virtual pet | ✅ SEEDED (Batch 1) |
| `flashcards` | Study cards | ✅ SEEDED (Batch 3) |

### Casino & Gambling

| Command | Description | Status |
|---------|-------------|--------|
| `slots` | Slot machine | ✅ SEEDED (Batch 1) |
| `roulette` | Roulette | ✅ SEEDED (Batch 2) |
| `crash` | Crash Game | ✅ SEEDED (Batch 2) |
| `dicebet` | Dice rolling with bets | ✅ SEEDED (Batch 17) |
| `fish` | Go fishing | ✅ SEEDED (Batch 1) |
| `rps` | Rock Paper Scissors | ✅ SEEDED (Batch 1) |

---

## 🎨 IMAGE & MEDIA (EXTENSIONS - MIXED TIERS)

*Unless already built-in, these are Extensions.*
*Basic image manipulation = Tier 1. High-res/AI generation = **Tier 2**.*

### Search

| Command | Description | Status |
|---------|-------------|--------|
| `image` | Google Image Search | ❌ BUILT-IN (`image.js`) |
| `gif` | Giphy Search | ❌ BUILT-IN (`gif.js`) |

### Avatar Manipulation

| Command | Description | Status |
|---------|-------------|--------|
| `ship` | Ship users image | ✅ SEEDED (Batch 10) |
| `wanted` | Wanted poster | ✅ SEEDED (Batch 10) |
| `triggered` | TRIGGERED effect | ✅ SEEDED (Batch 10) |
| `pixel` | Pixelate image | ✅ SEEDED (Batch 10) |
| `glitch` | Glitch effect | ✅ SEEDED (Batch 18) |
| `petpet` | Petting GIF | ✅ SEEDED (Batch 18) |
| `drip` | Add drip/swag | ✅ SEEDED (Batch 18) |
| `jail` | Put behind bars | ✅ SEEDED (Batch 10) |
| `rip` | Gravestone image | ✅ SEEDED (Batch 10) |
| `trash` | Trash meme | ✅ SEEDED (Batch 18) |
| `beautiful` | "Beautiful" meme | ✅ SEEDED (Batch 18) |
| `facepalm` | Facepalm overlay | ✅ SEEDED (Batch 18) |
| `wasted` | GTA Wasted effect | ✅ SEEDED (Batch 10) |

### Meme Generation

| Command | Description | Status |
|---------|-------------|--------|
| `caption` | Meme captioner | ✅ SEEDED (Batch 5) |
| `drake` | Drake meme template | ✅ SEEDED (Batch 10) |
| `changemymind` | Change My Mind meme | ✅ SEEDED (Batch 18) |
| `distracted` | Distracted boyfriend meme | ✅ SEEDED (Batch 18) |
| `achievement` | Minecraft achievement | ✅ SEEDED (Batch 10) |

### Creative

| Command | Description | Status |
|---------|-------------|--------|
| `ascii` | Text to ASCII | ✅ SEEDED (Batch 10) |
| `qrcode` | Text to QR | ✅ SEEDED (Batch 10) |
| `banner` | Generate text banners | ✅ SEEDED (Batch 10) |
| `quote` | Create quote images | ✅ SEEDED (Batch 10) |
| `polaroid` | Polaroid photo effect | ✅ SEEDED (Batch 18) |
| `album` | Album cover generator | ✅ SEEDED (Batch 18) |

---

## 📝 TEXT MANIPULATION (EXTENSIONS)

*Text manipulation commands implemented as extensions.*

| Command | Description | Status |
|---------|-------------|--------|
| `zalgo` | Glitchy Zalgo text | ✅ SEEDED (Batch 11) |
| `mock` | mOcKiNg TeXt | ✅ SEEDED (Batch 11) |
| `owo` | OwO speak conversion | ✅ SEEDED (Batch 11) |
| `fancy` | Fancy Unicode fonts | ✅ SEEDED (Batch 11) |
| `reverse` | Reverse text | ✅ SEEDED (Batch 11) |
| `clap` | Add 👏 between words | ✅ SEEDED (Batch 11) |
| `spoiler` | Spoilerify text | ✅ SEEDED (Batch 11) |
| `tiny` | Tiny text conversion | ✅ SEEDED (Batch 11) |
| `vaporwave` | ｖａｐｏｒｗａｖｅ text | ✅ SEEDED (Batch 11) |
| `emojify` | Regional indicator letters | ✅ SEEDED (Batch 11) |
| `uwuify` | Extra cute UwU speak | ✅ SEEDED (Batch 11) |
| `leet` | 1337 speak conversion | ✅ SEEDED (Batch 11) |
| `scrambletext` | Scramble middle of words | ✅ SEEDED (Batch 11) |
| `flip` | Upside down text | ✅ SEEDED (Batch 11) |

---

## 🎧 MUSIC & AUDIO (✅ IMPLEMENTED - TIER 2)

**Tier-gated:** Requires Tier 2 (Premium) subscription due to streaming resources.

**Architecture:** Native integration into `Internals/Audio` with `AudioManager` class.
**Dependencies:** `@discordjs/voice`, `ffmpeg-static`, `libsodium-wrappers`, `play-dl`.

**Core Files:**

- `Internals/Audio/AudioManager.js` - Voice connection and playback management
- `Internals/Audio/MusicQueue.js` - Queue management with loop, shuffle, volume
- `Internals/Audio/Track.js` - Track data model

| Command | Description | Status |
|---------|-------------|--------|
| `play` | Play music from YouTube/URL | ✅ BUILT-IN (`play.js`) |
| `skip` | Skip current song | ✅ BUILT-IN (`skip.js`) |
| `queue` | View music queue | ✅ BUILT-IN (`queue.js`) |
| `lyrics` | Get song lyrics | ✅ BUILT-IN (`lyrics.js`) |
| `dj` | DJ Controls (pause, resume, stop, volume, loop, shuffle) | ✅ BUILT-IN (`dj.js`) |
| `filters` | Audio filters (bassboost, nightcore, vaporwave, 8d) | ✅ BUILT-IN (`filters.js`) |

**Features:**

- YouTube video and playlist support via `play-dl`
- Per-guild audio players with auto-disconnect
- Volume control (0-200%)
- Loop modes (track, queue, off)
- Queue pagination and shuffle

---

## 🎫 TICKETS & SUPPORT (✅ IMPLEMENTED)

**Architecture:**

1. **Global System (Built-in):** Users DM bot → Opens ticket with Bot Admins/Maintainers.
   - **Web Interface:** Maintainer Console (`Web/views/pages/maintainer-tickets.ejs`) for managing global tickets.
   - Ticket queue, assignment, status tracking, transcript export.
   - **Database:** `Tickets`, `TicketMessages` models.

2. **Server System (Built-in - Tier 2):** Per-server ticket system for server owners.
   - **Tier-gated:** Requires Tier 2 (Premium) subscription.
   - **Dashboard Integration:** Ticket settings and management in server dashboard.
   - Panel config, category setup, support roles, transcript channel.
   - **Database:** `ServerTickets`, `ServerTicketMessages` models.
   - **Module:** `Modules/ServerTicketManager.js`

| Command | Description | Status |
|---------|-------------|--------|
| `ticket` | Create/list server tickets | ✅ BUILT-IN (`ticket.js`) |
| `ticketpanel` | Create server support panel | ✅ BUILT-IN (`ticketpanel.js`) |
| `ticketclose` | Close and archive ticket | ✅ BUILT-IN (`ticketclose.js`) |
| `ticketadd` | Add user to ticket | ✅ BUILT-IN (`ticketadd.js`) |
| `ticketremove` | Remove user from ticket | ✅ BUILT-IN (`ticketremove.js`) |

**Dashboard Pages:**

- `admin-tickets.ejs` - Ticket settings and category management
- `admin-tickets-list.ejs` - View server tickets
- `admin-ticket-view.ejs` - Individual ticket view
- `maintainer-tickets.ejs` - Global ticket management
- `maintainer-ticket-view.ejs` - Global ticket details

---

## 🛡️ ADVANCED MODERATION (MIXED TIERS)

**Architecture:** Integrated into `Modules/Moderation` with event handlers in `Internals/Events/guildMemberAdd/`.
*Basic moderation = Tier 1. Antiraid/Altcheck = **Tier 2**.*

| Command | Description | Status |
|---------|-------------|--------|
| `automod` | Auto-moderation rules | ✅ BUILT-IN (`automod.js`) |
| `filter` | Word filtering | ✅ BUILT-IN (`filter.js`) |
| `strike` | Strike management | ✅ ENHANCED (`strike.js`) |
| `modlog` | Moderation logging | ✅ ENHANCED (`modlog.js`) |
| `antispam` | Anti-spam system | ✅ BUILT-IN (`antispam.js`) |
| `antiraid` | Anti-raid system | ✅ BUILT-IN (`antiraid.js`) - Tier 2 |
| `altcheck` | Alt account check | ✅ BUILT-IN (`altcheck.js`) - Tier 2 |

**Implementation Details:**

- **automod**: Unified interface for enabling/disabling moderation and configuring spam/mention filters
- **filter**: Add/remove/import filtered words with preset lists (profanity, slurs, spam keywords)
- **antispam**: Configure spam detection sensitivity, actions, ignored channels, violator roles
- **antiraid**: Tier 2 - Join velocity detection, lockdown mode, min account age, whitelist roles
- **altcheck**: Tier 2 - Account age detection, quarantine roles, manual user checks
- **strike**: Full strike management - give, remove, clear, view with admin attribution
- **modlog**: Enhanced logging - test entries, event filtering, history viewing
- **Event Handler**: `Skynet.RaidDetection.js` monitors joins for raid patterns and alt accounts

**Schema Updates:**

- `serverConfigSchema.js`: Added `antiraid` and `altcheck` filter configurations
- `serverModlogSchema.js`: Added `events` filtering and new entry types (Strike Removed, Raid Detected, etc.)

---

## 📺 ANIME & GAMING INTEGRATIONS (TIER 2 EXTENSIONS)

*Gaming integrations require external APIs - Extensions. **Tier-gated:** Requires Tier 2 (Premium) due to API costs.*

### Anime Lookup

| Command | Description | Status |
|---------|-------------|--------|
| `anime` | Search anime info | ✅ SEEDED (Batch 13 - Jikan API) |
| `manga` | Search manga info | ✅ SEEDED (Batch 13 - Jikan API) |
| `character` | Search anime characters | ✅ SEEDED (Batch 13 - Jikan API) |
| `animequote` | Random anime quote | ✅ SEEDED (Batch 12) |
| `randomanime` | Random anime recommendation | ✅ SEEDED (Batch 14 - Jikan API) |
| `animetop` | View top rated anime | ✅ SEEDED (Batch 14 - Jikan API) |
| `animeseason` | View seasonal anime | ✅ SEEDED (Batch 14 - Jikan API) |
| `animeschedule` | View airing schedule | ✅ SEEDED (Batch 16 - Jikan API) |
| `mangatop` | View top rated manga | ✅ SEEDED (Batch 16 - Jikan API) |
| `animeguess` | Guess anime from screenshot | ✅ SEEDED (Batch 19) |
| `waifuroll` | Roll random waifu/husbando | ✅ SEEDED (Batch 12) |
| `waifuclaim` | Claim rolled characters | ✅ SEEDED (Batch 12) |
| `waifuprofile` | View waifu collection | ✅ SEEDED (Batch 12) |

### Minecraft

| Command | Description | Status |
|---------|-------------|--------|
| `mcstatus` | Check server status | ✅ SEEDED (Batch 14 - mcsrvstat.us API) |
| `mcskin` | Display player skin | ✅ SEEDED (Batch 13 - Mojang API) |
| `mcuuid` | Get player UUID | ✅ SEEDED (Batch 13 - Mojang API) |
| `mcnamehistory` | Player name history | ✅ SEEDED (Batch 19) |

### Valorant

| Command | Description | Status |
|---------|-------------|--------|
| `valorantstats` | Player stats and rank | ✅ SEEDED (Batch 15 - Henrik API) |
| `valorantmatch` | Last match details | ✅ SEEDED (Batch 15 - Henrik API) |
| `valorantagent` | Agent information | ✅ SEEDED (Batch 15 - Henrik API) |

### League of Legends

| Command | Description | Status |
|---------|-------------|--------|
| `lolchampion` | Champion information | ✅ SEEDED (Batch 16 - Data Dragon) |
| `lolitem` | Item information | ✅ SEEDED (Batch 16 - Data Dragon) |
| `lolrotation` | Free champion rotation | ✅ SEEDED (Batch 16 - Data Dragon) |
| `lolrandom` | Random champion picker | ✅ SEEDED (Batch 16 - Data Dragon) |
| `lolsummoner` | Summoner profile | ✅ SEEDED (Batch 19 - Links to stat sites) |
| `lollive` | Live game lookup | ✅ SEEDED (Batch 19 - Links to stat sites) |
| `lolbuild` | Champion builds | ✅ SEEDED (Batch 19) |
| `lolmastery` | Champion mastery | ✅ SEEDED (Batch 19 - Links to stat sites) |

### Fortnite

| Command | Description | Status |
|---------|-------------|--------|
| `fortnitestats` | Player statistics | ✅ SEEDED (Batch 15 - Fortnite API) |
| `fortniteshop` | Daily item shop | ✅ SEEDED (Batch 15 - Fortnite API) |
| `fortnitemap` | View current map | ✅ SEEDED (Batch 15 - Fortnite API) |
| `fortnitetrack` | Track player stats | ✅ SEEDED (Batch 19) |

### General Gaming

| Command | Description | Status |
|---------|-------------|--------|
| `steamprofile` | Steam profile info | ✅ SEEDED (Batch 14 - Steam API) |
| `steamgame` | Game information | ✅ SEEDED (Batch 14 - Steam API) |
| `lfg` | Looking for group | ✅ SEEDED (Batch 12) |
| `gamestats` | Generic game stats | ✅ SEEDED (Batch 19) |

---

## 🤖 AI FEATURES (✅ IMPLEMENTED - TIER 2 PREMIUM)

*AI features integrate with existing AI module. **Tier-gated:** Requires Tier 2 (Premium) due to API costs.*

**Architecture:** Multi-provider AI system in `Modules/AI/` with OpenAI, Anthropic, and Groq support.
**Image Generation:** DALL-E 2/3 and GPT-Image-1 support via OpenAI API.

| Command | Description | Status |
|---------|-------------|--------|
| `aichat` | Chat with AI | ✅ BUILT-IN (`ai.js`) |
| `aithread` | Persistent AI conversation threads | ✅ BUILT-IN (`aithread.js`) |
| `aisummarize` | Summarize text/messages | ✅ BUILT-IN (`aisummarize.js`) |
| `airewrite` | Rewrite in different tone | ✅ BUILT-IN (`airewrite.js`) |
| `aiexplain` | Explain code/concepts | ✅ BUILT-IN (`aiexplain.js`) |
| `aiimage` | Generate image from prompt | ✅ BUILT-IN (`aiimage.js`) |
| `aiavatar` | Stylized avatar generation | ✅ BUILT-IN (`aiavatar.js`) |
| `aivariations` | Image variations | ✅ BUILT-IN (`aivariations.js`) |

**Features:**

- Multi-provider chat (OpenAI, Anthropic, Groq)
- Conversation memory with vector memory support
- Rate limiting and usage tracking
- Image generation with DALL-E 3/2
- Multiple avatar styles (anime, realistic, cartoon, pixel, fantasy, chibi, cyberpunk, watercolor)
- Text summarization (brief, detailed, bullets)
- Tone rewriting (professional, casual, formal, simple, academic, humorous, persuasive, concise)
- Code/concept/error explanations with skill levels

---

## 💻 DEVELOPER TOOLS (✅ IMPLEMENTED - TIER 2 PREMIUM)

*Secure code execution via containerized Agent architecture. **Tier-gated:** Requires Tier 2 (Premium).*

### Security Architecture: Agent Containers (gVisor)

**Why gVisor?** User code executes in isolated containers with a user-space kernel that intercepts syscalls - attackers cannot reach the host kernel even if they escape the container.

```text
┌─────────────────────────────────────────────────────────────┐
│  Main Bot Process                                           │
│  ┌─────────────┐                                            │
│  │ Code Runner │──► HTTP API ──► ┌────────────────────────┐ │
│  │ Controller  │                 │ Agent Container        │ │
│  └─────────────┘◄── Results ◄─── │ (gVisor + Docker)      │ │
│                                  │ • No network access    │ │
│  Timeout Monitor (10s max) ────► │ • Read-only filesystem │ │
│                                  │ • 128MB memory limit   │ │
│                                  │ • 50% CPU quota        │ │
│                                  │ • Auto-destroyed       │ │
│                                  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Implementation:**

- Runtime: Docker with `runsc` (gVisor) runtime
- Communication: HTTP API with signed payloads
- Container image: `skynet-sandbox` with Node.js, Python
- Lifecycle: Ephemeral (created per execution, auto-removed)

### Code Tools

| Command | Description | Status |
|---------|-------------|--------|
| `coderun` | Execute code in sandbox | ✅ BUILT-IN (`coderun.js`) |
| `codeformat` | Format/highlight code | ✅ BUILT-IN (`codeformat.js`) |
| `snippet` | Save/retrieve code snippets | ✅ BUILT-IN (`snippet.js`) |
| `lint` | Run linter on code | ✅ BUILT-IN (`lint.js`) |

### Regex & JSON

| Command | Description | Status |
|---------|-------------|--------|
| `regextest` | Test regex patterns | ✅ BUILT-IN (`regextest.js`) |
| `regexexplain` | Explain regex pattern | ✅ BUILT-IN (`regexexplain.js`) |
| `jsonpretty` | Pretty print JSON | ✅ BUILT-IN (`jsonpretty.js`) |
| `jsonminify` | Minify JSON | ✅ BUILT-IN (`jsonminify.js`) |
| `jsonpath` | Query JSON with JSONPath | ✅ BUILT-IN (`jsonpath.js`) |

### Utilities

| Command | Description | Status |
|---------|-------------|--------|
| `http` | Make HTTP requests | ✅ BUILT-IN (`http.js`) |
| `base64` | Encode/decode base64 | ✅ BUILT-IN (`base64.js`) |
| `hash` | Generate hashes | ✅ BUILT-IN (`hash.js`) |
| `timestamp` | Unix timestamp converter | ✅ BUILT-IN (`timestamp.js`) |

---

## 📊 ADVANCED ANALYTICS (TIER 2 - PREMIUM) ✅ IMPLEMENTED

*Analytics for server management. **Tier-gated:** Requires Tier 2 (Premium) subscription.*

**Architecture:** `Modules/Analytics` with dashboard visualization in `Web/views/pages/admin-analytics.ejs`.

**Core Files:**

- `Modules/Analytics/AnalyticsCollector.js` - Data collection and aggregation
- `Modules/Analytics/AnalyticsExporter.js` - CSV/JSON export functionality
- `Modules/Analytics/AnalyticsAggregator.js` - Historical data management
- `Database/Schemas/serverAnalyticsSchema.js` - Analytics data storage
- `Internals/SlashCommands/commands/analytics.js` - Unified slash command
- `Web/views/pages/admin-analytics.ejs` - Dashboard visualization

| Command | Description | Status |
|---------|-------------|--------|
| `/analytics members` | Member activity stats | ✅ BUILT-IN (`analytics.js`) |
| `/analytics channels` | Channel activity stats | ✅ BUILT-IN (`analytics.js`) |
| `/analytics roles` | Role-based engagement | ✅ BUILT-IN (`analytics.js`) |
| `/analytics joins` | Join/leave analytics | ✅ BUILT-IN (`analytics.js`) |
| `/analytics commands` | Command usage stats | ✅ BUILT-IN (`analytics.js`) |
| `/analytics heatmap` | Activity heatmap | ✅ BUILT-IN (`analytics.js`) |
| `/analytics export` | Export stats to CSV | ✅ BUILT-IN (`analytics.js`) |

**Features:**

- Member activity tracking (messages, voice, ranks, activity rate)
- Channel activity analysis with message distribution
- Role engagement metrics (size, activity, engagement rate)
- Join/leave analytics with account age distribution
- Command usage statistics with percentages
- Activity heatmap by day/hour
- CSV export for all data types
- Dashboard with Chart.js visualizations
- Tab-based navigation for different analytics views

---

## 🏗️ CORE SYSTEMS (PLANNED BUILT-IN)

*These categories are core infrastructure and should be built-in.*

### 🔔 Notifications & Feeds ✅ PARTIAL

**Architecture:** `/announce` slash command for announcements and crossposting.

**Core Files:**
- `Internals/SlashCommands/commands/announce.js` - Announcement management

| Command | Description | Status |
|---------|-------------|--------|
| `twitchnotify` | Twitch alerts | ✅ BUILT-IN (`streamers.js`) |
| `youtubenotify` | YouTube alerts | ✅ BUILT-IN (`youtube.js`) |
| `rssfeed` | RSS Feeds | ✅ BUILT-IN (`rss.js`) |
| `redditfeed` | Reddit Feeds | ✅ BUILT-IN (`reddit.js`) |
| `/announce send` | Send announcement | ✅ BUILT-IN (`announce.js`) |
| `/announce edit` | Edit announcement | ✅ BUILT-IN (`announce.js`) |
| `/announce schedule` | Schedule announcement | ✅ BUILT-IN (`announce.js`) |
| `/announce crosspost` | Crosspost to followers | ✅ BUILT-IN (`announce.js`) |
| `twitternotify` | Twitter/X notifications | 🚧 PLANNED BUILT-IN |

**Features:**
- **Announcements:** Custom embeds with titles and colors
- **Scheduling:** Delay announcements by minutes
- **Crossposting:** Publish to announcement channel followers
- **Editing:** Update existing announcements

### 🎭 Role Management ✅ IMPLEMENTED

**Architecture:** Unified `/roles` slash command with subcommands for all role management features.

**Core Files:**

- `Internals/SlashCommands/commands/roles.js` - Unified slash command
- `Database/Schemas/rolePanelSchema.js` - Role panel configuration
- `Database/Schemas/tempRoleSchema.js` - Temporary role assignments
- `Modules/TempRoleManager.js` - Temp role expiry checker
- `Internals/SlashCommands/SlashCommandHandler.js` - Button/dropdown handlers
- `Internals/Events/messageReactionAdd/Skynet.RolePanel.js` - Reaction handler
- `Internals/Events/messageReactionRemove/Skynet.RolePanel.js` - Reaction removal

| Command | Description | Status |
|---------|-------------|--------|
| `role` | Manage joinable roles | ✅ BUILT-IN (`role.js`) |
| `/roles panel create` | Create role panel (button/dropdown/reaction) | ✅ BUILT-IN (`roles.js`) |
| `/roles panel addrole` | Add role to panel | ✅ BUILT-IN (`roles.js`) |
| `/roles panel removerole` | Remove role from panel | ✅ BUILT-IN (`roles.js`) |
| `/roles panel list` | List all panels | ✅ BUILT-IN (`roles.js`) |
| `/roles panel delete` | Delete a panel | ✅ BUILT-IN (`roles.js`) |
| `/roles panel refresh` | Refresh panel message | ✅ BUILT-IN (`roles.js`) |
| `/roles auto add` | Add autorole for new members | ✅ BUILT-IN (`roles.js`) |
| `/roles auto remove` | Remove autorole | ✅ BUILT-IN (`roles.js`) |
| `/roles auto list` | List autoroles | ✅ BUILT-IN (`roles.js`) |
| `/roles temp` | Give temporary role | ✅ BUILT-IN (`roles.js`) |
| `/roles templist` | List active temp roles | ✅ BUILT-IN (`roles.js`) |
| `/roles tempremove` | Remove temp role early | ✅ BUILT-IN (`roles.js`) |
| `rolesync` | Sync roles between servers | 🚧 PLANNED BUILT-IN (Tier 2) |

**Features:**
- **Role Panels:** Button, dropdown, or reaction-based role selection
- **Panel Modes:** Normal (toggle), Unique (one role only), Verify (add-only)
- **Autoroles:** Auto-assign roles to new members on join
- **Temporary Roles:** Time-limited role assignments with auto-expiry
- **Interactive Components:** Discord buttons, select menus, and reactions
- **Expiry Management:** Background checker removes expired temp roles

### 🔊 Voice Features ✅ IMPLEMENTED

**Architecture:** Unified `/voice` slash command with subcommands for voice channel management.

**Core Files:**
- `Internals/SlashCommands/commands/voice.js` - Unified slash command
- `Modules/VoiceStatsCollector.js` - Voice activity tracking
- `Database/Schemas/serverConfigSchema.js` - room_data with owner_id

| Command | Description | Status |
|---------|-------------|--------|
| `room` | Legacy temp channels | ✅ BUILT-IN (`room.js`) |
| `/voice create` | Create temp voice channel | ✅ BUILT-IN (`voice.js`) |
| `/voice lock` | Lock voice channel | ✅ BUILT-IN (`voice.js`) |
| `/voice unlock` | Unlock voice channel | ✅ BUILT-IN (`voice.js`) |
| `/voice invite` | Invite user to locked channel | ✅ BUILT-IN (`voice.js`) |
| `/voice kick` | Kick user from channel | ✅ BUILT-IN (`voice.js`) |
| `/voice transfer` | Transfer channel ownership | ✅ BUILT-IN (`voice.js`) |
| `/voice rename` | Rename voice channel | ✅ BUILT-IN (`voice.js`) |
| `/voice limit` | Set user limit | ✅ BUILT-IN (`voice.js`) |
| `/voice claim` | Claim abandoned channel | ✅ BUILT-IN (`voice.js`) |
| `/voice stats` | View voice activity stats | ✅ BUILT-IN (`voice.js`) |
| `/voice leaderboard` | Voice time rankings | ✅ BUILT-IN (`voice.js`) |
| `/voice delete` | Delete voice channel | ✅ BUILT-IN (`voice.js`) |
| `afkkick` | Auto-kick AFK users | 🚧 PLANNED BUILT-IN |

**Features:**
- **Temp Channels:** Create private or public voice channels
- **Ownership:** Channel owners can lock, invite, kick, and transfer
- **Claiming:** Take over abandoned channels when owner leaves
- **Voice Stats:** Track personal voice time and leaderboard
- **Premium Gated:** Voice channel creation requires premium tier

### 🗳️ Polls & Feedback ✅ IMPLEMENTED

**Architecture:** Enhanced `/poll` slash command with subcommands for poll management.

**Core Files:**
- `Internals/SlashCommands/commands/poll.js` - Slash command
- `Commands/Private/poll.js` - Legacy DM-based polls

| Command | Description | Status |
|---------|-------------|--------|
| `/poll create` | Create a poll with options | ✅ BUILT-IN (`poll.js`) |
| `/poll end` | End poll and show results | ✅ BUILT-IN (`poll.js`) |
| `/poll results` | View current results | ✅ BUILT-IN (`poll.js`) |
| `poll` | Legacy DM poll creation | ✅ BUILT-IN (`poll.js`) |
| `suggest` | Suggestions | ✅ BUILT-IN (`suggest.js`) |
| `/poll weighted` | Weighted voting (role-based) | ✅ BUILT-IN (`poll.js`) |
| `/poll ranked` | Ranked choice voting | ✅ BUILT-IN (`poll.js`) |

**Features:**
- **Timed Polls:** Set duration for auto-ending
- **Anonymous Mode:** Hide voter identities
- **Visual Results:** Progress bars and percentages
- **Custom Options:** Up to 10 poll options

### 📜 Logging & Audit ✅ IMPLEMENTED

**Architecture:** Unified `/logs` slash command for logging configuration and audit viewing.

**Core Files:**
- `Internals/SlashCommands/commands/logs.js` - Slash command

| Command | Description | Status |
|---------|-------------|--------|
| `/logs channel` | Set logging channel | ✅ BUILT-IN (`logs.js`) |
| `/logs enable` | Enable logging | ✅ BUILT-IN (`logs.js`) |
| `/logs disable` | Disable logging | ✅ BUILT-IN (`logs.js`) |
| `/logs status` | View configuration | ✅ BUILT-IN (`logs.js`) |
| `/logs events` | Toggle event logging | ✅ BUILT-IN (`logs.js`) |
| `/logs view` | View recent mod actions | ✅ BUILT-IN (`logs.js`) |
| `/logs user` | View user action history | ✅ BUILT-IN (`logs.js`) |
| `/logs ignore` | Ignore channel from logs | ✅ BUILT-IN (`logs.js`) |
| `/logs unignore` | Unignore channel | ✅ BUILT-IN (`logs.js`) |
| `/logs export` | Export logs to CSV/JSON | ✅ BUILT-IN (`logs.js`) - Tier 2 |
| `/audit snapshot` | Permission snapshot | ✅ BUILT-IN (`audit.js`) |
| `/audit roles` | Audit role permissions | ✅ BUILT-IN (`audit.js`) |
| `/audit channels` | Audit channel permissions | ✅ BUILT-IN (`audit.js`) |
| `/audit dangerous` | Find dangerous permissions | ✅ BUILT-IN (`audit.js`) |

**Features:**
- **Event Configuration:** Toggle individual event types
- **Channel Ignore:** Exclude channels from logging
- **Mod Action View:** View recent moderation actions
- **User History:** View actions for/by specific users

### 😴 AFK & Status ✅ IMPLEMENTED

**Architecture:** Enhanced `/afk` slash command with subcommands for status management.

**Core Files:**
- `Internals/SlashCommands/commands/afk.js` - Slash command
- `Commands/PM/afk.js` - Legacy DM command

| Command | Description | Status |
|---------|-------------|--------|
| `afk` | Legacy AFK (DM) | ✅ BUILT-IN (`afk.js`) |
| `/afk set` | Set AFK message | ✅ BUILT-IN (`afk.js`) |
| `/afk clear` | Clear AFK status | ✅ BUILT-IN (`afk.js`) |
| `/afk list` | List AFK members | ✅ BUILT-IN (`afk.js`) |
| `/afk check` | Check user's AFK | ✅ BUILT-IN (`afk.js`) |
| `/afk auto` | Auto-AFK on inactivity | ✅ BUILT-IN (`afk.js`) |
| `/afk voicekick` | Kick AFK users from voice | ✅ BUILT-IN (`afk.js`) |
| `/afk status` | View AFK system config | ✅ BUILT-IN (`afk.js`) |

**Features:**
- **AFK Messages:** Set custom away messages
- **AFK List:** View all AFK members in server
- **AFK Check:** Check specific user's AFK status
- **Timestamp Tracking:** Shows when user went AFK

### ⭐ Highlights & Pins ✅ IMPLEMENTED

**Architecture:** Unified `/starboard` slash command with configuration and management subcommands.

**Core Files:**
- `Internals/SlashCommands/commands/starboard.js` - Slash command
- `Internals/Events/messageReactionAdd/Skynet.Starboard.js` - Reaction handler

| Command | Description | Status |
|---------|-------------|--------|
| `/starboard channel` | Set starboard channel | ✅ BUILT-IN (`starboard.js`) |
| `/starboard threshold` | Set reaction threshold | ✅ BUILT-IN (`starboard.js`) |
| `/starboard emoji` | Set starboard emoji | ✅ BUILT-IN (`starboard.js`) |
| `/starboard enable` | Enable starboard | ✅ BUILT-IN (`starboard.js`) |
| `/starboard disable` | Disable starboard | ✅ BUILT-IN (`starboard.js`) |
| `/starboard status` | View configuration | ✅ BUILT-IN (`starboard.js`) |
| `/starboard force` | Force message to starboard | ✅ BUILT-IN (`starboard.js`) |
| `/starboard remove` | Remove from starboard | ✅ BUILT-IN (`starboard.js`) |
| `/starboard top` | View top starred messages | ✅ BUILT-IN (`starboard.js`) |
| `/pins queue` | Pin nomination queue | ✅ BUILT-IN (`pins.js`) |
| `/pins nominate` | Nominate message for pin | ✅ BUILT-IN (`pins.js`) |
| `/pins auto` | Auto-pin rules | ✅ BUILT-IN (`pins.js`) |
| `/pins rotate` | Configure pin rotation | ✅ BUILT-IN (`pins.js`) |
| `/pins cleanup` | Clean up old pins | ✅ BUILT-IN (`pins.js`) |
| `/pins status` | View pin config | ✅ BUILT-IN (`pins.js`) |
| `/pins archive` | Archive pins to channel | ✅ BUILT-IN (`pins.js`) |

**Features:**
- **Starboard Configuration:** Channel, threshold, custom emoji
- **Force Star:** Manually add messages to starboard
- **Remove Star:** Remove messages from starboard
- **Top Stars:** View leaderboard of starred messages
- **Auto-Update:** Star count updates as reactions change

### 😀 Emoji Management ✅ IMPLEMENTED

**Architecture:** Unified `/emoji` slash command with subcommands for emoji management.

**Core Files:**
- `Internals/SlashCommands/commands/emoji.js` - Unified slash command
- `Commands/Public/emoji.js` - Legacy jumbo command

| Command | Description | Status |
|---------|-------------|--------|
| `emoji` | Legacy jumbo emojis | ✅ BUILT-IN (`emoji.js`) |
| `/emoji steal` | Copy emoji from another server | ✅ BUILT-IN (`emoji.js`) |
| `/emoji add` | Add emoji from URL | ✅ BUILT-IN (`emoji.js`) |
| `/emoji rename` | Rename an emoji | ✅ BUILT-IN (`emoji.js`) |
| `/emoji delete` | Delete an emoji | ✅ BUILT-IN (`emoji.js`) |
| `/emoji list` | List all server emojis | ✅ BUILT-IN (`emoji.js`) |
| `/emoji stats` | View usage statistics | ✅ BUILT-IN (`emoji.js`) |
| `/emoji info` | Get emoji information | ✅ BUILT-IN (`emoji.js`) |
| `/emoji pack export` | Export emojis as pack | ✅ BUILT-IN (`emoji.js`) |
| `/emoji pack import` | Import emoji pack | ✅ BUILT-IN (`emoji.js`) |
| `/emoji pack preview` | Preview pack contents | ✅ BUILT-IN (`emoji.js`) |

**Features:**
- **Emoji Stealing:** Copy emojis from other servers by pasting them
- **URL Import:** Add emojis from direct image URLs
- **Management:** Rename and delete emojis with audit logging
- **Statistics:** Track emoji usage (requires emoji_stats in serverDocument)
- **Info Display:** View emoji details including creation date

### 🔧 Server Management

| Command | Description | Status |
|---------|-------------|--------|
| `nuke` | Clear channel | ❌ BUILT-IN (`nuke.js`) |
| `invite` | Invite tracking | ❌ BUILT-IN (`invite.js`) |
| `/backup create` | Create server backup | ✅ BUILT-IN (`backup.js`) - Tier 2 |
| `/backup list` | List server backups | ✅ BUILT-IN (`backup.js`) - Tier 2 |
| `/backup info` | View backup details | ✅ BUILT-IN (`backup.js`) - Tier 2 |
| `/backup restore` | Restore from backup | ✅ BUILT-IN (`backup.js`) - Tier 2 |
| `/backup delete` | Delete a backup | ✅ BUILT-IN (`backup.js`) - Tier 2 |
| `/backup schedule` | Configure auto backups | ✅ BUILT-IN (`backup.js`) - Tier 2 |
| `/server info` | View server information | ✅ BUILT-IN (`server.js`) |
| `/server settings` | View server settings | ✅ BUILT-IN (`server.js`) |
| `/server prefix` | Set command prefix | ✅ BUILT-IN (`server.js`) |
| `/server lockdown start` | Lock all channels | ✅ BUILT-IN (`server.js`) |
| `/server lockdown end` | Unlock all channels | ✅ BUILT-IN (`server.js`) |
| `/server lockdown channel` | Lock/unlock channel | ✅ BUILT-IN (`server.js`) |
| `/server slowmode set` | Set channel slowmode | ✅ BUILT-IN (`server.js`) |
| `/server slowmode all` | Set all channels slowmode | ✅ BUILT-IN (`server.js`) |
| `/server cleanup` | Bulk delete messages | ✅ BUILT-IN (`server.js`) |
| `/server nuke` | Recreate channel | ✅ BUILT-IN (`server.js`) |
| `/antinuke enable` | Enable anti-nuke protection | ✅ BUILT-IN (`antinuke.js`) - Tier 2 |
| `/antinuke disable` | Disable anti-nuke | ✅ BUILT-IN (`antinuke.js`) - Tier 2 |
| `/antinuke status` | View anti-nuke config | ✅ BUILT-IN (`antinuke.js`) - Tier 2 |
| `/antinuke whitelist` | Whitelist user | ✅ BUILT-IN (`antinuke.js`) - Tier 2 |
| `/antinuke thresholds` | Configure thresholds | ✅ BUILT-IN (`antinuke.js`) - Tier 2 |
| `/antinuke action` | Set violation action | ✅ BUILT-IN (`antinuke.js`) - Tier 2 |
| `/antinuke logs` | View incidents | ✅ BUILT-IN (`antinuke.js`) - Tier 2 |
| `/verify setup` | Set up verification | ✅ BUILT-IN (`verify.js`) |
| `/verify message` | Customize verification message | ✅ BUILT-IN (`verify.js`) |
| `/verify post` | Post verification message | ✅ BUILT-IN (`verify.js`) |
| `/verify disable` | Disable verification | ✅ BUILT-IN (`verify.js`) |
| `/verify status` | View verification status | ✅ BUILT-IN (`verify.js`) |
| `/verify manual` | Manually verify member | ✅ BUILT-IN (`verify.js`) |
| `/verify unverify` | Remove verification | ✅ BUILT-IN (`verify.js`) |

**Features:**
- **Server Lockdown:** Lock/unlock all or specific channels
- **Slowmode Control:** Set slowmode for individual or all channels
- **Message Cleanup:** Bulk delete with user filter
- **Channel Nuke:** Delete and recreate channel

### 📨 Invite Tracking ✅ IMPLEMENTED

**Architecture:** Unified `/invites` slash command with invite tracking and statistics.

**Core Files:**
- `Internals/SlashCommands/commands/invites.js` - Slash command
- `Database/Schemas/inviteTrackingSchema.js` - Tracking data

| Command | Description | Status |
|---------|-------------|--------|
| `/invites leaderboard` | View top inviters | ✅ BUILT-IN (`invites.js`) |
| `/invites info` | View invite stats for user | ✅ BUILT-IN (`invites.js`) |
| `/invites who` | See who invited a member | ✅ BUILT-IN (`invites.js`) |
| `/invites create` | Create tracked invite with label | ✅ BUILT-IN (`invites.js`) |
| `/invites list` | List all tracked invites | ✅ BUILT-IN (`invites.js`) |
| `/invites delete` | Delete an invite | ✅ BUILT-IN (`invites.js`) |
| `/invites sync` | Sync existing invites | ✅ BUILT-IN (`invites.js`) |
| `/invites rewards add` | Add invite reward | ✅ BUILT-IN (`invites.js`) |
| `/invites rewards remove` | Remove invite reward | ✅ BUILT-IN (`invites.js`) |
| `/invites rewards list` | List invite rewards | ✅ BUILT-IN (`invites.js`) |
| `/invites rewards check` | Grant missing rewards | ✅ BUILT-IN (`invites.js`) |

**Features:**
- **Invite Leaderboard:** Track top inviters with active/left counts
- **Invite Labels:** Create labeled invites for campaign tracking
- **Source Tracking:** See who invited any member
- **Sync System:** Import existing Discord invites

### ✅ Onboarding ✅ IMPLEMENTED

**Architecture:** Unified `/onboard` slash command for member onboarding configuration.

**Core Files:**
- `Internals/SlashCommands/commands/onboard.js` - Slash command
- `Internals/SlashCommands/SlashCommandHandler.js` - Button/select handlers

| Command | Description | Status |
|---------|-------------|--------|
| `/onboard welcome` | Configure welcome messages | ✅ BUILT-IN (`onboard.js`) |
| `/onboard roles` | Configure role selection | ✅ BUILT-IN (`onboard.js`) |
| `/onboard rules` | Configure rules acceptance | ✅ BUILT-IN (`onboard.js`) |
| `/onboard dm` | Configure DM welcome | ✅ BUILT-IN (`onboard.js`) |
| `/onboard preview` | Preview welcome message | ✅ BUILT-IN (`onboard.js`) |
| `/onboard status` | View onboarding config | ✅ BUILT-IN (`onboard.js`) |
| `/onboard disable` | Disable onboarding features | ✅ BUILT-IN (`onboard.js`) |

**Features:**
- **Welcome Messages:** Custom channel messages with placeholders
- **DM Welcomes:** Private welcome messages to new members
- **Rules Acceptance:** Button-based verification with role grant
- **Role Selection:** Dropdown menu for role self-assignment

---

## UPDATED TOTALS

**Categories:** 35+
**Total Command Ideas:** 400+

### Priority Implementation Order

1. **Music & Audio** (Built-in)
2. **Ticket System** (Hybrid)
3. **Advanced Auto-Moderation** (Built-in)
4. **Economy Features** (Built-in + Extensions)
5. **Games** (Extensions)
6. **Social & Fun** (Built-in)
7. **Utilities** (Built-in)
8. **Core Systems** (Built-in)
9. **AI Features** (Built-in)
10. **Analytics & Logging** (Built-in)

*Last Updated: December 2025*
*Total Ideas: 400+ commands*
*Built-in duplicates identified: ~60+ commands*
