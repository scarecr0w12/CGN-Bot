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
| `voicetime` | Voice channel time tracking | 🚧 PLANNED BUILT-IN |

### Server Info

| Command | Description | Status |
|---------|-------------|--------|
| `serverstats` | Server information | ❌ BUILT-IN (`info.js`) |
| `roleinfo` | Role details | ❌ BUILT-IN (`roleinfo.js`) |
| `channelinfo` | Channel details | 🚧 PLANNED BUILT-IN |
| `emojilist` | Server emoji list | ❌ BUILT-IN (`emotes.js`) |
| `boosters` | Server boost info | 🚧 PLANNED BUILT-IN |

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
| `poke` | Poke user | 🚧 PLANNED BUILT-IN |
| `cuddle` | Cuddle user | 🚧 PLANNED BUILT-IN |
| `kiss` | Kiss user | 🚧 PLANNED BUILT-IN |
| `highfive` | High five user | 🚧 PLANNED BUILT-IN |

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
| `rate` | Rate something | 🚧 PLANNED BUILT-IN |
| `lovecalc` | Love compatibility | 🚧 PLANNED BUILT-IN |
| `compliment` | Give compliment | 🚧 PLANNED BUILT-IN |
| `insult` | Generate insult | 🚧 PLANNED BUILT-IN |
| `fact` | Random fact | 🚧 PLANNED BUILT-IN |

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
| `dodge` | React with correct emoji | 📦 EXTENSION |
| `mathsnap` | React to true equations | ✅ SEEDED (Batch 9) |

### Social Deduction

| Command | Description | Status |
|---------|-------------|--------|
| `mafia` | Social deduction | ✅ SEEDED (Batch 2) |
| `spyfall` | Find the spy | ✅ SEEDED (Batch 4) |
| `traitor` | Vote out traitor | ✅ SEEDED (Batch 5) |
| `liar` | Detect who has different info | ✅ SEEDED (Batch 9) |
| `secretroles` | Hidden role games | 📦 EXTENSION |
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
| `bossraid` | Server Boss | 📦 EXTENSION |
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
| `diceroll` | Dice rolling with bets | 📦 EXTENSION |
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
| `glitch` | Glitch effect | 📦 EXTENSION |
| `petpet` | Petting GIF | 📦 EXTENSION |
| `drip` | Add drip/swag | 📦 EXTENSION |
| `jail` | Put behind bars | ✅ SEEDED (Batch 10) |
| `rip` | Gravestone image | ✅ SEEDED (Batch 10) |
| `trash` | Trash meme | 📦 EXTENSION |
| `beautiful` | "Beautiful" meme | 📦 EXTENSION |
| `facepalm` | Facepalm overlay | 📦 EXTENSION |
| `wasted` | GTA Wasted effect | ✅ SEEDED (Batch 10) |

### Meme Generation

| Command | Description | Status |
|---------|-------------|--------|
| `caption` | Meme captioner | ✅ SEEDED (Batch 5) |
| `drake` | Drake meme template | ✅ SEEDED (Batch 10) |
| `changemymind` | Change My Mind meme | 📦 EXTENSION |
| `distracted` | Distracted boyfriend meme | 📦 EXTENSION |
| `achievement` | Minecraft achievement | ✅ SEEDED (Batch 10) |

### Creative

| Command | Description | Status |
|---------|-------------|--------|
| `ascii` | Text to ASCII | ✅ SEEDED (Batch 10) |
| `qrcode` | Text to QR | ✅ SEEDED (Batch 10) |
| `banner` | Generate text banners | ✅ SEEDED (Batch 10) |
| `quote` | Create quote images | ✅ SEEDED (Batch 10) |
| `polaroid` | Polaroid photo effect | 📦 EXTENSION |
| `album` | Album cover generator | 📦 EXTENSION |

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

## 🎧 MUSIC & AUDIO (TIER 2 - PREMIUM)

**Tier-gated:** Requires Tier 2 (Premium) subscription due to streaming resources.

