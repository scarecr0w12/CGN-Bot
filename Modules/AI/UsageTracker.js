/**
 * UsageTracker - Tracks AI usage statistics and costs
 * Records token usage, costs, and per-user/channel statistics
 */

class UsageTracker {
	constructor () {
		// Pricing data for cost estimation (per 1K tokens)
		this.pricing = {
			openai: {
				"gpt-4o": { prompt: 0.0025, completion: 0.01 },
				"gpt-4o-mini": { prompt: 0.00015, completion: 0.0006 },
				"gpt-4-turbo": { prompt: 0.01, completion: 0.03 },
				"gpt-4": { prompt: 0.03, completion: 0.06 },
				"gpt-3.5-turbo": { prompt: 0.0005, completion: 0.0015 },
			},
			anthropic: {
				"claude-3-5-sonnet-20241022": { prompt: 0.003, completion: 0.015 },
				"claude-3-5-haiku-20241022": { prompt: 0.001, completion: 0.005 },
				"claude-3-opus-20240229": { prompt: 0.015, completion: 0.075 },
				"claude-3-sonnet-20240229": { prompt: 0.003, completion: 0.015 },
				"claude-3-haiku-20240307": { prompt: 0.00025, completion: 0.00125 },
			},
			groq: {
				"llama-3.1-70b-versatile": { prompt: 0.00059, completion: 0.00079 },
				"llama-3.1-8b-instant": { prompt: 0.00005, completion: 0.00008 },
				"mixtral-8x7b-32768": { prompt: 0.00024, completion: 0.00024 },
			},
		};
	}

	/**
	 * Record usage statistics
	 * @param {Object} serverDocument - The server document
	 * @param {Object} user - The Discord user
	 * @param {Object} channel - The Discord channel
	 * @param {Object} usage - Usage object { prompt, completion, total }
	 * @param {string} provider - Provider name
	 * @param {string} model - Model name
	 */
	async recordUsage (serverDocument, user, channel, usage, provider, model) {
		// No usage data to record
		if (!usage || (!usage.prompt && !usage.completion && !usage.total)) {
			return;
		}

		const now = Date.now();
		const { query } = serverDocument;
		const aiConfig = serverDocument.config.ai || {};
		const usageData = aiConfig.usage || {};

		// Use $inc for atomic token updates
		query.inc("config.ai.usage.tokens.prompt", usage.prompt || 0);
		query.inc("config.ai.usage.tokens.completion", usage.completion || 0);
		query.inc("config.ai.usage.tokens.total", usage.total || 0);

		// Update per-user usage
		const perUser = usageData.perUser || {};
		const existingUserUsage = perUser[user.id] || {};
		const userTokensDayStart = existingUserUsage.tokensDayStart || 0;

		// Check if we need to reset daily counter
		const isNewDay = now - userTokensDayStart >= 86400000;
		const newUserUsage = {
			lastUsed: now,
			count: (existingUserUsage.count || 0) + 1,
			tokensTotal: (existingUserUsage.tokensTotal || 0) + (usage.total || 0),
			tokensDayStart: isNewDay ? now : userTokensDayStart || now,
			tokensDayTotal: isNewDay ? usage.total || 0 : (existingUserUsage.tokensDayTotal || 0) + (usage.total || 0),
		};
		query.set(`config.ai.usage.perUser.${user.id}`, newUserUsage);

		// Update per-channel usage
		const perChannel = usageData.perChannel || {};
		const existingChannelUsage = perChannel[channel.id] || {};
		const newChannelUsage = {
			count: (existingChannelUsage.count || 0) + 1,
			tokensTotal: (existingChannelUsage.tokensTotal || 0) + (usage.total || 0),
		};
		query.set(`config.ai.usage.perChannel.${channel.id}`, newChannelUsage);

		// Calculate and record cost
		const cost = this.estimateCost(provider, model, usage.prompt || 0, usage.completion || 0);
		query.inc("config.ai.usage.cost.usd", cost);

		// Update budget tracking
		const existingBudget = usageData.budget || {};
		const budgetTokensDayStart = existingBudget.tokensDayStart || 0;
		const budgetCostDayStart = existingBudget.costDayStart || 0;
		const isNewTokenDay = now - budgetTokensDayStart >= 86400000;
		const isNewCostDay = now - budgetCostDayStart >= 86400000;

		if (isNewTokenDay) {
			query.set("config.ai.usage.budget.tokensDayStart", now);
			query.set("config.ai.usage.budget.tokensDayTotal", usage.total || 0);
		} else {
			query.inc("config.ai.usage.budget.tokensDayTotal", usage.total || 0);
		}

		if (isNewCostDay) {
			query.set("config.ai.usage.budget.costDayStart", now);
			query.set("config.ai.usage.budget.costDayUsd", cost);
		} else {
			query.inc("config.ai.usage.budget.costDayUsd", cost);
		}

		try {
			await serverDocument.save();
		} catch (error) {
			logger.warn(`Failed to save AI usage: ${error.message}`);
		}
	}

	/**
	 * Estimate cost for token usage
	 * @param {string} provider - Provider name
	 * @param {string} model - Model name
	 * @param {number} promptTokens - Number of prompt tokens
	 * @param {number} completionTokens - Number of completion tokens
	 * @returns {number} Estimated cost in USD
	 */
	estimateCost (provider, model, promptTokens, completionTokens) {
		const providerPricing = this.pricing[provider] || {};
		const modelPricing = providerPricing[model] || {};

		const promptCost = (modelPricing.prompt || 0) * (promptTokens / 1000);
		const completionCost = (modelPricing.completion || 0) * (completionTokens / 1000);

		return Math.round((promptCost + completionCost) * 1000000) / 1000000;
	}

	/**
	 * Get usage statistics for a guild
	 * @param {Object} serverDocument - The server document
	 * @param {number} topN - Number of top users to return
	 * @returns {Object} Usage statistics
	 */
	async getStats (serverDocument, topN = 5) {
		const aiConfig = serverDocument.config.ai || {};
		const usageData = aiConfig.usage || {};

		const tokens = usageData.tokens || { prompt: 0, completion: 0, total: 0 };
		const cost = usageData.cost || { usd: 0 };
		const perUser = usageData.perUser || {};
		const perChannel = usageData.perChannel || {};

		// Get top users by token usage
		const topUsers = Object.entries(perUser)
			.map(([userId, data]) => ({ userId, ...data }))
			.sort((a, b) => (b.tokensTotal || 0) - (a.tokensTotal || 0))
			.slice(0, topN);

		// Get top channels by usage
		const topChannels = Object.entries(perChannel)
			.map(([channelId, data]) => ({ channelId, ...data }))
			.sort((a, b) => (b.tokensTotal || 0) - (a.tokensTotal || 0))
			.slice(0, topN);

		return {
			tokens,
			cost,
			topUsers,
			topChannels,
			totalRequests: Object.values(perUser).reduce((sum, u) => sum + (u.count || 0), 0),
		};
	}

	/**
	 * Reset usage statistics for a guild
	 * @param {Object} serverDocument - The server document
	 */
	async resetStats (serverDocument) {
		if (serverDocument.config.ai) {
			serverDocument.config.ai.usage = {
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
			};
			await serverDocument.save();
		}
	}
}

module.exports = UsageTracker;
