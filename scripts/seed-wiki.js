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
- 🤖 [AI Guide](AI-Guide) - AI assistant features and configuration
- 💰 [Economy Guide](Economy-Guide) - Virtual economy system
- 👑 [Server Owner Guide](Server-Owner-Guide) - Configure your server
- 🛡️ [Admin Levels](Admin-Levels) - Understanding permissions
- 🧩 [Extensions](Extensions) - Extend your bot's functionality
- 🎫 [Ticket System](Ticket-System) - Support ticket system (Premium)
- 🎵 [Music System](Music-Guide) - High-quality music playback (Premium)
- 💻 [Developer Tools](Developer-Tools) - Code execution and utilities (Premium)
- ⭐ [Premium Features](Premium-Features) - Server subscriptions
- ❓ [FAQ](FAQ) - Frequently Asked Questions

## Features Overview

### 🤖 AI Assistant
Get AI-powered assistance with multi-provider LLM support (OpenAI, Anthropic, Groq, Ollama). Features conversation memory, web search, and customizable personalities. See the [AI Guide](AI-Guide).

### 💰 Economy System
Full-featured virtual economy with wallets, banks, daily rewards, gambling, shops, and auctions. See the [Economy Guide](Economy-Guide).

### 🎪 Fun & Entertainment
Engage your community with games, memes, jokes, trivia, and interactive commands.

### ⚒️ Powerful Moderation
Keep your server safe with comprehensive moderation tools including bans, kicks, mutes, strikes, and detailed moderation logs.

### 🎵 Music & Audio
Listen to high-quality music with DJ controls, audio filters (Nightcore, Bassboost), and lyrics support. See the [Music Guide](Music-Guide).

### 💻 Developer Tools
Execute code, test regex, format JSON, and make API requests directly from Discord with our secure developer suite. See [Developer Tools](Developer-Tools).

### 📊 Statistics & Points
Track server activity with SkynetPoints, leaderboards, ranks, and detailed server statistics.

### 🔍 Search & Media
Search Google, YouTube, Wikipedia, anime databases, and more directly from Discord.

### 🔦 Utility Tools
Calculators, translators, reminders, polls, giveaways, and much more!

