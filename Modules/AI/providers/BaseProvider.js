/**
 * BaseProvider - Abstract base class for AI providers
 * All provider implementations should extend this class
 */

class BaseProvider {
	constructor (config) {
		this.config = config;
		this._lastUsage = null;
	}

	/**
	 * Perform a chat completion
	 * @param {Object} options - Chat options
	 * @param {string} options.model - Model name
	 * @param {Array} options.messages - Array of message objects
	 * @param {boolean} options.stream - Whether to stream the response
	 * @returns {Promise<string>|AsyncGenerator} Response or stream
	 */
	// eslint-disable-next-line no-unused-vars
	async chat (options) {
		throw new Error("chat() must be implemented by subclass");
	}

	/**
	 * List available models
	 * @returns {Promise<string[]>} Array of model names
	 */
	async listModels () {
		throw new Error("listModels() must be implemented by subclass");
	}

	/**
	 * Get the last usage statistics
	 * @returns {Object|null} Usage object with prompt, completion, total tokens
	 */
	getLastUsage () {
		return this._lastUsage;
	}

	/**
	 * Set the last usage statistics
	 * @param {Object} usage - Usage object
	 */
	setLastUsage (usage) {
		this._lastUsage = usage;
	}

	/**
	 * Parse a Server-Sent Events stream
	 * @param {ReadableStream} stream - The response stream
	 * @param {Function} onChunk - Callback for each chunk
	 * @returns {AsyncGenerator} Yields content chunks
	 */
	async *parseSSEStream (stream, extractContent) {
		const reader = stream.getReader();
		const decoder = new TextDecoder();
		let buffer = "";

		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split("\n");
				buffer = lines.pop() || "";

				for (const line of lines) {
					if (line.startsWith("data: ")) {
						const data = line.slice(6).trim();
						if (data === "[DONE]") return;

						try {
							const parsed = JSON.parse(data);
							const content = extractContent(parsed);
							if (content) yield content;
						} catch (e) {
							// Skip invalid JSON
						}
					}
				}
			}
		} finally {
			reader.releaseLock();
		}
	}
}

module.exports = BaseProvider;
