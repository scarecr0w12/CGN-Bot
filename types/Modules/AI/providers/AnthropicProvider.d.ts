export = AnthropicProvider;
declare class AnthropicProvider extends BaseProvider {
    apiKey: any;
    baseUrl: any;
    apiVersion: any;
    /**
     * Convert OpenAI-style messages to Anthropic format
     * @private
     */
    private _convertMessages;
    /**
     * Perform a chat completion
     * @param {Object} options - Chat options
     * @returns {Promise<string>|AsyncGenerator} Response or stream
     */
    chat({ model, messages, stream, maxTokens, ...params }: any): Promise<string> | AsyncGenerator;
    /**
     * Handle non-streaming response
     * @private
     */
    private _handleResponse;
    /**
     * Handle streaming response
     * @private
     */
    private _handleStream;
}
import BaseProvider = require("./BaseProvider");
//# sourceMappingURL=AnthropicProvider.d.ts.map