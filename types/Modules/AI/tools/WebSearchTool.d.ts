export = WebSearchTool;
declare class WebSearchTool {
    name: string;
    description: string;
    /**
     * Execute a web search
     * @param {Object} options - Search options
     * @param {string} options.query - Search query
     * @param {number} options.limit - Max results
     * @param {Object} options.config - Tool configuration
     * @returns {Promise<string>} Formatted search results
     */
    execute({ query, limit, config }: {
        query: string;
        limit: number;
        config: any;
    }): Promise<string>;
    /**
     * Search using DuckDuckGo Instant Answer API
     * @private
     */
    private _searchDuckDuckGo;
    /**
     * Search using SerpAPI
     * @private
     */
    private _searchSerp;
    /**
     * Format search results for display
     * @private
     */
    private _formatResults;
}
//# sourceMappingURL=WebSearchTool.d.ts.map