# AI Module

LLM-powered AI assistant functionality for SkynetBot, ported from the SkynetV2 Python cog with Node.js adaptations.

## Features

- **Multi-Provider Support**: OpenAI, Anthropic (Claude), Groq, Ollama, and OpenAI-compatible APIs
- **Conversation Memory**: Per-channel and per-user conversation history
- **Rate Limiting**: Configurable cooldowns and per-user/channel limits
- **Usage Tracking**: Token usage, cost estimation, and statistics
- **Budget Controls**: Daily token/cost limits per user and per guild
- **Governance**: Model allow/deny lists, tool access control
- **Web Search**: Integrated web search tool

## Commands

| Command | Description |
|---------|-------------|
| `ai ask <message>` | Chat with the AI |
| `ai stream <message>` | Chat with streaming response |
| `ai clear` | Clear conversation memory |
| `ai search <query>` | Search the web |
| `ai variables` | Show available template variables |
| `ai stats` | View usage statistics (admin) |

## Configuration

### Global Configuration (config.json)

```json
{
  "ai": {
    "defaultProvider": "openai",
    "defaultModel": {
      "name": "gpt-4o-mini",
      "provider": "openai"
    },
    "providers": {
      "openai": {
        "apiKey": "sk-..."
      },
      "anthropic": {
        "apiKey": "sk-ant-..."
      },
      "groq": {
        "apiKey": "gsk_..."
      },
      "ollama": {
        "baseUrl": "http://localhost:11434"
      }
    }
  }
}
```

### Per-Server Configuration

Each server can override the global configuration with:

- Custom model selection
- Rate limits (cooldown, per-user, per-channel)
- Memory settings (history limit, per-user memory)
- Governance (tool allow/deny, budget limits)
- Model policy (allow/deny specific models)

## Supported Providers

| Provider | Models | API Key Required |
|----------|--------|------------------|
| OpenAI | GPT-4o, GPT-4o-mini, GPT-4, GPT-3.5-turbo | Yes |
| Anthropic | Claude 3.5 Sonnet, Claude 3 Opus/Sonnet/Haiku | Yes |
| Groq | Llama 3.1, Mixtral | Yes |
| Ollama | Any local model | No (local) |
| OpenAI-Compatible | Any compatible API | Varies |

## Template Variables

Use these in your messages:

- `{{user}}` - Your username
- `{{user.id}}` - Your user ID
- `{{user.mention}}` - Mentions you
- `{{channel}}` - Current channel name
- `{{server}}` - Server ID
- `{{date}}` - Current date
- `{{time}}` - Current time
- `{{datetime}}` - Current date and time

## Architecture

```text
Modules/AI/
├── index.js              # Main entry point
├── AIManager.js          # Central manager
├── ConversationMemory.js # Memory system
├── RateLimiter.js        # Rate limiting
├── UsageTracker.js       # Usage statistics
├── providers/
│   ├── BaseProvider.js         # Abstract base class
│   ├── ProviderFactory.js      # Provider factory
│   ├── OpenAIProvider.js       # OpenAI implementation
│   ├── AnthropicProvider.js    # Anthropic implementation
│   ├── GroqProvider.js         # Groq implementation
│   ├── OllamaProvider.js       # Ollama implementation
│   └── OpenAICompatibleProvider.js # Generic OpenAI-compatible
└── tools/
    ├── ToolRegistry.js   # Tool management
    └── WebSearchTool.js  # Web search implementation
```

## Database Schema

The AI configuration is stored in `serverDocument.config.ai` with the following structure:

- `defaultProvider` - Default AI provider
- `model` - Model configuration (name, provider)
- `providers` - Provider-specific settings
- `systemPrompt` - Custom system prompt
- `rateLimits` - Rate limiting settings
- `memory` - Conversation memory settings
- `governance` - Access control and budgets
- `policy` - Model allow/deny lists
- `tools` - Tool-specific configuration
- `usage` - Usage tracking data

## Security Considerations

1. **API Keys**: Store API keys in environment variables or encrypted config
2. **Rate Limiting**: Enable rate limits to prevent abuse
3. **Budget Controls**: Set daily limits to control costs
4. **Model Policy**: Use allow/deny lists to restrict model access
5. **Tool Access**: Control which tools are available per server
