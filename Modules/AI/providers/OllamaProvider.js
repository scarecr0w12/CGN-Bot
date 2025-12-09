/**
 * OllamaProvider - Provider for Ollama local LLM server
 * Supports any model available in Ollama
 */

const BaseProvider = require("./BaseProvider");
const { fetch } = require("undici");

class OllamaProvider extends BaseProvider {
	constructor (config) {
		super(config);
		this.baseUrl = config.baseUrl || "http://localhost:11434";
	}

	/**
	 * Perform a chat completion using Ollama's OpenAI-compatible endpoint
	 * @param {Object} options - Chat options
	 * @returns {Promise<string>|AsyncGenerator} Response or stream
	 */
	async chat ({ model, messages, stream = false, ...params }) {
		const url = `${this.baseUrl}/v1/chat/completions`;

		const headers = {
			"Content-Type": "application/json",
		};

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
			throw new Error(`Ollama API error: ${response.status} - ${error}`);
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
		const url = `${this.baseUrl}/api/tags`;

		try {
			const response = await fetch(url, {
				method: "GET",
			});

			if (!response.ok) {
				throw new Error(`Failed to list models: ${response.status}`);
			}

			const data = await response.json();
			const models = data.models || [];

			return models.map(m => m.name).sort();
		} catch (error) {
			// Fallback to OpenAI-compatible endpoint
			try {
				const response = await fetch(`${this.baseUrl}/v1/models`, {
					method: "GET",
				});

				if (response.ok) {
					const data = await response.json();
					return (data.data || []).map(m => m.id).sort();
				}
			} catch (e) {
				// Ignore
			}
			return [];
		}
	}
}

module.exports = OllamaProvider;
