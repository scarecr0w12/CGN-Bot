---
layout: default
title: Home
nav_order: 1
description: "SkynetBot - A feature-rich Discord bot with web dashboard, AI integration, economy system, and more."
permalink: /
---

# SkynetBot Documentation
{: .fs-9 }

A feature-rich Discord bot with a powerful web dashboard, designed to bring more activity to your server while keeping control with advanced moderation features.
{: .fs-6 .fw-300 }

[Get Started](/guide/getting-started){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[View on GitHub](https://github.com/scarecr0w12/CGN-Bot){: .btn .fs-5 .mb-4 .mb-md-0 }

---

## Features Overview

### 🤖 AI Integration
Multi-provider LLM support with OpenAI, Anthropic, Groq, and Ollama. Features conversation memory, web search, and customizable personalities.

### 💰 Economy System
Full virtual economy with daily rewards, jobs, shops, trading, quests, achievements, and gambling mini-games.

### 🎮 Entertainment
60+ game extensions including card games, board games, word games, trivia, and party games.

### 🛡️ Moderation
Progressive strike system, auto-mod filters, spam detection, audit logging, and role hierarchy enforcement.

### 📊 Analytics
Activity scoring, server statistics, leaderboards, and detailed analytics for premium servers.

### 🧩 Extensions
Create, share, and install custom server extensions with slash command support.

### 🎫 Ticket System
Per-server support tickets with categories, panels, transcripts, and staff management (Tier 2 Premium).

### 💎 Server Premium
Per-server subscriptions with Stripe/PayPal/BTCPay payment processing.

### 🌐 Web Dashboard
Full server management from the browser with modern UI and real-time updates.

---

## Quick Links

| Guide | Description |
|:------|:------------|
| [Installation](guide/installation) | Set up SkynetBot on your own server |
| [Getting Started](guide/getting-started) | Quick start guide for server owners |
| [Commands](guide/commands) | Full command reference |
| [Configuration](guide/configuration) | Configure all bot features |
| [Extensions](guide/extensions) | Create and install extensions |
| [Tickets](guide/tickets) | Set up support ticket system |
| [Testing](guide/testing) | Test your installation |
| [Troubleshooting](guide/troubleshooting) | Common issues and solutions |
| [API Reference](api/) | REST API documentation |

---

## System Requirements

| Component | Minimum | Recommended |
|:----------|:--------|:------------|
| Node.js | 18.x | 22.x |
| Database | MongoDB 6+ OR MariaDB 10.11+ | MariaDB 10.11+ |
| RAM | 1 GB | 4 GB |
| Storage | 5 GB | 20 GB |
| Redis | Optional | 7.x (for caching) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        SkynetBot                             │
├─────────────────────────────────────────────────────────────┤
│  master.js                                                   │
│  └── Shard Manager (auto-scaling)                           │
│       └── SkynetBot.js (per shard)                          │
│            ├── Discord.js Client                            │
│            ├── Command Handler                              │
│            ├── Event Handler                                │
│            └── Extension Manager                            │
├─────────────────────────────────────────────────────────────┤
│  Web Dashboard (Express.js)                                  │
│  ├── EJS Templates                                          │
│  ├── REST API                                               │
│  ├── OAuth Authentication                                   │
│  └── WebSocket (real-time updates)                          │
├─────────────────────────────────────────────────────────────┤
│  Database Layer                                              │
│  ├── MongoDB Driver                                         │
│  └── MariaDB Driver (SQL)                                   │
├─────────────────────────────────────────────────────────────┤
│  Modules                                                     │
│  ├── AI Manager (multi-provider)                            │
│  ├── Tier Manager (premium features)                        │
│  ├── Vote Rewards Manager                                   │
│  ├── Extension Sandbox (isolated-vm)                        │
│  └── Metrics (Prometheus)                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/scarecr0w12/CGN-Bot/issues)
- **Discord Server**: [Join our community](https://discord.gg/GSZfe5sBp6)
- **Wiki**: Browse the in-bot wiki with `!wiki` command

---

## License

SkynetBot is distributed under the [GPL-3.0 License](https://github.com/scarecr0w12/CGN-Bot/blob/main/LICENSE).
