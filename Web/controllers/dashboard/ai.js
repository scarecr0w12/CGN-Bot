/**
 * AI Dashboard Controller
 * Handles AI configuration for each server
 */

const { saveAdminConsoleOptions: save, getChannelData, getRoleData } = require("../../helpers");

const controllers = module.exports;

/**
 * AI Settings - Main configuration page
 */
controllers.settings = async (req, { res }) => {
	const { svr } = req;
	const serverDocument = req.svr.document;
	await svr.fetchCollection("roles");
	await svr.fetchCollection("channels");

	// Get AI config with defaults
	const aiConfig = serverDocument.config.ai || {};

	res.setPageData({
		page: "admin-ai-settings.ejs",
		channelData: getChannelData(svr),
		roleData: getRoleData(svr),
		providers: [
			{ id: "openai", name: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"] },
			{ id: "anthropic", name: "Anthropic", models: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"] },
			{ id: "groq", name: "Groq", models: ["llama-3.1-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"] },
			{ id: "ollama", name: "Ollama (Local)", models: [] },
			{ id: "openai_compatible", name: "OpenAI Compatible", models: [] },
		],
	});

	res.setConfigData({
		ai: {
			defaultProvider: aiConfig.defaultProvider || "openai",
			model: aiConfig.model || { name: "gpt-4o-mini", provider: "openai" },
			systemPrompt: aiConfig.systemPrompt || "You are a helpful AI assistant in a Discord server. Be concise, friendly, and helpful.",
			providers: {
				openai: {
					apiKey: aiConfig.providers && aiConfig.providers.openai ? aiConfig.providers.openai.apiKey ? "••••••••" : "" : "",
					hasKey: !!(aiConfig.providers && aiConfig.providers.openai && aiConfig.providers.openai.apiKey),
				},
				anthropic: {
					apiKey: aiConfig.providers && aiConfig.providers.anthropic ? aiConfig.providers.anthropic.apiKey ? "••••••••" : "" : "",
					hasKey: !!(aiConfig.providers && aiConfig.providers.anthropic && aiConfig.providers.anthropic.apiKey),
				},
				groq: {
					apiKey: aiConfig.providers && aiConfig.providers.groq ? aiConfig.providers.groq.apiKey ? "••••••••" : "" : "",
					hasKey: !!(aiConfig.providers && aiConfig.providers.groq && aiConfig.providers.groq.apiKey),
				},
				ollama: {
					baseUrl: (aiConfig.providers && aiConfig.providers.ollama && aiConfig.providers.ollama.baseUrl) || "http://localhost:11434",
				},
				openai_compatible: {
					apiKey: aiConfig.providers && aiConfig.providers.openai_compatible ? aiConfig.providers.openai_compatible.apiKey ? "••••••••" : "" : "",
					baseUrl: (aiConfig.providers && aiConfig.providers.openai_compatible && aiConfig.providers.openai_compatible.baseUrl) || "",
					hasKey: !!(aiConfig.providers && aiConfig.providers.openai_compatible && aiConfig.providers.openai_compatible.apiKey),
				},
			},
			rateLimits: aiConfig.rateLimits || {
				cooldownSec: 10,
				perUserPerMin: 6,
				perChannelPerMin: 20,
			},
			memory: aiConfig.memory || {
				limit: 10,
				perUserEnabled: false,
				perUserLimit: 5,
			},
			enabledChannels: aiConfig.enabledChannels || [],
			disabledChannels: aiConfig.disabledChannels || [],
		},
	});

	res.render();
};

controllers.settings.post = async (req, res) => {
	const serverQueryDocument = req.svr.queryDocument;
	const serverDocument = req.svr.document;

	// Get existing AI config or create new one
	const existingAi = serverDocument.config.ai || {};
	const existingProviders = existingAi.providers || {};

	// Build providers object, preserving existing API keys if not changed
	const providers = {};

	// Handle OpenAI
	const openaiKey = req.body["providers-openai-apiKey"];
	providers.openai = {
		apiKey: openaiKey && openaiKey !== "••••••••" && openaiKey.trim() !== "" ?
			openaiKey.trim() :
			(existingProviders.openai && existingProviders.openai.apiKey) || "",
	};

	// Handle Anthropic
	const anthropicKey = req.body["providers-anthropic-apiKey"];
	providers.anthropic = {
		apiKey: anthropicKey && anthropicKey !== "••••••••" && anthropicKey.trim() !== "" ?
			anthropicKey.trim() :
			(existingProviders.anthropic && existingProviders.anthropic.apiKey) || "",
	};

	// Handle Groq
	const groqKey = req.body["providers-groq-apiKey"];
	providers.groq = {
		apiKey: groqKey && groqKey !== "••••••••" && groqKey.trim() !== "" ?
			groqKey.trim() :
			(existingProviders.groq && existingProviders.groq.apiKey) || "",
	};

	// Handle Ollama
	providers.ollama = {
		baseUrl: req.body["providers-ollama-baseUrl"] || "http://localhost:11434",
	};

	// Handle OpenAI Compatible
	const compatibleKey = req.body["providers-openai_compatible-apiKey"];
	providers.openai_compatible = {
		apiKey: compatibleKey && compatibleKey !== "••••••••" && compatibleKey.trim() !== "" ?
			compatibleKey.trim() :
			(existingProviders.openai_compatible && existingProviders.openai_compatible.apiKey) || "",
		baseUrl: req.body["providers-openai_compatible-baseUrl"] || "",
	};

	// Handle enabled/disabled channels
	const enabledChannels = [];
	const disabledChannels = [];
	await req.svr.fetchCollection("channels");

	req.svr.channels.forEach(ch => {
		if (ch.type === 0) {
			// GuildText
			if (req.body[`channel-enabled-${ch.id}`] === "on") {
				enabledChannels.push(ch.id);
			}
			if (req.body[`channel-disabled-${ch.id}`] === "on") {
				disabledChannels.push(ch.id);
			}
		}
	});

	// Build complete AI config object
	const aiConfig = {
		defaultProvider: req.body.defaultProvider || "openai",
		model: {
			name: req.body["model-name"] || "gpt-4o-mini",
			provider: req.body["model-provider"] || "openai",
		},
		providers: providers,
		systemPrompt: req.body.systemPrompt ?
			req.body.systemPrompt.substring(0, 4000) :
			existingAi.systemPrompt || "You are a helpful AI assistant in a Discord server. Be concise, friendly, and helpful.",
		rateLimits: {
			cooldownSec: parseInt(req.body["rateLimits-cooldownSec"]) || 10,
			perUserPerMin: parseInt(req.body["rateLimits-perUserPerMin"]) || 6,
			perChannelPerMin: parseInt(req.body["rateLimits-perChannelPerMin"]) || 20,
		},
		memory: {
			limit: parseInt(req.body["memory-limit"]) || 10,
			perUserEnabled: req.body["memory-perUserEnabled"] === "on",
			perUserLimit: parseInt(req.body["memory-perUserLimit"]) || 5,
		},
		enabledChannels: enabledChannels,
		disabledChannels: disabledChannels,
		// Preserve existing governance, policy, tools, and usage
		governance: existingAi.governance || {},
		policy: existingAi.policy || {},
		tools: existingAi.tools || {},
		usage: existingAi.usage || {},
	};

	// Set the entire AI config at once
	serverQueryDocument.set("config.ai", aiConfig);

	save(req, res, true);
};

/**
 * AI Governance - Budget and access controls
 */
controllers.governance = async (req, { res }) => {
	const { svr } = req;
	const serverDocument = req.svr.document;
	await svr.fetchCollection("roles");

	const aiConfig = serverDocument.config.ai || {};
	const governance = aiConfig.governance || {};
	const usage = aiConfig.usage || {};

	res.setPageData({
		page: "admin-ai-governance.ejs",
		roleData: getRoleData(svr),
	});

	res.setConfigData({
		ai: {
			governance: {
				budget: governance.budget || {
					perUserDailyTokens: 0,
					perGuild: {
						unit: "tokens",
						dailyTokens: 0,
						dailyUsd: 0,
					},
				},
				bypass: governance.bypass || {
					cooldownRoles: [],
				},
				tools: governance.tools || {
					allow: [],
					deny: [],
				},
			},
			policy: aiConfig.policy || {
				models: {
					allow: {},
					deny: {},
				},
			},
			usage: {
				tokens: usage.tokens || { prompt: 0, completion: 0, total: 0 },
				cost: usage.cost || { usd: 0 },
				budget: usage.budget || { tokensDayTotal: 0, costDayUsd: 0 },
			},
		},
		availableTools: ["websearch"],
	});

	res.render();
};

controllers.governance.post = async (req, res) => {
	const serverQueryDocument = req.svr.queryDocument;
	const serverDocument = req.svr.document;

	// Get existing AI config
	const existingAi = serverDocument.config.ai || {};

	// Build bypass roles array
	const bypassRoles = [];
	await req.svr.fetchCollection("roles");
	req.svr.roles.forEach(role => {
		if (req.body[`bypass-cooldownRoles-${role.id}`] === "on") {
			bypassRoles.push(role.id);
		}
	});

	// Build tool access arrays
	const toolsAllow = [];
	const toolsDeny = [];
	const availableTools = ["websearch"];
	availableTools.forEach(tool => {
		if (req.body[`tools-allow-${tool}`] === "on") {
			toolsAllow.push(tool);
		}
		if (req.body[`tools-deny-${tool}`] === "on") {
			toolsDeny.push(tool);
		}
	});

	// Build complete governance object
	const governance = {
		budget: {
			perUserDailyTokens: parseInt(req.body["budget-perUserDailyTokens"]) || 0,
			perGuild: {
				unit: req.body["budget-perGuild-unit"] || "tokens",
				dailyTokens: parseInt(req.body["budget-perGuild-dailyTokens"]) || 0,
				dailyUsd: parseFloat(req.body["budget-perGuild-dailyUsd"]) || 0,
			},
		},
		bypass: {
			cooldownRoles: bypassRoles,
		},
		tools: {
			allow: toolsAllow,
			deny: toolsDeny,
		},
	};

	// Set governance
	serverQueryDocument.set("config.ai.governance", governance);

	// Reset usage if requested
	if (req.body["reset-usage"] === "on") {
		serverQueryDocument.set("config.ai.usage", {
			tokens: { prompt: 0, completion: 0, total: 0 },
			perUser: {},
			perChannel: {},
			cost: { usd: 0 },
			budget: {
				tokensDayStart: Date.now(),
				tokensDayTotal: 0,
				costDayStart: Date.now(),
				costDayUsd: 0,
			},
		});
	} else {
		// Preserve existing usage
		serverQueryDocument.set("config.ai.usage", existingAi.usage || {});
	}

	save(req, res, true);
};

/**
 * AI Models API - Fetch available models for a provider
 * Returns JSON list of models based on provider and stored API key
 */
controllers.models = async (req, res) => {
	try {
		const serverDocument = req.svr.document;
		const aiConfig = serverDocument.config.ai || {};
		const providers = aiConfig.providers || {};

		// Get provider from query string
		const providerName = req.query.provider || aiConfig.defaultProvider || "openai";
		const providerConfig = providers[providerName] || {};

		// Check if provider has required credentials
		if (providerName === "openai" && !providerConfig.apiKey) {
			return res.json({ success: false, error: "No API key configured for OpenAI", models: [] });
		}
		if (providerName === "anthropic" && !providerConfig.apiKey) {
			return res.json({ success: false, error: "No API key configured for Anthropic", models: [] });
		}
		if (providerName === "groq" && !providerConfig.apiKey) {
			return res.json({ success: false, error: "No API key configured for Groq", models: [] });
		}
		if (providerName === "ollama" && !providerConfig.baseUrl) {
			return res.json({ success: false, error: "No base URL configured for Ollama", models: [] });
		}
		if (providerName === "openai_compatible" && !providerConfig.baseUrl) {
			return res.json({ success: false, error: "No base URL configured for OpenAI Compatible", models: [] });
		}

		// Get or create AI manager
		const { client } = req.app;
		if (!client.aiManager) {
			const { AIManager } = require("../../../Modules/AI");
			client.aiManager = new AIManager(client);
			await client.aiManager.initialize();
		}

		// Fetch models from provider
		const models = await client.aiManager.getAvailableModels(providerName, providerConfig);

		res.json({
			success: true,
			provider: providerName,
			models: models || [],
		});
	} catch (error) {
		logger.warn(`Failed to fetch AI models: ${error.message}`, { svrid: req.svr.id });
		res.json({
			success: false,
			error: error.message,
			models: [],
		});
	}
};

/**
 * AI Vector Memory - Qdrant configuration page
 */
controllers.memory = async (req, { res }) => {
	const serverDocument = req.svr.document;
	const aiConfig = serverDocument.config.ai || {};
	const vectorConfig = aiConfig.vectorMemory || {};

	// Get vector memory stats if configured
	let stats = null;
	if (vectorConfig.url) {
		try {
			const { client } = req.app;
			if (!client.aiManager) {
				const { AIManager } = require("../../../Modules/AI");
				client.aiManager = new AIManager(client);
				await client.aiManager.initialize();
			}
			stats = await client.aiManager.getVectorMemoryStats(serverDocument);
		} catch (err) {
			logger.debug(`Failed to get vector memory stats: ${err.message}`);
		}
	}

	res.setPageData({
		page: "admin-ai-memory.ejs",
		embeddingModels: [
			{ id: "text-embedding-3-small", name: "OpenAI text-embedding-3-small (1536d)", size: 1536 },
			{ id: "text-embedding-3-large", name: "OpenAI text-embedding-3-large (3072d)", size: 3072 },
			{ id: "text-embedding-ada-002", name: "OpenAI text-embedding-ada-002 (1536d)", size: 1536 },
		],
	});

	res.setConfigData({
		ai: {
			vectorMemory: {
				enabled: vectorConfig.enabled || false,
				url: vectorConfig.url || "",
				apiKey: vectorConfig.apiKey ? "••••••••" : "",
				hasApiKey: !!vectorConfig.apiKey,
				embeddingModel: vectorConfig.embeddingModel || "text-embedding-3-small",
				vectorSize: vectorConfig.vectorSize || 1536,
				searchLimit: vectorConfig.searchLimit || 5,
				scoreThreshold: vectorConfig.scoreThreshold || 0.7,
				storeMessages: vectorConfig.storeMessages !== false,
				storeFacts: vectorConfig.storeFacts !== false,
				injectContext: vectorConfig.injectContext !== false,
				contextPrefix: vectorConfig.contextPrefix || "Relevant context from memory:",
				retentionDays: vectorConfig.retentionDays || 0,
			},
			stats: stats,
		},
	});

	res.render();
};

controllers.memory.post = async (req, res) => {
	const serverQueryDocument = req.svr.queryDocument;
	const serverDocument = req.svr.document;

	const existingAi = serverDocument.config.ai || {};
	const existingVector = existingAi.vectorMemory || {};

	// Preserve API key if not changed
	const apiKey = req.body["vectorMemory-apiKey"];
	const finalApiKey = apiKey && apiKey !== "••••••••" && apiKey.trim() !== "" ?
		apiKey.trim() :
		existingVector.apiKey || "";

	// Build vector memory config
	const vectorMemory = {
		enabled: req.body["vectorMemory-enabled"] === "on",
		url: (req.body["vectorMemory-url"] || "").trim(),
		apiKey: finalApiKey,
		embeddingModel: req.body["vectorMemory-embeddingModel"] || "text-embedding-3-small",
		vectorSize: parseInt(req.body["vectorMemory-vectorSize"]) || 1536,
		searchLimit: Math.min(20, Math.max(1, parseInt(req.body["vectorMemory-searchLimit"]) || 5)),
		scoreThreshold: Math.min(1, Math.max(0, parseFloat(req.body["vectorMemory-scoreThreshold"]) || 0.7)),
		storeMessages: req.body["vectorMemory-storeMessages"] === "on",
		storeFacts: req.body["vectorMemory-storeFacts"] === "on",
		injectContext: req.body["vectorMemory-injectContext"] === "on",
		contextPrefix: (req.body["vectorMemory-contextPrefix"] || "Relevant context from memory:").substring(0, 200),
		retentionDays: Math.min(365, Math.max(0, parseInt(req.body["vectorMemory-retentionDays"]) || 0)),
	};

	// Clear vector memory cache if URL changed
	if (existingVector.url !== vectorMemory.url) {
		try {
			const { client } = req.app;
			if (client.aiManager && client.aiManager.vectorMemory) {
				client.aiManager.vectorMemory.clearCache(serverDocument._id);
			}
		} catch (err) {
			logger.debug(`Failed to clear vector cache: ${err.message}`);
		}
	}

	serverQueryDocument.set("config.ai.vectorMemory", vectorMemory);
	save(req, res, true);
};

/**
 * Test Qdrant connection API
 */
controllers.testQdrant = async (req, res) => {
	try {
		const { url, apiKey } = req.body;

		if (!url) {
			return res.json({ success: false, error: "URL is required" });
		}

		const { client } = req.app;
		if (!client.aiManager) {
			const { AIManager } = require("../../../Modules/AI");
			client.aiManager = new AIManager(client);
			await client.aiManager.initialize();
		}

		// If apiKey is masked, use existing key from document
		let finalApiKey = apiKey;
		if (apiKey === "••••••••") {
			const serverDocument = req.svr.document;
			const vectorConfig = serverDocument.config.ai && serverDocument.config.ai.vectorMemory;
			finalApiKey = vectorConfig && vectorConfig.apiKey ? vectorConfig.apiKey : "";
		}

		const result = await client.aiManager.testVectorMemoryConnection({
			url: url,
			apiKey: finalApiKey || undefined,
		});

		res.json(result);
	} catch (error) {
		logger.warn(`Qdrant connection test failed: ${error.message}`, { svrid: req.svr.id });
		res.json({
			success: false,
			error: error.message,
		});
	}
};

/**
 * Clear vector memory API
 */
controllers.clearVectorMemory = async (req, res) => {
	try {
		const serverDocument = req.svr.document;
		const { client } = req.app;

		if (!client.aiManager) {
			const { AIManager } = require("../../../Modules/AI");
			client.aiManager = new AIManager(client);
			await client.aiManager.initialize();
		}

		const options = {};

		// Optional filters
		if (req.body.channelId) {
			options.channelId = req.body.channelId;
		}
		if (req.body.olderThanDays) {
			const days = parseInt(req.body.olderThanDays);
			if (days > 0) {
				options.olderThan = Date.now() - (days * 24 * 60 * 60 * 1000);
			}
		}

		const success = await client.aiManager.clearVectorMemory(serverDocument, options);

		res.json({
			success: success,
			message: success ? "Vector memory cleared successfully" : "Failed to clear vector memory",
		});
	} catch (error) {
		logger.warn(`Failed to clear vector memory: ${error.message}`, { svrid: req.svr.id });
		res.json({
			success: false,
			error: error.message,
		});
	}
};

/**
 * Get vector memory stats API
 */
controllers.vectorStats = async (req, res) => {
	try {
		const serverDocument = req.svr.document;
		const { client } = req.app;

		if (!client.aiManager) {
			const { AIManager } = require("../../../Modules/AI");
			client.aiManager = new AIManager(client);
			await client.aiManager.initialize();
		}

		const stats = await client.aiManager.getVectorMemoryStats(serverDocument);

		res.json({
			success: true,
			stats: stats,
		});
	} catch (error) {
		logger.warn(`Failed to get vector stats: ${error.message}`, { svrid: req.svr.id });
		res.json({
			success: false,
			error: error.message,
		});
	}
};
