export = OllamaProvider;
declare class OllamaProvider extends BaseProvider {
    baseUrl: any;
    /**
     * Perform a chat completion using Ollama's OpenAI-compatible endpoint
     * @param {Object} options - Chat options
     * @returns {Promise<string>|AsyncGenerator} Response or stream
     */
    chat({ model, messages, stream, ...params }: any): Promise<string> | AsyncGenerator;
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
//# sourceMappingURL=OllamaProvider.d.ts.map