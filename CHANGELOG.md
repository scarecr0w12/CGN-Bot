# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.1] - 2025-12-13

### Added

#### Extension Gallery - Batch 10 (Image & Media)

- **18 Image Manipulation Extensions**:
  - Avatar effects: `ship`, `wanted`, `triggered`, `pixel`, `jail`, `rip`, `wasted`, `passed`, `greyscale`, `invert`, `blur`
  - Meme generation: `drake`, `achievement`
  - Creative tools: `ascii`, `qrcode`, `banner`, `quoteimg`, `color`

#### Extension Gallery - Batch 11 (Text Manipulation)

- **14 Text Transformation Extensions**:
  - `zalgo` - Glitchy Zalgo text
  - `mock` - mOcKiNg SpOnGeBoB text
  - `owo` / `uwuify` - OwO speak conversions
  - `fancy` - Unicode fonts (8 styles)
  - `reverse` / `flip` - Text reversal and upside-down
  - `clap` - Add 👏 between words
  - `spoiler` - Per-character spoiler tags
  - `tiny` - Superscript text
  - `vaporwave` - Fullwidth aesthetic
  - `emojify` - Regional indicator letters
  - `leet` - 1337 speak
  - `scrambletext` - Middle letter scrambling

---

## [1.3.0] - 2025-12-13

### Added

#### Economy System

- **11 Built-in Economy Commands**:
  - `daily` - Claim daily rewards with streak bonuses
  - `work` - Work jobs to earn coins
  - `shop` / `inventory` / `sell` / `use` - Item management
  - `gift` / `trade` - Item trading between users
  - `quest` - Daily and weekly task system
  - `achievements` / `badges` / `streaks` - Progression tracking
  - `craft` / `upgrade` - Item crafting and stat upgrades
  - `leaderboard` - Economy rankings
- **Extension API Support** - Points module for extensions to interact with economy

#### Extension Platform Enhancements

- **47+ New Extensions** (Batches 2-5):
  - Card games: Poker, Uno, High-Low
  - Board games: Chess, Checkers, Tic-Tac-Toe, Minesweeper, Battleship
  - Word games: Wordle, Hangman, Anagram, Word Chain
  - Party games: Mafia, Spyfall, Caption Battle, Hot Take
  - RPG: Duel, Tower Climb, Escape Room
  - Puzzle: 2048, Mastermind, Cipher, Pattern, Maze
  - Trivia: Music Quiz, Flag Quiz
  - Economy: Gacha, Stocks, Auction, Season
  - Pets & Companions system
- **Slash Command Support** - Extensions can now register and handle Discord slash commands
- **Interaction API** - New API for button, select menu, and modal interactions
- **Premium Extensions** - Schema support for paid extensions with point-based pricing

#### Vote Rewards System

- **VoteRewardsManager** (`Modules/VoteRewardsManager.js`) - Complete point economy
- **Point Purchases** - Buy points with Stripe/BTCPay
- **Extension Redemption** - Purchase premium extensions with points
- **Transaction History** - Full audit trail for point transactions

#### Per-Server Premium Model

- **Server Subscriptions** - Premium features now apply per-server instead of per-user
- **Server Subscription Page** (`Web/views/pages/admin-subscription.ejs`) - Dashboard page for managing server subscriptions
- **TierManager Updates** - Refactored to support server-level feature gating
- **Seed Script** (`scripts/seed-tiers.js`) - Initialize default tiers and features

#### Redis Caching & Performance

- **Redis Integration** - Caching layer for frequently accessed data
- **Game Activity Tracking** - Real-time game session management
- **Session Store** - Redis-backed session storage for web dashboard

#### MariaDB 10.11 Database Layer

- **DriverSQL.js** - MariaDB connection pooling with automatic reconnection
- **ModelSQL.js** - SQL CRUD operations maintaining MongoDB-style API
- **DocumentSQL.js** - Row operations with atomic update support (`$set`, `$inc`, `$push`, `$pull`)
- **CursorSQL.js** - Query result iteration with `.exec()`, `.limit()`, `.sort()` methods
- **QuerySQL.js** - Fluent query builder for document manipulation
- **ObjectID.js** - MongoDB ObjectID compatibility layer for MariaDB
- **Database Migrations** - Complete DDL and migration scripts

#### Monitoring & Observability

- **Prometheus Metrics** (`Modules/Metrics.js`) - Bot performance metrics collection
- **Grafana Dashboards** - Pre-configured monitoring dashboards
- **Docker Monitoring Stack** - Full observability setup in docker-compose

#### Developer Workflows

- **8 Windsurf Workflows**:
  - `add-slash-command` - Scaffold new Discord slash commands
  - `check-logs` - View and analyze bot logs
  - `database-migration` - Create and run MariaDB migrations
  - `debug-container-error` - Debug container issues
  - `debug-web-routes` - Troubleshoot Express routes
  - `deploy-release` - Build and tag releases
  - `start-dev-environment` - Start Docker dev environment
  - `test-extension` - Validate bot extensions