**Architecture:** Native integration into `Internals/Audio` with `AudioPlayer` class.
**Dependencies Required:** `@discordjs/voice`, `ffmpeg-static`, `libsodium-wrappers`, `play-dl`.

| Command | Description | Status |
|---------|-------------|--------|
| `play` | Play music from YouTube/URL | ❌ BUILT-IN (`play.js`) |
| `skip` | Skip current song | ❌ BUILT-IN (`skip.js`) |
| `queue` | View music queue | ❌ BUILT-IN (`queue.js`) |
| `lyrics` | Get song lyrics | ❌ BUILT-IN (`lyrics.js`) |
| `dj` | DJ Controls (pause, resume, stop, volume, loop, shuffle) | ❌ BUILT-IN (`dj.js`) |
| `filters` | Audio filters (bassboost, nightcore, vaporwave, 8d) | ❌ BUILT-IN (`filters.js`) |

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

**Architecture:** Integrate into `Modules/Moderation`.
*Basic moderation = Tier 1. Antiraid/Antinuke/Altcheck = **Tier 2**.*

| Command | Description | Status |
|---------|-------------|--------|
| `automod` | Auto-moderation rules | 🚧 PLANNED BUILT-IN |
| `filter` | Word filtering | 🚧 PLANNED BUILT-IN |
| `strike` | Give strikes | ❌ BUILT-IN (`strike.js`) |
| `modlog` | Configure logs | ❌ BUILT-IN (`modlog.js`) |
| `antispam` | Anti-spam system | 🚧 PLANNED BUILT-IN |
| `antiraid` | Anti-raid system | 🚧 PLANNED BUILT-IN (Tier 2) |
| `altcheck` | Alt account check | 🚧 PLANNED BUILT-IN (Tier 2) |

---

## 📺 ANIME & GAMING INTEGRATIONS (TIER 2 EXTENSIONS)

*Gaming integrations require external APIs - Extensions. **Tier-gated:** Requires Tier 2 (Premium) due to API costs.*

### Anime Lookup

| Command | Description | Status |
|---------|-------------|--------|
| `anime` | Search anime info | ❌ BUILT-IN |
| `manga` | Search manga info | 📦 EXTENSION |
| `character` | Search anime characters | 📦 EXTENSION |
| `animequote` | Random anime quote | 📦 EXTENSION |
| `animeguess` | Guess anime from screenshot | 📦 EXTENSION |
| `waifuroll` | Roll random waifu/husbando | 📦 EXTENSION |
| `waifuclaim` | Claim rolled characters | 📦 EXTENSION |
| `waifuprofile` | View waifu collection | 📦 EXTENSION |

### Minecraft

| Command | Description | Status |
|---------|-------------|--------|
| `mcstatus` | Check server status | 📦 EXTENSION |
| `mcskin` | Display player skin | 📦 EXTENSION |
| `mcuuid` | Get player UUID | 📦 EXTENSION |
| `mcnamehistory` | Player name history | 📦 EXTENSION |

### Valorant

| Command | Description | Status |
|---------|-------------|--------|
| `valorantstats` | Player stats and rank | 📦 EXTENSION |
| `valorantmatch` | Last match details | 📦 EXTENSION |
| `valorantagent` | Agent statistics | 📦 EXTENSION |

### League of Legends

| Command | Description | Status |
|---------|-------------|--------|
| `lolsummoner` | Summoner profile | 📦 EXTENSION |
| `lollive` | Live game lookup | 📦 EXTENSION |
| `lolbuild` | Champion builds | 📦 EXTENSION |
| `lolmastery` | Champion mastery | 📦 EXTENSION |

### Fortnite

| Command | Description | Status |
|---------|-------------|--------|
| `fortnitestats` | Player statistics | 📦 EXTENSION |
| `fortniteshop` | Daily item shop | 📦 EXTENSION |
| `fortnitetrack` | Track player stats | 📦 EXTENSION |

### General Gaming

| Command | Description | Status |
|---------|-------------|--------|
| `steamprofile` | Steam profile info | 📦 EXTENSION |
| `steamgame` | Game information | 📦 EXTENSION |
| `lfg` | Looking for group | 📦 EXTENSION |
| `gamestats` | Generic game stats | 📦 EXTENSION |