### ⭐ Premium Features
Unlock advanced features for your server with premium subscriptions. See [Premium Features](Premium-Features).

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
		_id: "Commands-AI",
		content: generateCategoryPage(commands, "AI & Assistant 🤖"),
		reactions: [],
		updates: [{
			_id: "218536118591684613",
			timestamp: new Date(),
			diff: null,
		}],
	},
	{
		_id: "Commands-Economy",
		content: generateCategoryPage(commands, "Economy 💰"),
		reactions: [],
		updates: [{
			_id: "218536118591684613",
			timestamp: new Date(),
			diff: null,
		}],
	},
	{
		_id: "AI-Guide",
		content: `# AI Assistant Guide

SkynetBot features a powerful AI assistant with multi-provider LLM support, conversation memory, and advanced configuration options.

## Overview

The AI system provides:
- **Multi-Provider Support**: OpenAI (GPT-4, GPT-4o), Anthropic (Claude), Groq (Llama, Mixtral), Ollama (local models)
- **Conversation Memory**: Remembers context within conversations
- **Web Search**: Integrated web search for up-to-date information
- **Rate Limiting**: Configurable cooldowns to prevent abuse
- **Usage Tracking**: Monitor token usage and costs
- **Budget Controls**: Set daily limits per user or server
- **Custom Personalities**: Configure custom system prompts

---

## Commands

| Command | Description |
|---------|-------------|
| \`!ai ask <message>\` | Chat with the AI assistant |
| \`!ai stream <message>\` | Chat with streaming response |
| \`!ai clear\` | Clear your conversation memory |
| \`!ai search <query>\` | Search the web using AI |
| \`!ai variables\` | Show available template variables |
| \`!ai stats\` | View usage statistics (admin) |

### Basic Usage

Simply ask the AI anything:
\`\`\`
!ai ask What is the capital of France?
!ai ask Explain quantum computing in simple terms
!ai ask Write a haiku about Discord
\`\`\`

### Streaming Responses

For longer responses, use streaming to see the response as it's generated:
\`\`\`
!ai stream Tell me a story about a brave knight
\`\`\`

### Web Search

Search the web for current information:
\`\`\`
!ai search Latest news about artificial intelligence
!ai search Weather in New York today
\`\`\`

### Clearing Memory

Clear your conversation history to start fresh:
\`\`\`
!ai clear
\`\`\`

---

## Template Variables

Use these variables in your messages for dynamic content:

| Variable | Description |
|----------|-------------|
| \`{{user}}\` | Your username |
| \`{{user.id}}\` | Your Discord user ID |
| \`{{user.mention}}\` | Mentions you in the response |
| \`{{channel}}\` | Current channel name |
| \`{{server}}\` | Server name |
| \`{{date}}\` | Current date |
| \`{{time}}\` | Current time |
| \`{{datetime}}\` | Current date and time |

Example:
\`\`\`
!ai ask Hello {{user}}, what time is it in {{channel}}?
\`\`\`

---

## Supported Providers

### OpenAI
- **Models**: GPT-4o, GPT-4o-mini, GPT-4, GPT-3.5-turbo
- **Best for**: General-purpose tasks, coding, creative writing
- **Requires**: API key

### Anthropic (Claude)
- **Models**: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku
- **Best for**: Long-form content, analysis, nuanced conversations
- **Requires**: API key

### Groq
- **Models**: Llama 3.1, Mixtral
- **Best for**: Fast responses, open-source models
- **Requires**: API key

### Ollama
- **Models**: Any locally hosted model
- **Best for**: Privacy-focused, offline use, custom models
- **Requires**: Local Ollama installation

---

## Server Configuration (Admins)

Server administrators can configure the AI system through the web dashboard:

### Dashboard → AI Settings
- **Provider & Model**: Choose default provider and model
- **System Prompt**: Customize the AI's personality
- **Rate Limits**: Set cooldowns and usage limits

### Dashboard → AI Governance
- **Model Policy**: Allow or deny specific models
- **Tool Access**: Control which AI tools are available
- **Budget Limits**: Set daily token/cost limits

### Dashboard → AI Memory
- **History Limit**: How many messages to remember
- **Per-User Memory**: Enable individual memory per user

### Dashboard → AI Personality
- **System Prompt**: Define the AI's character and behavior
- **Response Style**: Configure how the AI responds

---

## Rate Limits

To prevent abuse, the AI system has built-in rate limiting:

- **Cooldown**: Minimum time between requests (default: 5 seconds)
- **Per-User Limit**: Maximum requests per user per day
- **Per-Channel Limit**: Maximum requests per channel per hour
- **Token Budget**: Maximum tokens per user/server per day

Administrators can adjust these limits in the dashboard.

---

## Best Practices

### For Users
1. **Be specific**: Clear questions get better answers
2. **Provide context**: Include relevant background information
3. **Use streaming**: For long responses, use \`!ai stream\`
4. **Clear when needed**: Use \`!ai clear\` if the AI seems confused

### For Administrators
1. **Set reasonable limits**: Balance accessibility with abuse prevention
2. **Monitor usage**: Check \`!ai stats\` regularly
3. **Customize personality**: Tailor the AI to your server's needs
4. **Use governance**: Restrict expensive models if needed

---

## Troubleshooting

### "Rate limited"
You're sending requests too quickly. Wait for the cooldown period.

### "Budget exceeded"
You've reached your daily token limit. Wait until tomorrow or ask an admin to increase limits.

### "Provider error"
The AI provider is experiencing issues. Try again later or contact an admin.

### "Model not available"
The requested model is not configured or has been restricted by administrators.

---

See also: [Commands](Commands) | [Server Owner Guide](Server-Owner-Guide) | [FAQ](FAQ)
`,
		reactions: [],
		updates: [{
			_id: "218536118591684613",
			timestamp: new Date(),
			diff: null,
		}],
	},
	{
		_id: "Economy-Guide",
		content: `# Economy System Guide

SkynetBot features a full virtual economy system where members can earn, spend, trade, and gamble coins.

## Overview

The economy system provides:
- **Wallet & Bank**: Secure your coins in your bank
- **Daily Rewards**: Claim daily coins with streak bonuses
- **Trading**: Send coins to other users
- **Gambling**: Test your luck with various games
- **Shop System**: Buy items from the server shop
- **Auctions**: Sell items to other players

---

## Commands

### Balance & Banking

| Command | Description |
|---------|-------------|
| \`!balance\` | Check your wallet and bank balance |
| \`!deposit <amount>\` | Deposit coins into your bank |
| \`!withdraw <amount>\` | Withdraw coins from your bank |
| \`!daily\` | Claim your daily coin reward |

### Trading

| Command | Description |
|---------|-------------|
| \`!give @user <amount>\` | Send coins to another user |

### Gambling

| Command | Description |
|---------|-------------|
| \`!gamble <amount>\` | Gamble coins for a chance to win |
| \`!slots <amount>\` | Play the slot machine |
| \`!rob @user\` | Attempt to steal from another user |

### Shopping

| Command | Description |
|---------|-------------|
| \`!shop\` | Browse the server shop |
| \`!shop buy <item_id>\` | Purchase an item |
| \`!inventory\` | View your purchased items |

### Auctions

| Command | Description |
|---------|-------------|
| \`!auction\` | View active auctions |
| \`!auction start <item> \\| <price>\` | Start an auction |
| \`!auction bid <id> \\| <amount>\` | Place a bid |
| \`!auction cancel <id>\` | Cancel your auction |

---

## Getting Started

### Step 1: Claim Your Daily Reward
Start earning by claiming your daily reward:
\`\`\`
!daily
\`\`\`

Daily rewards include streak bonuses - claim every day to maximize earnings!

### Step 2: Check Your Balance
View your current balance:
\`\`\`
!balance
\`\`\`

Your coins are split between:
- **Wallet**: Readily available but can be stolen
- **Bank**: Safe from theft but needs withdrawal to use

### Step 3: Secure Your Coins
Deposit coins to your bank for safekeeping:
\`\`\`
!deposit 500
!deposit all
\`\`\`

---

## Wallet vs Bank

| Feature | Wallet | Bank |
|---------|--------|------|
| Spending | Immediate | Must withdraw first |
| Rob Protection | Vulnerable | Safe |
| Gambling | Direct use | Must withdraw |
| Receiving | Goes here | N/A |

**Pro Tip**: Keep most coins in your bank and only withdraw what you need!

---

## Earning Coins

### Daily Rewards
- Base reward: Configured by server
- Streak bonus: Increases with consecutive daily claims
- Broken streak: Missing a day resets your bonus

### Gambling (Risk!)
- **Gamble**: ~45% chance to double your bet
- **Slots**: Various payouts based on matching symbols
- **Rob**: Steal from others (but risk getting caught!)

### Trading
- Receive coins from other users via \`!give\`
- Sell items through auctions

---

## Gambling Guide

### Gamble Command
\`\`\`
!gamble 100
!gamble all
\`\`\`
- ~45% chance to win double
- ~55% chance to lose your bet

### Slots Command
\`\`\`
!slots 50
\`\`\`
Payouts:
| Result | Payout |
|--------|--------|
| 🍒🍒🍒 | 3x |
| 🍋🍋🍋 | 5x |
| 🍊🍊🍊 | 10x |
| 💎💎💎 | 50x |
| 7️⃣7️⃣7️⃣ | 100x |

### Rob Command
\`\`\`
!rob @user
\`\`\`
- Success: Steal a portion of their wallet
- Failure: Pay a fine and go on cooldown
- Target needs coins in their wallet

---

## Shop System

### Browsing the Shop
\`\`\`
!shop
\`\`\`

View available items with their prices and descriptions.

### Purchasing Items
\`\`\`
!shop buy <item_id>
\`\`\`

### Viewing Inventory
\`\`\`
!inventory
\`\`\`

See all items you've purchased.

---

## Auction System

### Creating an Auction
\`\`\`
!auction start <item_id> | <starting_price>
\`\`\`

### Bidding
\`\`\`
!auction bid <auction_id> | <amount>
\`\`\`

### Auction Rules
- Bids must be higher than current price
- Auctions last for a set duration
- Winner pays their bid amount
- Seller receives payment minus fees

---

## Server Configuration (Admins)

Administrators can configure the economy through the dashboard:

### Dashboard → Economy
- **Starting Balance**: Initial coins for new users
- **Daily Reward**: Base daily claim amount
- **Streak Multiplier**: Bonus for consecutive claims

### Dashboard → Economy Stats
- View server-wide economy statistics
- Monitor wealth distribution
- Track gambling activity

---

## Tips & Strategies

1. **Claim daily**: Never miss your daily reward for streak bonuses
2. **Bank your coins**: Protect savings from robbers
3. **Gamble responsibly**: Set limits for yourself
4. **Check auctions**: Find deals on valuable items
5. **Rob wisely**: Only target users with wallet coins

---

## Troubleshooting

### "Insufficient funds"
You don't have enough coins in your wallet. Try withdrawing from your bank.

### "User has no coins"
The target user has no coins in their wallet to steal.

### "On cooldown"
Wait for the cooldown period before using that command again.

### "Item not found"
The item ID doesn't exist. Check \`!shop\` for valid IDs.

---

See also: [Commands](Commands) | [FAQ](FAQ)
`,
		reactions: [],
		updates: [{
			_id: "218536118591684613",
			timestamp: new Date(),
			diff: null,
		}],
	},
	{
		_id: "Premium-Features",
		content: `# Premium Features

Unlock advanced features for your Discord server with SkynetBot Premium subscriptions.

## Overview

SkynetBot Premium provides server-level subscriptions that unlock enhanced features for your entire community. Premium subscriptions are **per-server**, meaning you subscribe for a specific server rather than your personal account.

---

## Subscription Tiers

Premium is available in multiple tiers, each offering different levels of features:

### Free Tier
- All basic commands
- Standard rate limits
- Basic moderation tools
- Community extensions

### Premium Tiers
Premium tiers (configured by the bot operator) typically include:
- **Increased Limits**: Higher rate limits and quotas
- **Advanced AI**: Access to more powerful AI models
- **Priority Support**: Faster response times
- **Exclusive Commands**: Premium-only features (Music, Dev Tools)
- **Extended Storage**: More extension storage
- **Custom Branding**: Remove bot branding

*Specific tier benefits vary by instance configuration.*

---

## How to Subscribe

### Step 1: Visit the Membership Page
Navigate to the bot's website and click on "Membership" or "Premium".

### Step 2: Login with Discord
Authenticate with your Discord account to see your eligible servers.

### Step 3: Select Your Server
Choose the server you want to upgrade. You must have **Manage Server** permission.

### Step 4: Choose a Plan
Select your preferred tier and billing period:
- **Monthly**: Flexible, cancel anytime
- **Yearly**: Save with annual billing (discount varies)

### Step 5: Complete Payment
Pay securely via:
- **Stripe**: Credit/debit cards
- **BTCPay**: Bitcoin and cryptocurrency

---

## Managing Your Subscription

### Viewing Status
Check your server's subscription status in:
- The web dashboard (Dashboard → Subscription)
- The membership page with your server selected

### Upgrading/Downgrading
You can change your tier at any time:
1. Visit the membership page
2. Select your server
3. Choose a new tier
4. Confirm the change

### Cancellation
To cancel your subscription:
1. Visit the membership page
2. Select your subscribed server
3. Click "Manage Subscription"
4. Select "Cancel"

*You'll retain premium features until the end of your billing period.*

---

## Server-Based Subscriptions

### Why Per-Server?
Premium subscriptions apply to **servers**, not users, because:
- All server members benefit from the features
- Admins can fund server improvements
- Features like AI limits apply server-wide

### Transferring Subscriptions
Subscriptions are tied to the server ID and cannot be transferred. If you need to change servers, cancel and resubscribe to the new server.

### Multiple Servers
To have premium on multiple servers, you need separate subscriptions for each.

---

## Premium Features in Detail

### Enhanced AI Access
Premium servers may get:
- Access to advanced models (GPT-4, Claude 3 Opus)
- Higher daily token limits
- Longer conversation memory
- Priority response times

### Music System (Tier 2)
- High-quality playback
- DJ controls and audio filters
- Queue management and lyrics

### Developer Tools (Tier 2)
- Code execution sandbox (JavaScript)
- API testing tools (HTTP)
- Regex and JSON utilities
- Code formatting and linting

### Ticket System (Tier 2)
- Custom support ticket panels
- Transcript logging
- Staff management tools

### Increased Rate Limits
- More commands per minute
- Reduced cooldowns
- Higher API quotas

### Extended Storage
- More extension storage space
- Larger file uploads
- Extended log retention

### Priority Support
- Faster issue resolution
- Direct support channels
- Feature request priority

---

## Payment Methods

### Credit/Debit Cards (Stripe)
- Visa, Mastercard, American Express
- Secure processing via Stripe
- Automatic renewal

### Cryptocurrency (BTCPay)
- Bitcoin (BTC)
- Lightning Network
- Other cryptocurrencies (varies by configuration)

---

## Billing FAQ

### When am I charged?
- **Monthly**: Every 30 days from subscription start
- **Yearly**: Every 365 days from subscription start

### What if my payment fails?
You'll receive an email notification. Premium features remain active for a grace period while you update payment details.

### Can I get a refund?
Refund policies vary. Contact the bot operator for assistance.

### Is my payment information secure?
Yes. All payments are processed by Stripe or BTCPay. We never store your card details.

---

## Troubleshooting

### "Server not showing"
- Ensure the bot is in the server
- Verify you have Manage Server permission
- Try logging out and back in

### "Payment failed"
- Check your card details
- Ensure sufficient funds
- Try a different payment method

### "Features not unlocked"
- Wait a few minutes for sync
- Try \`!debug\` to check subscription status
- Contact support if issues persist

---

## Support

For subscription issues:
1. Check this guide and [FAQ](FAQ)
2. Join the support server
3. Contact an administrator

---

See also: [Getting Started](Getting-Started) | [Server Owner Guide](Server-Owner-Guide) | [FAQ](FAQ)
`,
		reactions: [],
		updates: [{
			_id: "218536118591684613",
			timestamp: new Date(),
			diff: null,
		}],
	},
	{
		_id: "Ticket-System",
		content: `# Ticket System

Create a professional support ticket system for your Discord server with custom categories, panels, and transcript logging.

**Requires:** Tier 2 Premium

---

## Overview

The ticket system allows server owners to set up an internal support system where users can create tickets for help, reports, or other inquiries. Staff members can manage, claim, and close tickets with full transcript logging.

### Key Features
- **Custom Categories** - Organize tickets by type (support, reports, applications)
- **Ticket Panels** - Embed messages with buttons for easy ticket creation
- **Support Roles** - Configure which roles can manage tickets
- **Transcripts** - Automatic logging when tickets are closed
- **Staff Management** - Claim tickets, add/remove users, set priority
- **Dashboard Integration** - Full management from the web dashboard

---

## Commands

| Command | Usage | Description |
|---------|-------|-------------|
| \`ticket\` | \`ticket [category] [subject]\` | Create a new ticket or view your tickets |
| \`ticketclose\` | \`ticketclose [reason]\` | Close the current ticket channel |
| \`ticketadd\` | \`ticketadd @user\` | Add a user to the current ticket |
| \`ticketremove\` | \`ticketremove @user\` | Remove a user from the current ticket |
| \`ticketpanel\` | \`ticketpanel [title] \\| [description]\` | Create a ticket panel (Admin) |

---

## Setup Guide

### Step 1: Enable the System
1. Go to your server dashboard
2. Navigate to **Tickets** → **Settings**
3. Toggle **Enable Ticket System** on

### Step 2: Configure Channels
- **Ticket Category** - Discord category for ticket channels
- **Transcript Channel** - Where transcripts are saved
- **Log Channel** - For ticket event notifications

### Step 3: Set Support Roles
Select roles that can:
- View all tickets
- Claim and manage tickets
- Add/remove users

### Step 4: Create Categories
Add categories to organize tickets:
- Name and emoji
- Description
- Custom welcome message

### Step 5: Create a Panel
\`\`\`
!ticketpanel Support Center | Click a button to create a ticket!
\`\`\`

---

## Managing Tickets

### From Discord
- Use button interactions in ticket channels
- **Close** - Close and save transcript
- **Claim** - Assign yourself as handler

### From Dashboard
Access **Dashboard → Tickets** to:
- View all tickets with filters
- Change status and priority
- Add internal notes
- View message history

---

## Ticket Status Flow

| Status | Description |
|--------|-------------|
| **Open** | New ticket, awaiting staff |
| **In Progress** | Staff actively working |
| **On Hold** | Waiting for user response |
| **Closed** | Resolved, transcript saved |

---

## Tips & Best Practices

1. **Clear Categories** - Create distinct types to route efficiently
2. **Welcome Messages** - Include FAQ links and expectations
3. **Transcript Channel** - Keep it staff-only for privacy
4. **Max Tickets** - Limit per user to prevent abuse (default: 3)

---

## Troubleshooting

### Tickets not creating
- Check bot has \`Manage Channels\` permission
- Verify category has room (limit: 50 channels)
- Ensure system is enabled

### Users can't see tickets
- Bot needs \`Manage Roles\` permission
- Check Discord role hierarchy

### Transcripts not saving
- Verify channel is configured
- Bot needs \`Send Messages\` permission

---

See also: [Premium Features](Premium-Features) | [Server Owner Guide](Server-Owner-Guide) | [Commands](Commands)
`,
		reactions: [],
		updates: [{
			_id: "218536118591684613",
			timestamp: new Date(),
			diff: null,
		}],
	},
	{
		_id: "Music-Guide",
		content: \`# Music System Guide

High-quality music playback for your server with DJ controls and audio filters.

**Requires:** Tier 2 Premium

---

## Overview

The music system allows you to play audio from YouTube and other supported sources directly in your voice channel. It features a robust queue system, DJ controls, and fun audio filters.

## Commands

| Command | Description |
|---------|-------------|
| \`!play <query/url>\` | Play a song or add to queue |
| \`!skip\` | Skip the current track |
| \`!queue\` | View the current music queue |
| \`!dj\` | Access DJ controls (pause, stop, volume, loop) |
| \`!filters\` | Apply audio filters (Bassboost, Nightcore, etc.) |
| \`!lyrics\` | Get lyrics for the current song |

## DJ Controls

The \`!dj\` command opens a control panel with buttons for:
- ⏯️ Pause/Resume
- ⏹️ Stop & Clear
- 🔊 Volume Control
- 🔁 Loop Mode (Track/Queue/Off)
- 🔀 Shuffle Queue

## Audio Filters

Enhance your listening experience with real-time audio filters:
- **Bassboost** - Boost the low end
- **Nightcore** - Speed up and raise pitch
- **Vaporwave** - Slow down and lower pitch
- **8D** - Simulate 8D audio surround sound

Use \`!filters\` to toggle these effects.

---

See also: [Premium Features](Premium-Features) | [Commands](Commands)
\`,
		reactions: [],
		updates: [{
			_id: "218536118591684613",
			timestamp: new Date(),
			diff: null,
		}],
	},
	{
		_id: "Developer-Tools",
		content: \`# Developer Tools

A suite of advanced utilities for developers, including a JavaScript sandbox, code formatting, and API testing tools.

**Requires:** Tier 2 Premium

---

## Code Execution

### \`!coderun\`
Execute JavaScript code in a secure, sandboxed environment.
- **Timeout:** 3 seconds
- **Environment:** Node.js-like (no file/network access)
- **Usage:** \`!coderun console.log("Hello World");\`

### \`!lint\`
Analyze your JavaScript code for syntax errors and potential issues.

### \`!codeformat\`
Automatically format and beautify your code snippets.

---

## Utilities

### \`!http\`
Make HTTP requests to external APIs directly from Discord.
- Supports GET and POST
- Rate limited (10/min)
- Restricted from accessing private IP ranges

### \`!regex\`
Test and explain Regular Expressions.
- \`!regextest\` - Test a pattern against a string
- \`!regexexplain\` - Get a human-readable explanation of a pattern

### \`!json\`
Tools for working with JSON data.
- \`!jsonpretty\` - Format minified JSON
- \`!jsonminify\` - Minify formatted JSON
- \`!jsonpath\` - Query JSON using JSONPath syntax

### \`!snippet\`
Save and manage your frequently used code snippets.
- Store snippets per-server or per-user
- Syntax highlighting support

---

See also: [Premium Features](Premium-Features) | [Commands](Commands)
\`,
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
| **Tickets** | Support ticket system management |

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

## Data Management

### Exporting Server Data
You can export your server's configuration and data:
1. Go to **Dashboard** → **Settings** → **Export Data**
2. Choose data types (Config, Members, Moderation, etc.)
3. Select format (JSON or CSV)
4. Download the archive

*Requires Tier 2 Premium.*

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

## Import & Export

Share your custom extensions with other servers or back them up.

### Exporting
1. Go to **My Extensions** in the dashboard
2. Click the **Export** button on any extension
3. Download the \`.skypkg\` file

### Importing
1. Go to **My Extensions**
2. Click **Import Extension**
3. Upload a \`.skypkg\` file
4. Review the code and install

*Note: You can only export extensions you own or that are published.*

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
		content: `# Extension Development Guide

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

\`\`\`javascript
const command = require("command");
const message = require("message");

// command.prefix - The server's command prefix
// command.suffix - Everything after the command name
// command.key - The command trigger word

message.reply(\`You said: \${command.suffix}\`);
\`\`\`

### Keyword Extensions

Triggered when specific keywords appear in messages.

\`\`\`javascript
const keyword = require("keyword");
const message = require("message");

// keyword.keywords - Array of trigger keywords

if (message.content.toLowerCase().includes("hello")) {
    message.reply("Hello there! 👋");
}
\`\`\`

### Event Extensions

Triggered by Discord events (member join, leave, message delete, etc.).

\`\`\`javascript
const event = require("event");
const guild = require("guild");

// Available events: guildMemberAdd, guildMemberRemove, messageDelete, etc.
console.log(\`Event triggered in \${guild.name}\`);
\`\`\`

### Timer Extensions

Run at specified intervals (minimum 5 minutes).

\`\`\`javascript
const guild = require("guild");
const bot = require("bot");

// Runs every X minutes as configured
console.log(\`Timer executed for \${guild.name}\`);
\`\`\`

---

## Available Modules

### Core Modules

| Module | Description | Scope Required |
|--------|-------------|----------------|
| \`message\` | The triggering message | None |
| \`channel\` | Channel information | \`channels_read\` |
| \`guild\` | Server information | \`guild_read\` |
| \`member\` | Message author as member | \`members_read\` |
| \`user\` / \`author\` | Message author as user | None |
| \`roles\` | Guild role information | \`roles_read\` |
| \`config\` | Server Skynet config | \`config\` |
| \`bot\` | Bot user information | None |
| \`command\` | Command data (command type) | None |
| \`keyword\` | Keyword data (keyword type) | None |
| \`event\` | Event data (event type) | None |
| \`extension\` | Extension metadata | None |
| \`utils\` | Utility functions | None |
| \`embed\` | Embed builder helper | None |

---

## API Reference

### Message Module

\`\`\`javascript
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
\`\`\`

### Member Module

\`\`\`javascript
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
\`\`\`

### User/Author Module

\`\`\`javascript
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
\`\`\`

### Guild Module

\`\`\`javascript
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
\`\`\`

### Channel Module

\`\`\`javascript
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
\`\`\`

### Roles Module

\`\`\`javascript
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
\`\`\`

### Utils Module

The utils module provides extensive helper functions organized by category.

#### Text Utilities

\`\`\`javascript
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
utils.text.escapeMarkdown("**bold**") // "\\\\*\\\\*bold\\\\*\\\\*"
\`\`\`

#### Random Utilities

\`\`\`javascript
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
\`\`\`

#### Math Utilities

\`\`\`javascript
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
\`\`\`

#### Array Utilities

\`\`\`javascript
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
\`\`\`

#### Format Utilities

\`\`\`javascript
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
\`\`\`

#### Time Utilities

\`\`\`javascript
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
\`\`\`

#### Discord Utilities

\`\`\`javascript
const utils = require("utils");

utils.discord.userMention("123")    // "<@123>"
utils.discord.channelMention("123") // "<#123>"
utils.discord.roleMention("123")    // "<@&123>"
utils.discord.emoji("name", "123")  // "<:name:123>"
utils.discord.codeBlock("code", "js") // \\\`\\\`\\\`js\\ncode\\n\\\`\\\`\\\`
utils.discord.inlineCode("code")    // \\\`code\\\`
utils.discord.bold("text")          // "**text**"
utils.discord.italic("text")        // "*text*"
utils.discord.underline("text")     // "__text__"
utils.discord.strikethrough("text") // "~~text~~"
utils.discord.spoiler("text")       // "||text||"
utils.discord.quote("text")         // "> text"
utils.discord.blockQuote("text")    // ">>> text"
utils.discord.hyperlink("text", "url") // "[text](url)"
utils.discord.snowflakeToTimestamp("123456789") // Creation time
\`\`\`

### Embed Module

\`\`\`javascript
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
\`\`\`

### Extension Module

\`\`\`javascript
const extension = require("extension");

// Extension metadata
extension.name          // Extension name
extension.version       // Version string
extension.type          // "command", "keyword", "event", "timer"
\`\`\`

### Bot Module

\`\`\`javascript
const bot = require("bot");

bot.user.id             // Bot's user ID
bot.user.username       // Bot's username
bot.user.tag            // Bot's tag
bot.prefix              // Server's command prefix
\`\`\`

### Config Module

\`\`\`javascript
const config = require("config"); // Requires config scope

// Access server Skynet configuration
config.command_prefix   // Command prefix
config.name_display     // Name display setting
// ... other config options
\`\`\`

---

## Scopes & Permissions

Extensions must declare which scopes they need. Users installing the extension will see what permissions it requires.

| Scope | Permission | Description |
|-------|------------|-------------|
| \`ban\` | Ban members | Can ban members from the guild |
| \`kick\` | Kick members | Can kick members from the guild |
| \`roles_read\` | Read roles | Can access guild role information |
| \`roles_manage\` | Manage roles | Can assign/remove roles from members |
| \`channels_read\` | Read channels | Can access channel information |
| \`channels_manage\` | Manage channels | Can modify channels, pin messages |
| \`guild_read\` | Read guild | Can access guild settings and info |
| \`guild_manage\` | Manage guild | Can modify guild settings |
| \`members_read\` | Read members | Can access member information |
| \`members_manage\` | Manage members | Can manage members (nicknames, etc.) |
| \`messages_read\` | Read messages | Can read message history |
| \`messages_global\` | Global messages | Can read messages in all channels |
| \`messages_write\` | Send messages | Can send messages in all channels |
| \`messages_manage\` | Manage messages | Can delete messages |
| \`config\` | Read config | Can read Skynet configuration |

---

## Best Practices

### 1. Error Handling

Always wrap potentially failing code in try-catch:

\`\`\`javascript
try {
    const member = require("member");
    // Use member...
} catch (err) {
    console.log("Error:", err.message);
    message.reply("Something went wrong!");
}
\`\`\`

### 2. Check Before Acting

Verify conditions before performing actions:

\`\`\`javascript
const member = require("member");

if (!member.manageable) {
    message.reply("I cannot manage this member!");
    return;
}

// Safe to proceed...
\`\`\`

### 3. Use Appropriate Scopes

Only request scopes your extension actually needs. Users are more likely to install extensions with minimal permissions.

### 4. Respect Rate Limits

Don't spam messages or actions. The sandbox has built-in limits but be considerate.

### 5. Handle Missing Data

Always check if data exists before using it:

\`\`\`javascript
const member = require("member");

const nickname = member.nickname || member.user.username;
const joinDate = member.joinedTimestamp 
    ? new Date(member.joinedTimestamp).toLocaleDateString()
    : "Unknown";
\`\`\`

### 6. Use Storage Wisely

Extension storage is limited to 25KB. Store only essential data:

\`\`\`javascript
// Good: Store minimal data
extension.storage.write("scores", { user1: 100, user2: 50 });

// Bad: Store large objects
extension.storage.write("history", hugeArrayOfMessages); // May fail!
\`\`\`

---

## Examples

### Simple Greeting Command

\`\`\`javascript
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
\`\`\`

### User Info Command

\`\`\`javascript
const message = require("message");
const member = require("member");
const embed = require("embed");
const utils = require("utils");

const targetUser = member.user;
const joinDate = utils.time.discord(member.joinedTimestamp, "D");
const accountAge = utils.time.relative(targetUser.createdTimestamp);

const infoEmbed = embed.create({
    title: \`\${targetUser.displayName}'s Info\`,
    color: embed.colors.BLUE,
    thumbnail: { url: member.avatarURL },
    fields: [
        { name: "Username", value: targetUser.tag, inline: true },
        { name: "ID", value: targetUser.id, inline: true },
        { name: "Joined Server", value: joinDate, inline: false },
        { name: "Account Age", value: accountAge, inline: true },
        { name: "Roles", value: \`\${member.roles.length} roles\`, inline: true },
        { name: "Is Bot", value: targetUser.bot ? "Yes" : "No", inline: true }
    ],
    footer: { text: \`Requested by \${message.author.tag}\` }
});

message.reply({ embeds: [infoEmbed] });
\`\`\`

### Dice Rolling Command

\`\`\`javascript
const command = require("command");
const message = require("message");
const utils = require("utils");
const embed = require("embed");

const notation = command.suffix.trim() || "1d6";
const result = utils.random.dice(notation);

if (result.rolls.length === 0) {
    message.reply("Invalid dice notation! Use format like \\\`2d6\\\` or \\\`1d20+5\\\`");
} else {
    const rollEmbed = embed.create({
        title: "🎲 Dice Roll",
        color: embed.colors.GOLD,
        fields: [
            { name: "Notation", value: \`\\\`\${notation}\\\`\`, inline: true },
            { name: "Rolls", value: result.rolls.join(", "), inline: true },
            { name: "Total", value: \`**\${result.total}**\`, inline: true }
        ]
    });
    message.reply({ embeds: [rollEmbed] });
}
\`\`\`

### Welcome Message Event

\`\`\`javascript
// Event type: guildMemberAdd
const event = require("event");
const guild = require("guild");
const utils = require("utils");
const embed = require("embed");

const member = event.member;
const welcomeEmbed = embed.create({
    title: "Welcome! 🎉",
    description: \`Welcome to **\${guild.name}**, \${utils.discord.userMention(member.id)}!\`,
    color: embed.colors.GREEN,
    thumbnail: { url: member.avatarURL },
    fields: [
        { name: "Member #", value: \`\${guild.memberCount}\`, inline: true },
        { name: "Account Created", value: utils.time.relative(member.user.createdTimestamp), inline: true }
    ],
    footer: { text: "Enjoy your stay!" },
    timestamp: new Date().toISOString()
});

// Note: You'll need to send this to a specific channel configured in your extension
\`\`\`

### Leaderboard with Storage

\`\`\`javascript
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
    .map((entry, i) => \`\${utils.format.ordinal(i + 1)} - \${utils.discord.userMention(entry[0])}: **\${entry[1]}** points\`)
    .join("\\n");

const lbEmbed = embed.create({
    title: "🏆 Leaderboard",
    description: leaderboard || "No scores yet!",
    color: embed.colors.GOLD,
    footer: { text: \`Your score: \${scores[userId]} points\` }
});

message.reply({ embeds: [lbEmbed] });
\`\`\`

---

## Limitations

1. **Execution Timeout**: Extensions have a maximum execution time (default 5 seconds)
2. **Memory Limit**: Isolated VM has 128MB memory limit
3. **Storage Limit**: 25KB per extension per server
4. **No External Requests**: \`fetch\`, \`rss\`, and \`xmlparser\` modules are not available in isolated-vm
5. **No File System Access**: Extensions cannot read/write files
6. **Rate Limits**: Discord's rate limits still apply

---

## Troubleshooting

### "MISSING_SCOPES" Error

Your extension is trying to access a module that requires a scope you haven't declared. Add the required scope to your extension settings.

### "UNKNOWN_MODULE" Error

You're trying to require a module that doesn't exist or isn't available for your extension type (e.g., \`command\` module in an event extension).

### Extension Not Running

- Check that the extension is enabled for the server
- Verify the trigger (command key, keyword, event type) is correct
- Check the extension status in the dashboard for error messages

### Storage Issues

- Ensure you're not exceeding the 25KB limit
- Use \`JSON.stringify()\` for complex objects
- Clear old data with \`extension.storage.clear()\` if needed

---

*Last Updated: December 2024*
*Extension API Version: 2.0*

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

## AI Assistant

### How do I use the AI?
\`\`\`
!ai ask <your question>
!ai stream <your question>
\`\`\`
See [AI Guide](AI-Guide) for full documentation.

### What AI providers are supported?
- OpenAI (GPT-4, GPT-4o)
- Anthropic (Claude)
- Groq (Llama, Mixtral)
- Ollama (local models)

### Why is the AI not responding?
- You may be rate limited (wait for cooldown)
- You may have exceeded your daily token budget
- The AI provider may be unavailable
- AI may not be configured on this server

### How do I clear my AI conversation?
\`\`\`
!ai clear
\`\`\`

### Can I search the web with AI?
Yes! Use \`!ai search <query>\` to search the web.

---

## Economy System

### How do I get coins?
\`\`\`
!daily
\`\`\`
Claim daily rewards with streak bonuses. You can also win coins through gambling or receive them from other users.

### What's the difference between wallet and bank?
- **Wallet**: Ready to use, but can be robbed
- **Bank**: Safe from theft, must withdraw to use

### How do I protect my coins?
\`\`\`
!deposit all
\`\`\`
Keep your coins in the bank where they can't be stolen.

### How do I gamble?
\`\`\`
!gamble <amount>
!slots <amount>
\`\`\`
Warning: Gambling is risky! You can lose your bet.

### How do I buy items?
\`\`\`
!shop
!shop buy <item_id>
\`\`\`

See [Economy Guide](Economy-Guide) for full documentation.

---

## Premium & Subscriptions

### What is Premium?
Server-level subscriptions that unlock advanced features. See [Premium Features](Premium-Features).

### How do I subscribe?
1. Visit the membership page on the bot website
2. Login with Discord
3. Select your server
4. Choose a tier and pay

### Is Premium per-user or per-server?
**Per-server**. When you subscribe, all members of that server benefit from the features.

### What payment methods are accepted?
- Credit/Debit cards (via Stripe)
- Bitcoin/Cryptocurrency (via BTCPay)

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

### Can I share extensions between instances?
Yes! Use the Export/Import feature:
- Export: Download a \`.skypkg\` file from the extension page
- Import: Upload the package in "My Extensions"

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
- [AI & Assistant Commands](Commands-AI)
- [Economy Commands](Commands-Economy)
- [Fun Commands](Commands-Fun)
- [Moderation Commands](Commands-Moderation)
- [Search & Media Commands](Commands-Search)
- [Stats & Points Commands](Commands-Stats)
- [Utility Commands](Commands-Utility)

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
		
		if (existingCount > 0 && !process.argv.includes("--force")) {
			console.log("\n⚠️  Wiki already has content.");
			console.log("   Run with --force to overwrite existing pages.");
			console.log("\n❌ Aborting. Use --force to overwrite.");
			process.exit(0);
			return;
		}
		
		// Upsert wiki pages (delete then insert each one)
		console.log(`📝 Upserting ${wikiPages.length} wiki pages...\n`);
		
		for (const page of wikiPages) {
			// Delete existing page first
			await Wiki.delete({ _id: page._id });
			// Then insert new one
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
