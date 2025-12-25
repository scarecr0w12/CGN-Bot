export = GroqProvider;
declare class GroqProvider extends BaseProvider {
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
}
import BaseProvider = require("./BaseProvider");
//# sourceMappingURL=GroqProvider.d.ts.map