/**
 * ProviderFactory - Factory for creating AI provider instances
 * Supports multiple LLM providers: OpenAI, Anthropic, Groq, Gemini, Ollama, etc.
 */

const OpenAIProvider = require("./OpenAIProvider");
const AnthropicProvider = require("./AnthropicProvider");
const GroqProvider = require("./GroqProvider");
const OllamaProvider = require("./OllamaProvider");
const OpenAICompatibleProvider = require("./OpenAICompatibleProvider");

class ProviderFactory {
	constructor () {
		this.providers = {
			openai: OpenAIProvider,
			anthropic: AnthropicProvider,
			groq: GroqProvider,
			ollama: OllamaProvider,
			// LM Studio uses OpenAI-compatible API
			lmstudio: OllamaProvider,
			localai: OpenAICompatibleProvider,
			vllm: OpenAICompatibleProvider,
			text_generation_webui: OpenAICompatibleProvider,
			openai_compatible: OpenAICompatibleProvider,
		};
	}

	/**
	 * Create a provider instance
	 * @param {string} providerName - Name of the provider
	 * @param {Object} config - Provider configuration
	 * @returns {Object} Provider instance
	 */
	create (providerName, config) {
		const normalizedName = providerName.toLowerCase();
		const ProviderClass = this.providers[normalizedName];

		if (!ProviderClass) {
			throw new Error(`Unsupported AI provider: ${providerName}`);
		}

		return new ProviderClass(config);
	}

	/**
	 * Get list of supported providers
	 * @returns {string[]} Array of provider names
	 */
	getSupportedProviders () {
		return Object.keys(this.providers);
	}

	/**
	 * Check if a provider is supported
	 * @param {string} providerName - Name of the provider
	 * @returns {boolean} True if supported
	 */
	isSupported (providerName) {
		return providerName.toLowerCase() in this.providers;
	}
}

module.exports = ProviderFactory;
