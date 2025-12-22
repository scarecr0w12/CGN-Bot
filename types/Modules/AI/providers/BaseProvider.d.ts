export = BaseProvider;
/**
 * BaseProvider - Abstract base class for AI providers
 * All provider implementations should extend this class
 */
declare class BaseProvider {
    constructor(config: any);
    config: any;
    _lastUsage: any;
    /**
     * Perform a chat completion
     * @param {Object} options - Chat options
     * @param {string} options.model - Model name
     * @param {Array} options.messages - Array of message objects
     * @param {boolean} options.stream - Whether to stream the response
     * @returns {Promise<string>|AsyncGenerator} Response or stream
     */
    chat(options: {
        model: string;
        messages: any[];
        stream: boolean;
    }): Promise<string> | AsyncGenerator;
    /**
     * List available models
     * @returns {Promise<string[]>} Array of model names
     */
    listModels(): Promise<string[]>;
    /**
     * Get the last usage statistics
     * @returns {Object|null} Usage object with prompt, completion, total tokens
     */
    getLastUsage(): any | null;
    /**
     * Set the last usage statistics
     * @param {Object} usage - Usage object
     */
    setLastUsage(usage: any): void;
    /**
     * Parse a Server-Sent Events stream
     * @param {ReadableStream} stream - The response stream
     * @param {Function} onChunk - Callback for each chunk
     * @returns {AsyncGenerator} Yields content chunks
     */
    parseSSEStream(stream: ReadableStream, extractContent: any): AsyncGenerator;
}
//# sourceMappingURL=BaseProvider.d.ts.map