#### Dashboard Enhancements

- **Advanced Stats Page** - Detailed server analytics
- **Maintainer Servers Page** - Admin server management
- **AI Model Selection** - Dynamic model list loading in AI settings
- **Premium Extensions Management** - Maintainer pages for extension marketplace

### Changed

- **Premium Architecture** - Migrated from user-based to server-based subscriptions
- **Extension Manager** - Enhanced scope handling and validation
- **Database Driver** - Abstracted backend selection (MongoDB vs MariaDB via `DB_TYPE` env)
- **WebServer** - Enhanced graceful shutdown and connection draining
- **Context Rules** - Refactored for improved clarity and consistency

### Fixed

- **TierManager Query** - Fixed missing `.exec()` causing non-iterable results
- **Activity Controller** - Use `.cache.size` for accurate guild/user counts
- **Admin Dashboard** - Fixed menu section persistence bugs
- **Extension Scopes** - Corrected scope validation and assignment
- **Auth Middleware** - Better session validation and error recovery

### Documentation

- **MARIADB_MIGRATION.md** - Comprehensive migration guide with schema mapping
- **EXTENSION_IDEAS.md** - Updated with 400+ command ideas and status tracking
- Archived obsolete planning documents to `docs/archive/`

---

## [1.2.1] - 2025-12-10

### Added

#### Vote Sites Management

- **Vote Sites Page** (`Web/views/pages/maintainer-vote-sites.ejs`) - Configure external voting sites
- **Maintainer Controller** - CRUD operations for vote site configuration
- **Schema Support** - `vote_sites` array in `siteSettingsSchema.js`
- **Default Sites** - Pre-configured top.gg and Discord Bot List in config template
- Supports custom name, URL (with `{id}` placeholder), and icon for each site

### Fixed

- **Maintainer Console Crash** - Added null check for empty aggregate results in dashboard stats
- **PresenceUpdate Log Spam** - Silently skip guilds without server documents instead of logging warnings
- **Site Settings Data Safety** - Refactored all controllers to prevent accidental blank document creation:
  - GET requests never create/save documents (use config defaults if not found)
  - POST requests only create documents when saving actual data

## [1.2.0] - 2025-12-09

### Added

#### Extension Import/Export System

- **Extension Packages** (`.skypkg`) - Export/import extensions between Skynet instances
- **Export API** (`GET /extensions/:extid/export`) - Download extension as JSON package
- **Import API** (`POST /extensions/import`) - Upload and install extension packages
- **My Extensions UI** - Import modal with file picker and preview
- **Gallery Export** - Export button in source view modal

#### AI Image Generation

- **Imagine Command** (`Commands/Public/imagine.js`) - Generate AI images with DALL-E/Stable Diffusion
- Supports size and style parameters
- Premium-only with tier gating

#### SEO & Blog System

- **SEO Controller** (`Web/controllers/seo.js`) - Sitemap generation and SEO utilities
- **Blog Seeder** (`scripts/seed-blog-posts.js`) - Script to populate blog content
- Fixed blog post rendering and variable passing

#### Feature Gating Implementation

- **17 tier-gated features** fully implemented (see `docs/FEATURE_DEVELOPMENT.md`)
- `BrandingHelper` - Custom embed branding for premium users
- `ThemeHelper` - Premium dashboard themes
- `FeatureFlags` - Beta feature opt-in system
- `WebhookDispatcher` - Custom webhook integrations

#### Dashboard Enhancements

- **Admin Export Page** (`Web/views/pages/admin-export.ejs`) - Export server data to JSON/CSV
- **Premium Analytics API** - Advanced server statistics endpoint

### Changed

- **Cloudflare IP Tracking** - Enhanced visitor IP logging with CF-Ray and country
- **Membership Pricing** - Dynamic yearly pricing based on configurable discount percentage
- **Nginx Configuration** - Added NAT gateway IP placeholder documentation

### Fixed

- **TemporaryStorage** - Handle missing `metadata.json` gracefully
- **Blog Posts** - Fixed `blogPost` variable not being passed to partials
- **Maintainer Console** - Fixed `Users.find()` returning non-iterable Cursor
- **Sitemap Generator** - Fixed query for non-existent `published` field
- **Membership Checkout** - Fixed 404 errors for API routes
- **Script Injector** - Allow raw HTML in head scripts, prevent textarea breakouts

### Dependencies

- No new dependencies

---

## [1.1.0] - 2025-12-09

### Added

#### Tiered Membership System

