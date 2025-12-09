/**
 * OpenAICompatibleProvider - Provider for OpenAI-compatible APIs
 * Supports LocalAI, vLLM, Text Generation WebUI, and other compatible servers
 */

const BaseProvider = require("./BaseProvider");
const { fetch } = require("undici");

class OpenAICompatibleProvider extends BaseProvider {
	constructor (config) {
		super(config);
		this.apiKey = config.apiKey || "";
		this.baseUrl = config.baseUrl;

		if (!this.baseUrl) {
			throw new Error("baseUrl is required for OpenAI-compatible provider");
		}
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
		};

		if (this.apiKey) {
			headers.Authorization = `Bearer ${this.apiKey}`;
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
			throw new Error(`API error: ${response.status} - ${error}`);
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

		const headers = {};
		if (this.apiKey) {
			headers.Authorization = `Bearer ${this.apiKey}`;
		}

		try {
			const response = await fetch(url, {
				method: "GET",
				headers,
			});

			if (!response.ok) {
				return [];
			}

			const data = await response.json();
			const models = data.data || [];

			return models.map(m => m.id).sort();
		} catch (error) {
			return [];
		}
	}
}

module.exports = OpenAICompatibleProvider;
