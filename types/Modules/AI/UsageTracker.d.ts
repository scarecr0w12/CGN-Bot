export = UsageTracker;
/**
 * UsageTracker - Tracks AI usage statistics and costs
 * Records token usage, costs, and per-user/channel statistics
 */
declare class UsageTracker {
    pricing: {
        openai: {
            "gpt-4o": {
                prompt: number;
                completion: number;
            };
            "gpt-4o-mini": {
                prompt: number;
                completion: number;
            };
            "gpt-4-turbo": {
                prompt: number;
                completion: number;
            };
            "gpt-4": {
                prompt: number;
                completion: number;
            };
            "gpt-3.5-turbo": {
                prompt: number;
                completion: number;
            };
        };
        anthropic: {
            "claude-3-5-sonnet-20241022": {
                prompt: number;
                completion: number;
            };
            "claude-3-5-haiku-20241022": {
                prompt: number;
                completion: number;
            };
            "claude-3-opus-20240229": {
                prompt: number;
                completion: number;
            };
            "claude-3-sonnet-20240229": {
                prompt: number;
                completion: number;
            };
            "claude-3-haiku-20240307": {
                prompt: number;
                completion: number;
            };
        };
        groq: {
            "llama-3.1-70b-versatile": {
                prompt: number;
                completion: number;
            };
            "llama-3.1-8b-instant": {
                prompt: number;
                completion: number;
            };
            "mixtral-8x7b-32768": {
                prompt: number;
                completion: number;
            };
        };
    };
    /**
     * Record usage statistics
     * @param {Object} serverDocument - The server document
     * @param {Object} user - The Discord user
     * @param {Object} channel - The Discord channel
     * @param {Object} usage - Usage object { prompt, completion, total }
     * @param {string} provider - Provider name
     * @param {string} model - Model name
     */
    recordUsage(serverDocument: any, user: any, channel: any, usage: any, provider: string, model: string): Promise<void>;
    /**
     * Estimate cost for token usage
     * @param {string} provider - Provider name
     * @param {string} model - Model name
     * @param {number} promptTokens - Number of prompt tokens
     * @param {number} completionTokens - Number of completion tokens
     * @returns {number} Estimated cost in USD
     */
    estimateCost(provider: string, model: string, promptTokens: number, completionTokens: number): number;
    /**
     * Get usage statistics for a guild
     * @param {Object} serverDocument - The server document
     * @param {number} topN - Number of top users to return
     * @returns {Object} Usage statistics
     */
    getStats(serverDocument: any, topN?: number): any;
    /**
     * Record image generation usage
     * @param {Object} serverDocument - The server document
     * @param {Object} user - The Discord user
     * @param {string} model - Model name (dall-e-2, dall-e-3, gpt-image-1)
     * @param {number} cost - Cost in USD
     */
    recordImageUsage(serverDocument: any, user: any, model: string, cost: number): Promise<void>;
    /**
     * Reset usage statistics for a guild
     * @param {Object} serverDocument - The server document
     */
    resetStats(serverDocument: any): Promise<void>;
}
//# sourceMappingURL=UsageTracker.d.ts.map