- **TierManager** (`Modules/TierManager.js`) - Feature gating and subscription management with caching
- **TokenEncryption** (`Modules/TokenEncryption.js`) - Secure OAuth token storage with AES-256-GCM
- **SubscriptionCheck** (`Modules/Timeouts/SubscriptionCheck.js`) - Automated subscription expiration handling
- **SiteSettings Schema** - MongoDB schema for site-wide settings (tiers, features, OAuth providers, payment settings)
- **OAuth Strategies** - Multi-provider authentication: Google, GitHub, Twitch, Patreon
- **Payment Integrations** - Stripe, PayPal, and BTCPay webhook handlers for subscriptions
- **Account Settings Page** - User-facing page for managing linked accounts and viewing subscription status
- **Membership Pricing Page** - Public pricing page with Stripe checkout integration
- **Maintainer Console Pages**:
  - Feature Registry - Toggle predefined features by category (Bot, Dashboard, API, General)
  - Membership Tiers - Configure tier levels, pricing, and feature assignments
  - User Management - Search users and manually assign tiers
  - Payment Providers - Configure Stripe, PayPal, BTCPay settings
  - OAuth Providers - Enable/disable external OAuth providers

#### Cloudflare Integration

- **CloudflareService** (`Modules/CloudflareService.js`) - Centralized API integration for cache purging, analytics, and security settings
- **Cloudflare Middleware** (`Web/middleware/cloudflare.js`) - Real IP extraction, country blocking, bot detection
- **Environment Configuration** - Cloudflare credentials and settings via `.env`

#### Modern UI System

- **Modern UI Stylesheet** (`Web/public/css/modern-ui.css`) - Consistent design system with stat cards, gradients, and responsive components
- **Refactored Dashboard** - Server cards with modern styling and hover effects
- **Admin Overview** - Stats grid with icon cards for members, messages, and top commands
- **Header/Footer** - Responsive navigation with user dropdown and modern styling

#### Sentry Error Tracking Improvements

- **Express Error Handler** - Proper integration with `Sentry.setupExpressErrorHandler()`
- **Async Error Capture** - Added `express-async-errors` for catching unhandled async route errors
- **User Context Middleware** - Automatically attach Discord user info to Sentry errors

#### Update System Migration

- **GitHub Releases API** - Migrated from custom versioning API to GitHub Releases
- **Automatic Updates** - Support for automatic updates via GitHub release downloads
- **Changelog Integration** - Version metadata includes release notes from GitHub

### Changed

- **Donation Settings** - Migrated from JSON file storage to MongoDB (`SiteSettings` collection)
- **Activity Controller** - Use `.cache.size` directly for guild/user counts instead of broken IPC calls
- **Message Counter Reset** - Aligned with UTC midnight instead of bot startup time
- **User Schema** - Extended with `subscription` and `linked_accounts` fields
- **Constants** - Updated GitHub repository references to `scarecr0w12/CGN-Bot`

### Fixed

- **Activity Stats Display** - Fixed "0 users / 0 servers" display issue by using correct Discord.js v14 API
- **Messages Today Reset** - Removed premature reset on bot restart that wiped daily message counts
- **Activity User Page** - Fixed empty array destructuring error when no users exist
- **Header Responsiveness** - Fixed mobile menu visibility and toggle behavior
- **Activity Grid Layout** - Default to visible grid layout without requiring JavaScript

### Dependencies

- Added `express-async-errors` ^3.1.1
- Added `passport-github2` ^0.1.12
- Added `passport-google-oauth20` ^2.0.0
- Added `passport-patreon` ^1.0.1
- Added `passport-twitch-new` ^0.0.2
- Added `stripe` ^14.10.0

## [1.0.0] - 2025-12-07

### Added

- Discord.js v14 support with modern bot architecture
- Extension system with sandboxed execution environment
- Activity scoring algorithm for server management
- Progressive moderation system with strike tracking
- Uptime Kuma integration for status monitoring
- Status page controller and API endpoints
- Web helpers module for shared utilities
- GitHub Actions CI/CD with automated releases
- Docker support with GitHub Container Registry publishing

### Features

- **Command Framework** - Rate limiting, cooldowns, channel-specific permissions
- **Extension Platform** - Validation, versioning, security sandboxing
- **Administrative Controls** - Moderation tracking, permission hierarchy
- **Wiki System** - Version control, reactions, contributor management
- **Activity Tracking** - Cross-server analytics, server categorization

[1.3.0]: https://github.com/scarecr0w12/CGN-Bot/releases/tag/v1.3.0
[1.2.1]: https://github.com/scarecr0w12/CGN-Bot/releases/tag/v1.2.1
[1.2.0]: https://github.com/scarecr0w12/CGN-Bot/releases/tag/v1.2.0
[1.1.0]: https://github.com/scarecr0w12/CGN-Bot/releases/tag/v1.1.0
[1.0.0]: https://github.com/scarecr0w12/CGN-Bot/releases/tag/v1.0.0
