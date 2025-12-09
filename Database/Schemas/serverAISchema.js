/**
 * Server AI Configuration Schema
 * Stores AI-related settings for each server
 */

const Schema = require("../Schema");

module.exports = new Schema({
	// Default AI provider (openai, anthropic, groq, ollama, etc.)
	defaultProvider: {
		type: String,
		default: "openai",
	},
	// Model configuration
	model: new Schema({
		name: {
			type: String,
			default: "gpt-4o-mini",
		},
		provider: {
			type: String,
			default: "openai",
		},
	}),
	// Provider configurations (API keys stored encrypted or in env)
	providers: {
		type: Object,
		default: {},
	},
	// System prompt for AI conversations
	systemPrompt: {
		type: String,
		default: "You are a helpful AI assistant in a Discord server. Be concise, friendly, and helpful.",
		maxlength: 4000,
	},
	// Rate limiting configuration
	rateLimits: new Schema({
		cooldownSec: {
			type: Number,
			default: 10,
			min: 0,
			max: 300,
		},
		perUserPerMin: {
			type: Number,
			default: 6,
			min: 1,
			max: 60,
		},
		perChannelPerMin: {
			type: Number,
			default: 20,
			min: 1,
			max: 120,
		},
		toolsPerUserPerMin: {
			type: Number,
			default: 4,
			min: 1,
			max: 30,
		},
		toolsPerGuildPerMin: {
			type: Number,
			default: 30,
			min: 1,
			max: 200,
		},
	}),
	// Memory/conversation settings
	memory: new Schema({
		limit: {
			type: Number,
			default: 10,
			min: 1,
			max: 50,
		},
		perUserEnabled: {
			type: Boolean,
			default: false,
		},
		perUserLimit: {
			type: Number,
			default: 5,
			min: 1,
			max: 20,
		},
		mergeStrategy: {
			type: String,
			default: "append",
			enum: ["append", "interleave", "user_first"],
		},
	}),
	// Vector memory configuration (Qdrant)
	vectorMemory: new Schema({
		enabled: {
			type: Boolean,
			default: false,
		},
		// Qdrant connection settings
		url: {
			type: String,
			default: "",
		},
		apiKey: {
			type: String,
			default: "",
		},
		// Embedding settings
		embeddingModel: {
			type: String,
			default: "text-embedding-3-small",
		},
		vectorSize: {
			type: Number,
			default: 1536,
		},
		// Search settings
		searchLimit: {
			type: Number,
			default: 5,
			min: 1,
			max: 20,
		},
		scoreThreshold: {
			type: Number,
			default: 0.7,
			min: 0,
			max: 1,
		},
		// Storage settings
		storeMessages: {
			type: Boolean,
			default: true,
		},
		storeFacts: {
			type: Boolean,
			default: true,
		},
		// Context injection settings
		injectContext: {
			type: Boolean,
			default: true,
		},
		contextPrefix: {
			type: String,
			default: "Relevant context from memory:",
			maxlength: 200,
		},
		// Retention settings
		// Retention in days (0 = no auto-deletion)
		retentionDays: {
			type: Number,
			default: 0,
			min: 0,
			max: 365,
		},
	}),
	// Governance settings
	governance: new Schema({
		// Tool access control
		tools: new Schema({
			allow: [String],
			deny: [String],
			perUserMinuteOverrides: {
				type: Object,
				default: {},
			},
		}),
		// Bypass roles for rate limits
		bypass: new Schema({
			cooldownRoles: [String],
		}),
		// Budget limits
		budget: new Schema({
			perUserDailyTokens: {
				type: Number,
				default: 0,
				min: 0,
			},
			perGuild: new Schema({
				unit: {
					type: String,
					default: "tokens",
					enum: ["tokens", "usd"],
				},
				dailyTokens: {
					type: Number,
					default: 0,
					min: 0,
				},
				dailyUsd: {
					type: Number,
					default: 0,
					min: 0,
				},
			}),
		}),
	}),
	// Model policy (allow/deny lists)
	policy: new Schema({
		models: new Schema({
			allow: {
				type: Object,
				default: {},
			},
			deny: {
				type: Object,
				default: {},
			},
		}),
	}),
	// Tool-specific configurations
	tools: new Schema({
		websearch: new Schema({
			provider: {
				type: String,
				default: "duckduckgo",
				enum: ["duckduckgo", "serp"],
			},
			apiKey: String,
		}),
	}),
	// Usage tracking
	usage: new Schema({
		tokens: new Schema({
			prompt: {
				type: Number,
				default: 0,
			},
			completion: {
				type: Number,
				default: 0,
			},
			total: {
				type: Number,
				default: 0,
			},
		}),
		perUser: {
			type: Object,
			default: {},
		},
		perChannel: {
			type: Object,
			default: {},
		},
		cost: new Schema({
			usd: {
				type: Number,
				default: 0,
			},
		}),
		budget: new Schema({
			tokensDayStart: {
				type: Number,
				default: 0,
			},
			tokensDayTotal: {
				type: Number,
				default: 0,
			},
			costDayStart: {
				type: Number,
				default: 0,
			},
			costDayUsd: {
				type: Number,
				default: 0,
			},
		}),
	}),
	// Enabled channels (empty = all channels)
	enabledChannels: [String],
	// Disabled channels
	disabledChannels: [String],
});