---

## 🤖 AI FEATURES (TIER 2 - PREMIUM)

*AI features integrate with existing AI module. **Tier-gated:** Requires Tier 2 (Premium) due to API costs.*

| Command | Description | Status |
|---------|-------------|--------|
| `aichat` | Chat with AI | ❌ BUILT-IN (`ai.js`) |
| `aithread` | Persistent AI conversation | 🚧 PLANNED BUILT-IN |
| `aisummarize` | Summarize text/messages | 🚧 PLANNED BUILT-IN |
| `airewrite` | Rewrite in different tone | 🚧 PLANNED BUILT-IN |
| `aiexplain` | Explain code/concepts | 🚧 PLANNED BUILT-IN |
| `aiimage` | Generate image from prompt | 🚧 PLANNED BUILT-IN |
| `aiavatar` | Stylized avatar generation | 🚧 PLANNED BUILT-IN |
| `aivariations` | Image variations | 🚧 PLANNED BUILT-IN |

---

## 💻 DEVELOPER TOOLS (TIER 2 - PREMIUM)

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
| `coderun` | Execute code in sandbox | 🚧 PLANNED BUILT-IN |
| `codeformat` | Format/highlight code | 🚧 PLANNED BUILT-IN |
| `snippet` | Save/retrieve code snippets | 🚧 PLANNED BUILT-IN |
| `lint` | Run linter on code | 🚧 PLANNED BUILT-IN |

### Regex & JSON

| Command | Description | Status |
|---------|-------------|--------|
| `regextest` | Test regex patterns | 🚧 PLANNED BUILT-IN |
| `regexexplain` | Explain regex pattern | 🚧 PLANNED BUILT-IN |
| `jsonpretty` | Pretty print JSON | 🚧 PLANNED BUILT-IN |
| `jsonminify` | Minify JSON | 🚧 PLANNED BUILT-IN |
| `jsonpath` | Query JSON with JSONPath | 🚧 PLANNED BUILT-IN |

### Utilities

| Command | Description | Status |
|---------|-------------|--------|
| `http` | Make HTTP requests | 🚧 PLANNED BUILT-IN |
| `base64` | Encode/decode base64 | 🚧 PLANNED BUILT-IN |
| `hash` | Generate hashes | 🚧 PLANNED BUILT-IN |
| `timestamp` | Unix timestamp converter | 🚧 PLANNED BUILT-IN |

---

## 📊 ADVANCED ANALYTICS (TIER 2 - PREMIUM)

*Analytics for server management. **Tier-gated:** Requires Tier 2 (Premium) subscription.*

**Architecture:** Integrate into `Modules/Analytics` with dashboard visualization in `Web/views/pages/dashboard`.

| Command | Description | Status |
|---------|-------------|--------|
| `memberactivity` | Member activity stats | 🚧 PLANNED BUILT-IN |
| `channelactivity` | Channel activity stats | 🚧 PLANNED BUILT-IN |
| `roleengagement` | Role-based engagement | 🚧 PLANNED BUILT-IN |
| `joinleave` | Join/leave analytics | 🚧 PLANNED BUILT-IN |
| `commandstats` | Command usage stats | 🚧 PLANNED BUILT-IN |
| `heatmap` | Activity heatmap | 🚧 PLANNED BUILT-IN |
| `exportstats` | Export stats to CSV | 🚧 PLANNED BUILT-IN |

---

## 🏗️ CORE SYSTEMS (PLANNED BUILT-IN)

*These categories are core infrastructure and should be built-in.*

### 🔔 Notifications & Feeds

