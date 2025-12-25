export = IndexNow;
declare class IndexNow {
    constructor(client: any);
    client: any;
    key: string;
    enabled: boolean;
    endpoint: string;
    queue: any[];
    flushTimer: NodeJS.Timeout;
    flushDelay: number;
    stats: {
        submitted: number;
        succeeded: number;
        failed: number;
        lastSubmission: any;
        lastError: any;
        lastResponse: any;
    };
    /**
     * Get the host URL from config
     */
    getHost(): string;
    /**
     * Get current stats
     */
    getStats(): {
        enabled: boolean;
        queueLength: number;
        host: string;
        keyConfigured: boolean;
        submitted: number;
        succeeded: number;
        failed: number;
        lastSubmission: any;
        lastError: any;
        lastResponse: any;
    };
    /**
     * Submit a single URL to IndexNow
     * @param {string} urlPath - The URL path (e.g., "/blog/my-post")
     */
    submitUrl(urlPath: string): Promise<boolean>;
    /**
     * Submit multiple URLs at once
     * @param {string[]} urlPaths - Array of URL paths
     */
    submitUrls(urlPaths: string[]): Promise<void>;
    /**
     * Flush the queue and submit all pending URLs
     */
    flush(): Promise<any>;
    /**
     * Make HTTP request to IndexNow API
     * @param {object} payload - The request payload
     */
    makeRequest(payload: object): Promise<any>;
    /**
     * Submit URL immediately without batching (for important updates)
     * @param {string} urlPath - The URL path
     */
    submitImmediate(urlPath: string): Promise<any>;
    /**
     * Test the IndexNow configuration by submitting the homepage
     * @returns {object} Test result with diagnostic info
     */
    testConfiguration(): object;
    /**
     * Get troubleshooting tips based on error code
     */
    getTroubleshootingTips(statusCode: any): any;
}
//# sourceMappingURL=IndexNow.d.ts.map