/**
 * AnthropicProvider - Provider for Anthropic Claude API
 * Supports Claude 3.5, Claude 3, and other Anthropic models
 */

const BaseProvider = require("./BaseProvider");
const { fetch } = require("undici");

class AnthropicProvider extends BaseProvider {
	constructor (config) {
		super(config);
		this.apiKey = config.apiKey;
		this.baseUrl = config.baseUrl || "https://api.anthropic.com";
		this.apiVersion = config.apiVersion || "2023-06-01";
	}

	/**
	 * Convert OpenAI-style messages to Anthropic format
	 * @private
	 */
	_convertMessages (messages) {
		let systemPrompt = "";
		const convertedMessages = [];

		for (const msg of messages) {
			if (msg.role === "system") {
				systemPrompt += (systemPrompt ? "\n" : "") + msg.content;
			} else {
				convertedMessages.push({
					role: msg.role === "assistant" ? "assistant" : "user",
					content: msg.content,
				});
			}
		}

		return { systemPrompt, messages: convertedMessages };
	}

	/**
	 * Perform a chat completion
	 * @param {Object} options - Chat options
	 * @returns {Promise<string>|AsyncGenerator} Response or stream
	 */
	async chat ({ model, messages, stream = false, maxTokens = 4096, ...params }) {
		const url = `${this.baseUrl}/v1/messages`;
		const { systemPrompt, messages: convertedMessages } = this._convertMessages(messages);

		const headers = {
			"Content-Type": "application/json",
			"x-api-key": this.apiKey,
			"anthropic-version": this.apiVersion,
		};

		const body = {
			model,
			messages: convertedMessages,
			max_tokens: maxTokens,
			stream,
			...params,
		};

		if (systemPrompt) {
			body.system = systemPrompt;
		}

		const response = await fetch(url, {
			method: "POST",
			headers,
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Anthropic API error: ${response.status} - ${error}`);
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
				prompt: data.usage.input_tokens || 0,
				completion: data.usage.output_tokens || 0,
				total: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
			});
		}

		const content = data.content || [];
		const textContent = content.find(c => c.type === "text");
		return textContent ? textContent.text : "";
	}

	/**
	 * Handle streaming response
	 * @private
	 */
	async *_handleStream (response) {
		let totalCompletion = 0;
		let inputTokens = 0;
		let outputTokens = 0;

		for await (const chunk of this.parseSSEStream(response.body, (parsed) => {
			// Handle different event types
			if (parsed.type === "content_block_delta") {
				const { delta } = parsed;
				if (delta && delta.type === "text_delta" && delta.text) {
					totalCompletion += delta.text.length;
					return delta.text;
				}
			} else if (parsed.type === "message_delta" && parsed.usage) {
				outputTokens = parsed.usage.output_tokens || 0;
			} else if (parsed.type === "message_start" && parsed.message && parsed.message.usage) {
				inputTokens = parsed.message.usage.input_tokens || 0;
			}
			return null;
		})) {
			yield chunk;
		}

		this.setLastUsage({
			prompt: inputTokens,
			completion: outputTokens || Math.ceil(totalCompletion / 4),
			total: inputTokens + (outputTokens || Math.ceil(totalCompletion / 4)),
		});
	}

	/**
	 * List available models
	 * @returns {Promise<string[]>} Array of model names
	 */
	async listModels () {
		// Anthropic doesn't have a models endpoint, return known models
		return [
			"claude-3-5-sonnet-20241022",
			"claude-3-5-haiku-20241022",
			"claude-3-opus-20240229",
			"claude-3-sonnet-20240229",
			"claude-3-haiku-20240307",
		];
	}
}

module.exports = AnthropicProvider;
