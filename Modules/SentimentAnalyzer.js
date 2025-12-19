/**
 * SentimentAnalyzer - Analyzes message sentiment using Google Cloud NL API or AI fallback
 *
 * Provides sentiment analysis for automod integration with:
 * - Google Cloud Natural Language API (primary)
 * - AI-based analysis via existing providers (fallback)
 * - Configurable sensitivity and category detection
 * - Caching to reduce API costs
 */

const https = require("https");

// Cache for recent analysis results (prevents re-analyzing same content)
const analysisCache = new Map();
const CACHE_TTL = 300000; // 5 minutes
const MAX_CACHE_SIZE = 1000;

// Sensitivity thresholds mapping
const SENSITIVITY_THRESHOLDS = {
	strict: {
		negative: -0.3,
		toxicity: 0.5,
	},
	normal: {
		negative: -0.5,
		toxicity: 0.7,
	},
	lenient: {
		negative: -0.7,
		toxicity: 0.85,
	},
};

// AI prompt for sentiment analysis
const AI_SENTIMENT_PROMPT = `Analyze the following message for sentiment and toxicity. Respond ONLY with a JSON object (no markdown, no explanation) in this exact format:
{
  "score": <number from -1 to 1, where -1 is very negative and 1 is very positive>,
  "magnitude": <number from 0 to 1 indicating strength of emotion>,
  "categories": {
    "toxic": <boolean>,
    "insult": <boolean>,
    "threat": <boolean>,
    "profanity": <boolean>,
    "identity_attack": <boolean>
  },
  "confidence": <number from 0 to 1>
}

Message to analyze:
`;

class SentimentAnalyzer {
	constructor (client) {
		this.client = client;
	}

	/**
	 * Analyze a message for sentiment
	 * @param {string} content - Message content to analyze
	 * @param {Object} config - Sentiment filter configuration
	 * @param {Object} serverDocument - Server document for AI fallback
	 * @returns {Promise<Object>} Analysis result
	 */
	async analyze (content, config, serverDocument) {
		if (!content || content.length < (config.min_message_length || 10)) {
			return { skip: true, reason: "Message too short" };
		}

		// Check cache first
		const cacheKey = this._getCacheKey(content);
		const cached = this._getFromCache(cacheKey);
		if (cached) {
			return { ...cached, fromCache: true };
		}

		let result;

		// Try Google first if configured and enabled
		if (config.provider === "google" && config.google_api_key) {
			try {
				result = await this._analyzeWithGoogle(content, config.google_api_key);
			} catch (error) {
				logger.warn("Google sentiment analysis failed, falling back to AI", {}, error);
				result = null;
			}
		}

		// Fall back to AI if Google failed or not configured
		if (!result) {
			try {
				result = await this._analyzeWithAI(content, serverDocument);
			} catch (error) {
				logger.warn("AI sentiment analysis failed", {}, error);
				return { skip: true, reason: "Analysis failed", error: error.message };
			}
		}

		if (result) {
			this._addToCache(cacheKey, result);
		}

		return result || { skip: true, reason: "No analysis result" };
	}

	/**
	 * Analyze sentiment using Google Cloud Natural Language API
	 * @private
	 */
	async _analyzeWithGoogle (content, apiKey) {
		const requestBody = JSON.stringify({
			document: {
				type: "PLAIN_TEXT",
				content: content,
			},
			encodingType: "UTF8",
		});

		// Get sentiment analysis
		const sentimentResult = await this._googleRequest(
			`/v1/documents:analyzeSentiment?key=${apiKey}`,
			requestBody,
		);

		// Get entity sentiment for more context
		let entityResult = null;
		try {
			entityResult = await this._googleRequest(
				`/v1/documents:analyzeEntitySentiment?key=${apiKey}`,
				requestBody,
			);
		} catch (err) {
			// Entity analysis is optional, continue without it
		}

		const docSentiment = sentimentResult.documentSentiment || {};

		// Build categories based on entity analysis and content patterns
		const categories = this._detectCategories(content, entityResult);

		return {
			provider: "google",
			score: docSentiment.score || 0,
			magnitude: docSentiment.magnitude || 0,
			categories: categories,
			confidence: Math.min(1, (docSentiment.magnitude || 0) / 2),
			raw: sentimentResult,
		};
	}

