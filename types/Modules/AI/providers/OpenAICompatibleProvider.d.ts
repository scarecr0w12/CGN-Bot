export = OpenAICompatibleProvider;
declare class OpenAICompatibleProvider extends BaseProvider {
    apiKey: any;
    baseUrl: any;
    /**
     * Perform a chat completion
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
    /**
     * Generate embeddings
     * @param {string} text - Text to embed
     * @param {string} model - Embedding model to use
     * @returns {Promise<number[]>} Embedding vector
     */
    embed(text: string, model?: string): Promise<number[]>;
}
import BaseProvider = require("./BaseProvider");
//# sourceMappingURL=OpenAICompatibleProvider.d.ts.map