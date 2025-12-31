# SkynetBot

[![CI](https://github.com/scarecr0w12/CGN-Bot/actions/workflows/ci.yml/badge.svg)](https://github.com/scarecr0w12/CGN-Bot/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/scarecr0w12/CGN-Bot)](https://github.com/scarecr0w12/CGN-Bot/releases)
[![GPL Licence](https://badges.frapsoft.com/os/gpl/gpl.svg?v=103)](https://github.com/scarecr0w12/CGN-Bot/blob/main/LICENSE)
[![Discord Server](https://discordapp.com/api/guilds/272081064535654400/embed.png)](https://discord.gg/GSZfe5sBp6)

A feature-rich Discord bot with a powerful web dashboard, designed to bring more activity to your server while keeping control with advanced moderation features.

## Features

- **🤖 AI Integration** - Chat with AI and generate images using DALL-E/Stable Diffusion
- **🧠 Sentiment Analysis** - AI-powered automod with Google Cloud NL API or AI fallback
- **🌍 Multilingual** - Full i18n support for 15 languages
- **💰 Economy System** - Full economy with daily rewards, jobs, shops, trading, quests, and achievements
- **🎵 Music System** - High-quality music playback with filters, lyrics, and DJ controls
- **🎮 Entertainment** - 60+ game extensions, polls, giveaways, and fun commands
- **🛡️ Moderation** - Progressive strike system, auto-mod filters, audit logging
- **🛠️ Developer Tools** - Code execution, linting, regex testing, and JSON utilities
- **📊 Analytics** - Activity scoring, server statistics, and leaderboards
- **⚙️ Server Management** - Dashboard-based channel and role management with drag-and-drop
- **🧩 Extensions** - Create, share, and install custom server extensions with slash command support
- **🎫 Ticket System** - Per-server support tickets with categories, panels, and transcripts
- **🎮 Game Updates** - Monitor and announce updates for Minecraft, Rust, Terraria, and more
- **💎 Server Premium** - Per-server subscriptions with Stripe/PayPal/BTCPay
- **🗳️ Vote Rewards** - Earn points from voting, referrals, and spend on premium features
- **🌐 Web Dashboard** - Full server management from the browser
- **🔐 OAuth Integration** - Link Google, GitHub, Twitch, Patreon accounts
- **🗃️ Dual Database** - Support for MongoDB and MariaDB backends
- **🔄 Distributed Systems** - Redis-based horizontal scaling for multi-instance deployments
- **🛠️ Extension SDK** - TypeScript SDK and CLI for professional extension development

## Quick Start

```bash
# Clone the repository
git clone https://github.com/scarecr0w12/CGN-Bot.git
cd CGN-Bot

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Discord bot token and database connection (MongoDB or MariaDB)

# Start the bot
node master.js
```

## Documentation

- [Changelog](CHANGELOG.md) - Version history and release notes
- [Feature Development](docs/FEATURE_DEVELOPMENT.md) - Tier-gated feature implementation guide
- [MariaDB Migration](docs/MARIADB_MIGRATION.md) - Guide for migrating from MongoDB to MariaDB
- [Distributed Architecture](docs/DISTRIBUTED_ARCHITECTURE.md) - Distributed systems architecture guide
- [Extension SDK](packages/extension-sdk/README.md) - Extension development SDK documentation
- [Contributing](/.github/CONTRIBUTING.md) - How to contribute to the project

### Implementation Guides

- [Phase 4: TypeScript Definitions](docs/PHASE_4_IMPLEMENTATION.md) - Type system implementation
- [Phase 5: Performance Monitoring](docs/PHASE_5_IMPLEMENTATION.md) - Metrics and monitoring
- [Phase 6: Distributed Systems](docs/PHASE_6_IMPLEMENTATION.md) - Redis-based scaling
- [Phase 8: Extension SDK](docs/PHASE_8_IMPLEMENTATION.md) - Developer tooling

## Development

You can contribute by opening pull requests as long as your commits follow our [eslint rules](https://github.com/scarecr0w12/CGN-Bot/blob/main/.eslintrc.js).

### Stability Status

**This code is under active development.**
Bug reports are welcome! Please submit them to our [issue tracker](https://github.com/scarecr0w12/CGN-Bot/issues).

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.