| Command | Description | Status |
|---------|-------------|--------|
| `twitchnotify` | Twitch alerts | ❌ BUILT-IN (`streamers.js`) |
| `youtubenotify` | YouTube alerts | ❌ BUILT-IN (`youtube.js`) |
| `rssfeed` | RSS Feeds | ❌ BUILT-IN (`rss.js`) |
| `redditfeed` | Reddit Feeds | ❌ BUILT-IN (`reddit.js`) |
| `twitternotify` | Twitter/X notifications | 🚧 PLANNED BUILT-IN |
| `crosspost` | Mirror messages | 🚧 PLANNED BUILT-IN (Tier 2) |
| `announce` | Multi-channel announcements | 🚧 PLANNED BUILT-IN |

### 🎭 Role Management

| Command | Description | Status |
|---------|-------------|--------|
| `role` | Manage roles | ❌ BUILT-IN (`role.js`) |
| `rolepanel` | Reaction roles | 🚧 PLANNED BUILT-IN |
| `rolebutton` | Button-based role assign | 🚧 PLANNED BUILT-IN |
| `roledropdown` | Dropdown role menu | 🚧 PLANNED BUILT-IN |
| `temprole` | Give temporary role | 🚧 PLANNED BUILT-IN |
| `autorole` | Join roles | 🚧 PLANNED BUILT-IN |
| `rolesync` | Sync roles between servers | 🚧 PLANNED BUILT-IN (Tier 2) |

### 🔊 Voice Features

| Command | Description | Status |
|---------|-------------|--------|
| `vchub` | Temp voice channels | ❌ BUILT-IN (`room.js`) |
| `vclock` | Lock temp channel | 🚧 PLANNED BUILT-IN |
| `vcinvite` | Invite to locked channel | 🚧 PLANNED BUILT-IN |
| `vctransfer` | Transfer ownership | 🚧 PLANNED BUILT-IN |
| `voicestats` | Voice activity | 🚧 PLANNED BUILT-IN |
| `voiceleaderboard` | Voice time rankings | 🚧 PLANNED BUILT-IN |
| `afkkick` | Auto-kick AFK users | 🚧 PLANNED BUILT-IN |

### 🗳️ Polls & Feedback

| Command | Description | Status |
|---------|-------------|--------|
| `poll` | Create polls | ❌ BUILT-IN (`poll.js`) |
| `pollweighted` | Weighted voting | 🚧 PLANNED BUILT-IN |
| `pollranked` | Ranked choice voting | 🚧 PLANNED BUILT-IN |
| `pollanon` | Anonymous polls | 🚧 PLANNED BUILT-IN |
| `suggest` | Suggestions | ❌ BUILT-IN (`suggest.js`) |
| `suggestanon` | Anonymous suggestion | 🚧 PLANNED BUILT-IN |
| `feedbackform` | Create feedback form | 🚧 PLANNED BUILT-IN |

### 📜 Logging & Audit

| Command | Description | Status |
|---------|-------------|--------|
| `logsetup` | Configure logging | ❌ BUILT-IN (`modlog.js`) |
| `logevents` | Enable/disable events | 🚧 PLANNED BUILT-IN |
| `logview` | View recent logs | 🚧 PLANNED BUILT-IN |
| `logsearch` | Search logs | 🚧 PLANNED BUILT-IN |
| `logexport` | Export logs | 🚧 PLANNED BUILT-IN (Tier 2) |
| `logignore` | Ignore channels | 🚧 PLANNED BUILT-IN |
| `audituser` | User action history | 🚧 PLANNED BUILT-IN |
| `auditchannel` | Channel history | 🚧 PLANNED BUILT-IN |
| `auditsnapshot` | Permission snapshot | 🚧 PLANNED BUILT-IN |

### 😴 AFK & Status

| Command | Description | Status |
|---------|-------------|--------|
| `afk` | Set AFK status | ❌ BUILT-IN (`afk.js`) |
| `afkauto` | Auto-AFK on inactivity | 🚧 PLANNED BUILT-IN |
| `afklist` | List AFK members | 🚧 PLANNED BUILT-IN |
| `afklog` | Missed pings while AFK | 🚧 PLANNED BUILT-IN |
| `statusset` | Set server status | 🚧 PLANNED BUILT-IN |
| `statusrole` | Link status to roles | 🚧 PLANNED BUILT-IN |
| `presencestats` | Presence analytics | 🚧 PLANNED BUILT-IN |

