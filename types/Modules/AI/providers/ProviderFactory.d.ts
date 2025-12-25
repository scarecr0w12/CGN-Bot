export = ProviderFactory;
declare class ProviderFactory {
    providers: {
        openai: typeof OpenAIProvider;
        anthropic: typeof AnthropicProvider;
        groq: typeof GroqProvider;
        ollama: typeof OllamaProvider;
        lmstudio: typeof OllamaProvider;
        localai: typeof OpenAICompatibleProvider;
        vllm: typeof OpenAICompatibleProvider;
        text_generation_webui: typeof OpenAICompatibleProvider;
        openai_compatible: typeof OpenAICompatibleProvider;
    };
    /**
     * Create a provider instance
     * @param {string} providerName - Name of the provider
     * @param {Object} config - Provider configuration
     * @returns {Object} Provider instance
     */
    create(providerName: string, config: any): any;
    /**
     * Get list of supported providers
     * @returns {string[]} Array of provider names
     */
    getSupportedProviders(): string[];
    /**
     * Check if a provider is supported
     * @param {string} providerName - Name of the provider
     * @returns {boolean} True if supported
     */
    isSupported(providerName: string): boolean;
}
import OpenAIProvider = require("./OpenAIProvider");
import AnthropicProvider = require("./AnthropicProvider");
import GroqProvider = require("./GroqProvider");
import OllamaProvider = require("./OllamaProvider");
import OpenAICompatibleProvider = require("./OpenAICompatibleProvider");
//# sourceMappingURL=ProviderFactory.d.ts.map