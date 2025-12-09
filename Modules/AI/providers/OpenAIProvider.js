/**
 * OpenAIProvider - Provider for OpenAI API
 * Supports GPT-4, GPT-4o, GPT-3.5-turbo, and other OpenAI models
 */

const BaseProvider = require("./BaseProvider");
const { fetch } = require("undici");

class OpenAIProvider extends BaseProvider {
	constructor (config) {
		super(config);
		this.apiKey = config.apiKey;
		this.baseUrl = config.baseUrl || "https://api.openai.com/v1";
		this.organization = config.organization || null;
	}

	/**
	 * Perform a chat completion
	 * @param {Object} options - Chat options
	 * @returns {Promise<string>|AsyncGenerator} Response or stream
	 */
	async chat ({ model, messages, stream = false, ...params }) {
		const url = `${this.baseUrl}/chat/completions`;

		const headers = {
			"Content-Type": "application/json",
			Authorization: `Bearer ${this.apiKey}`,
		};

		if (this.organization) {
			headers["OpenAI-Organization"] = this.organization;
		}

		const body = {
			model,
			messages,
			stream,
			...params,
		};

		const response = await fetch(url, {
			method: "POST",
			headers,
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`OpenAI API error: ${response.status} - ${error}`);
		}

		if (stream) {
			return this._handleStream(response);
		} else {
			return this._handleResponse(response);
		}
	}

	/**
	 * Handle non-streaming response
	 * @private
	 */
	async _handleResponse (response) {
		const data = await response.json();

		// Record usage
		if (data.usage) {
			this.setLastUsage({
				prompt: data.usage.prompt_tokens || 0,
				completion: data.usage.completion_tokens || 0,
				total: data.usage.total_tokens || 0,
			});
		}

		const choice = data.choices && data.choices[0];
		return choice && choice.message ? choice.message.content : "";
	}

	/**
	 * Handle streaming response
	 * @private
	 */
	async *_handleStream (response) {
		let totalCompletion = 0;

		for await (const chunk of this.parseSSEStream(response.body, (parsed) => {
			const choice = parsed.choices && parsed.choices[0];
			const delta = choice && choice.delta;
			if (delta && delta.content) {
				totalCompletion += delta.content.length;
				return delta.content;
			}
			return null;
		})) {
			yield chunk;
		}

		// Estimate usage for streaming (actual usage not available in stream)
		// Prompt tokens unknown in streaming, completion is rough estimate
		this.setLastUsage({
			prompt: 0,
			completion: Math.ceil(totalCompletion / 4),
			total: Math.ceil(totalCompletion / 4),
		});
	}

	/**
	 * List available models
	 * @returns {Promise<string[]>} Array of model names
	 */
	async listModels () {
		const url = `${this.baseUrl}/models`;

		const response = await fetch(url, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to list models: ${response.status}`);
		}

		const data = await response.json();
		const models = data.data || [];

		// Filter to chat models
		return models
			.filter(m => m.id.includes("gpt") || m.id.includes("o1") || m.id.includes("o3"))
			.map(m => m.id)
			.sort();
	}
}

module.exports = OpenAIProvider;