### ⭐ Highlights & Pins

| Command | Description | Status |
|---------|-------------|--------|
| `starboard` | Highlight messages | ❌ BUILT-IN (`starboard.js`) |
| `starboardforce` | Force highlight | 🚧 PLANNED BUILT-IN |
| `starboardremove` | Remove highlight | 🚧 PLANNED BUILT-IN |
| `starboardtop` | Top highlights | 🚧 PLANNED BUILT-IN |
| `pinqueue` | Pin nomination queue | 🚧 PLANNED BUILT-IN |
| `pinauto` | Auto-pin rules | 🚧 PLANNED BUILT-IN |
| `pinrotate` | Rotate old pins | 🚧 PLANNED BUILT-IN |

### 😀 Emoji Management

| Command | Description | Status |
|---------|-------------|--------|
| `emoji` | Manage emojis | ❌ BUILT-IN (`emoji.js`) |
| `emojisteal` | Copy from other server | 🚧 PLANNED BUILT-IN |
| `emojibulk` | Bulk add emojis | 🚧 PLANNED BUILT-IN |
| `emojirename` | Rename emoji | 🚧 PLANNED BUILT-IN |
| `emojistats` | Usage statistics | 🚧 PLANNED BUILT-IN |
| `emojicleanup` | Remove unused | 🚧 PLANNED BUILT-IN |
| `emojipack` | Save/load emoji packs | 🚧 PLANNED BUILT-IN |

### 🔧 Server Management

| Command | Description | Status |
|---------|-------------|--------|
| `nuke` | Clear channel | ❌ BUILT-IN (`nuke.js`) |
| `invite` | Invite tracking | ❌ BUILT-IN (`invite.js`) |
| `backup` | Server backup | 🚧 PLANNED BUILT-IN (Tier 2) |
| `backupschedule` | Auto backup schedule | 🚧 PLANNED BUILT-IN (Tier 2) |
| `backuprestore` | Restore backup | 🚧 PLANNED BUILT-IN (Tier 2) |
| `antinuke` | Server protection | 🚧 PLANNED BUILT-IN (Tier 2) |
| `antinukewhitelist` | Whitelist trusted | 🚧 PLANNED BUILT-IN (Tier 2) |
| `antinukerollback` | Restore changes | 🚧 PLANNED BUILT-IN (Tier 2) |
| `verify` | Member verification | 🚧 PLANNED BUILT-IN |
| `verifycaptcha` | CAPTCHA verification | 🚧 PLANNED BUILT-IN |
| `verifyquiz` | Quiz verification | 🚧 PLANNED BUILT-IN |
| `channeltemplate` | Save/apply templates | 🚧 PLANNED BUILT-IN |
| `channelcleanup` | Archive inactive | 🚧 PLANNED BUILT-IN |
| `channellockdown` | Lock channels | 🚧 PLANNED BUILT-IN |
| `channelautoclear` | Auto-delete old messages | 🚧 PLANNED BUILT-IN |

### 📨 Invite Tracking

| Command | Description | Status |
|---------|-------------|--------|
| `invitecreate` | Create tracked invite | 🚧 PLANNED BUILT-IN |
| `inviteleaderboard` | Top inviters | 🚧 PLANNED BUILT-IN |
| `inviteinfo` | Invite statistics | 🚧 PLANNED BUILT-IN |
| `invitesource` | Who invited member | 🚧 PLANNED BUILT-IN |
| `inviteclean` | Clean unused invites | 🚧 PLANNED BUILT-IN |
| `invitereward` | Invite rewards | 🚧 PLANNED BUILT-IN |

### ✅ Onboarding

| Command | Description | Status |
|---------|-------------|--------|
| `onboardwelcome` | Welcome flow | 🚧 PLANNED BUILT-IN |
| `onboardroles` | Role selection | 🚧 PLANNED BUILT-IN |
| `onboardpreview` | Preview flow | 🚧 PLANNED BUILT-IN |
| `onboardstats` | Funnel metrics | 🚧 PLANNED BUILT-IN |

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