	/**
	 * Make a request to Google Cloud NL API
	 * @private
	 */
	_googleRequest (path, body) {
		return new Promise((resolve, reject) => {
			const options = {
				hostname: "language.googleapis.com",
				port: 443,
				path: path,
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Content-Length": Buffer.byteLength(body),
				},
			};

			const req = https.request(options, res => {
				let data = "";
				res.on("data", chunk => { data += chunk; });
				res.on("end", () => {
					try {
						const parsed = JSON.parse(data);
						if (res.statusCode >= 400) {
							reject(new Error(parsed.error?.message || `HTTP ${res.statusCode}`));
						} else {
							resolve(parsed);
						}
					} catch (e) {
						reject(new Error("Failed to parse Google API response"));
					}
				});
			});

			req.on("error", reject);
			req.setTimeout(10000, () => {
				req.destroy();
				reject(new Error("Google API request timeout"));
			});
			req.write(body);
			req.end();
		});
	}

	/**
	 * Analyze sentiment using AI provider (fallback)
	 * @private
	 */
	async _analyzeWithAI (content, serverDocument) {
		if (!this.client.ai) {
			throw new Error("AI Manager not available");
		}

		const aiConfig = serverDocument.config.ai || {};
		if (!aiConfig.providers || Object.keys(aiConfig.providers).length === 0) {
			throw new Error("No AI provider configured for this server");
		}

		const { providerName, providerConfig } = await this.client.ai.resolveProviderAndModel(serverDocument);

		if (!providerConfig || !providerConfig.apiKey) {
			throw new Error("AI provider not configured");
		}

		const provider = this.client.ai.buildProvider(providerName, providerConfig);
		const modelName = aiConfig.model?.name || "gpt-4o-mini";

		const messages = [
			{ role: "system", content: "You are a sentiment analysis assistant. Respond only with valid JSON." },
			{ role: "user", content: AI_SENTIMENT_PROMPT + content },
		];

		const response = await provider.chat({ model: modelName, messages, stream: false });

		// Parse JSON response
		let parsed;
		try {
			// Try to extract JSON from response (handle markdown code blocks)
			let jsonStr = response;
			const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
			if (jsonMatch) {
				jsonStr = jsonMatch[1];
			}
			parsed = JSON.parse(jsonStr.trim());
		} catch (e) {
			throw new Error("Failed to parse AI response as JSON");
		}

		return {
			provider: "ai",
			score: parsed.score || 0,
			magnitude: parsed.magnitude || 0,
			categories: parsed.categories || {},
			confidence: parsed.confidence || 0.5,
			raw: parsed,
		};
	}

	/**
	 * Detect toxicity categories from content and entity analysis
	 * @private
	 */
	_detectCategories (content, entityResult) {
		const lowerContent = content.toLowerCase();
		const categories = {
			toxic: false,
			insult: false,
			threat: false,
			profanity: false,
			identity_attack: false,
		};

		// Basic pattern detection (supplements Google analysis)
		const threatPatterns = /\b(kill|die|murder|hurt|destroy|attack|fight)\b/i;
		const insultPatterns = /\b(idiot|stupid|dumb|moron|loser|pathetic|worthless)\b/i;
		const profanityPatterns = /\b(fuck|shit|damn|ass|bitch|crap|hell)\b/i;
		const identityPatterns = /\b(racist|sexist|homophobic|bigot|nazi)\b/i;

		if (threatPatterns.test(lowerContent)) categories.threat = true;
		if (insultPatterns.test(lowerContent)) categories.insult = true;
		if (profanityPatterns.test(lowerContent)) categories.profanity = true;
		if (identityPatterns.test(lowerContent)) categories.identity_attack = true;

		// Check entity sentiment for negative person references
		if (entityResult?.entities) {
			for (const entity of entityResult.entities) {
				if (entity.type === "PERSON" && entity.sentiment?.score < -0.3) {
					categories.insult = true;
				}
			}
		}

		// Mark as toxic if multiple categories triggered or very negative sentiment
		if (Object.values(categories).filter(v => v).length >= 2) {
			categories.toxic = true;
		}

		return categories;
	}

	/**
	 * Check if analysis result should trigger moderation action
	 * @param {Object} result - Analysis result
	 * @param {Object} config - Sentiment filter configuration
	 * @returns {Object} { shouldAct: boolean, reasons: string[], severity: string }
	 */
	shouldTriggerAction (result, config) {
		if (result.skip) {
			return { shouldAct: false, reasons: [], severity: "none" };
		}

		const sensitivity = config.sensitivity || "normal";
		const thresholds = SENSITIVITY_THRESHOLDS[sensitivity] || SENSITIVITY_THRESHOLDS.normal;
		const enabledCategories = config.categories || {};

		const reasons = [];
		let severity = "low";

		// Check negative sentiment score
		if (result.score <= thresholds.negative && result.magnitude > 0.3) {
			reasons.push(`Negative sentiment (score: ${result.score.toFixed(2)})`);
			if (result.score <= thresholds.negative - 0.2) {
				severity = "high";
			} else {
				severity = "medium";
			}
		}

		// Check enabled categories
		const categories = result.categories || {};
		for (const [category, enabled] of Object.entries(enabledCategories)) {
			if (enabled && categories[category]) {
				reasons.push(`${category.replace("_", " ")} detected`);
				if (category === "threat" || category === "identity_attack") {
					severity = "high";
				} else if (severity !== "high") {
					severity = "medium";
				}
			}
		}

		return {
			shouldAct: reasons.length > 0,
			reasons: reasons,
			severity: severity,
			score: result.score,
			categories: categories,
		};
	}

	/**
	 * Get threshold for a sensitivity level
	 * @param {string} sensitivity - Sensitivity level
	 * @returns {Object} Thresholds
	 */
	getThresholds (sensitivity) {
		return SENSITIVITY_THRESHOLDS[sensitivity] || SENSITIVITY_THRESHOLDS.normal;
	}

	/**
	 * Cache management
	 * @private
	 */
	_getCacheKey (content) {
		// Simple hash of content for cache key
		let hash = 0;
		for (let i = 0; i < content.length; i++) {
			const char = content.charCodeAt(i);
			// eslint-disable-next-line no-bitwise
			hash = ((hash << 5) - hash) + char;
			// eslint-disable-next-line no-bitwise
			hash &= hash;
		}
		return `sentiment:${hash}`;
	}

	_getFromCache (key) {
		const entry = analysisCache.get(key);
		if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
			return entry.result;
		}
		analysisCache.delete(key);
		return null;
	}

	_addToCache (key, result) {
		// Limit cache size
		if (analysisCache.size >= MAX_CACHE_SIZE) {
			const firstKey = analysisCache.keys().next().value;
			analysisCache.delete(firstKey);
		}
		analysisCache.set(key, { result, timestamp: Date.now() });
	}

	/**
	 * Clear cache (for testing or memory management)
	 */
	clearCache () {
		analysisCache.clear();
	}
}

module.exports = SentimentAnalyzer;
