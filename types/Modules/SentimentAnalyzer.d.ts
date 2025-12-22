export = SentimentAnalyzer;
declare class SentimentAnalyzer {
    constructor(client: any);
    client: any;
    /**
     * Analyze a message for sentiment
     * @param {string} content - Message content to analyze
     * @param {Object} config - Sentiment filter configuration
     * @param {Object} serverDocument - Server document for AI fallback
     * @returns {Promise<Object>} Analysis result
     */
    analyze(content: string, config: any, serverDocument: any): Promise<any>;
    /**
     * Analyze sentiment using Google Cloud Natural Language API
     * @private
     */
    private _analyzeWithGoogle;
    /**
     * Make a request to Google Cloud NL API
     * @private
     */
    private _googleRequest;
    /**
     * Analyze sentiment using AI provider (fallback)
     * @private
     */
    private _analyzeWithAI;
    /**
     * Detect toxicity categories from content and entity analysis
     * @private
     */
    private _detectCategories;
    /**
     * Check if analysis result should trigger moderation action
     * @param {Object} result - Analysis result
     * @param {Object} config - Sentiment filter configuration
     * @returns {Object} { shouldAct: boolean, reasons: string[], severity: string }
     */
    shouldTriggerAction(result: any, config: any): any;
    /**
     * Get threshold for a sensitivity level
     * @param {string} sensitivity - Sensitivity level
     * @returns {Object} Thresholds
     */
    getThresholds(sensitivity: string): any;
    /**
     * Cache management
     * @private
     */
    private _getCacheKey;
    _getFromCache(key: any): any;
    _addToCache(key: any, result: any): void;
    /**
     * Clear cache (for testing or memory management)
     */
    clearCache(): void;
}
//# sourceMappingURL=SentimentAnalyzer.d.ts.map