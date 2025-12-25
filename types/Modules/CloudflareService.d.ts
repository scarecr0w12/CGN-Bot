export class CloudflareService {
    /**
     * Get Cloudflare IPv4 ranges for proxy trust
     */
    static getIPv4Ranges(): string[];
    /**
     * Get Cloudflare IPv6 ranges for proxy trust
     */
    static getIPv6Ranges(): string[];
    /**
     * Get all Cloudflare IP ranges
     */
    static getAllIPRanges(): string[];
    /**
     * Check if an IP is from Cloudflare
     * @param {string} ip - IP address to check
     */
    static isCloudflareIP(ip: string): boolean;
    constructor(config?: {});
    apiToken: any;
    zoneId: any;
    accountId: any;
    enabled: boolean;
    /**
     * Check if Cloudflare integration is enabled
     */
    isEnabled(): boolean;
    /**
     * Make authenticated API request to Cloudflare
     */
    apiRequest(endpoint: any, options?: {}): Promise<unknown>;
    /**
     * Purge entire zone cache
     */
    purgeAllCache(): Promise<unknown>;
    /**
     * Purge specific URLs from cache
     * @param {string[]} urls - Array of URLs to purge
     */
    purgeUrls(urls: string[]): Promise<unknown[]>;
    /**
     * Purge cache by tags (Enterprise only)
     * @param {string[]} tags - Cache tags to purge
     */
    purgeTags(tags: string[]): Promise<unknown>;
    /**
     * Purge cache by prefixes
     * @param {string[]} prefixes - URL prefixes to purge
     */
    purgePrefixes(prefixes: string[]): Promise<unknown>;
    /**
     * Get zone analytics via GraphQL API (replaces deprecated /analytics/dashboard)
     * @param {Object} options - Query options
     * @param {number} options.days - Number of days to look back (default: 1)
     */
    getAnalytics(options?: {
        days: number;
    }): Promise<{
        result: {
            totals: any;
        };
    }>;
    /**
     * Get zone analytics by time period
     * @param {string} period - "day", "week", "month"
     */
    getAnalyticsByPeriod(period?: string): Promise<{
        result: {
            totals: any;
        };
    }>;
    /**
     * Get bandwidth statistics
     */
    getBandwidthStats(options?: {}): Promise<{
        totalBytes: any;
        cachedBytes: any;
        uncachedBytes: number;
        cacheHitRatio: string | number;
    }>;
    /**
     * Get request statistics
     */
    getRequestStats(options?: {}): Promise<{
        totalRequests: any;
        cachedRequests: any;
        uncachedRequests: number;
        cacheHitRatio: string | number;
    }>;
    /**
     * Get threat statistics
     */
    getThreatStats(options?: {}): Promise<{
        totalThreats: any;
    }>;
    /**
     * Get current security level
     */
    getSecurityLevel(): Promise<unknown>;
    /**
     * Set security level
     * @param {string} level - "off", "essentially_off", "low", "medium", "high", "under_attack"
     */
    setSecurityLevel(level: string): Promise<unknown>;
    /**
     * Enable "I'm Under Attack" mode
     */
    enableUnderAttackMode(): Promise<unknown>;
    /**
     * Disable "I'm Under Attack" mode (set to medium)
     */
    disableUnderAttackMode(): Promise<unknown>;
    /**
     * Get browser integrity check setting
     */
    getBrowserCheck(): Promise<unknown>;
    /**
     * Set browser integrity check
     * @param {boolean} enabled - Enable or disable
     */
    setBrowserCheck(enabled: boolean): Promise<unknown>;
    /**
     * Get challenge TTL setting
     */
    getChallengeTTL(): Promise<unknown>;
    /**
     * Set challenge TTL
     * @param {number} seconds - TTL in seconds (300 to 31536000)
     */
    setChallengeTTL(seconds: number): Promise<unknown>;
    /**
     * List firewall access rules
     */
    listAccessRules(options?: {}): Promise<unknown>;
    /**
     * Create access rule (block/whitelist IP)
     * @param {Object} rule - Rule configuration
     * @param {string} rule.mode - "block", "challenge", "whitelist", "js_challenge"
     * @param {Object} rule.configuration - { target: "ip"|"ip_range"|"country", value: "..." }
     * @param {string} rule.notes - Optional note
     */
    createAccessRule(rule: {
        mode: string;
        configuration: any;
        notes: string;
    }): Promise<unknown>;
    /**
     * Block an IP address
     * @param {string} ip - IP address to block
     * @param {string} notes - Optional note
     */
    blockIP(ip: string, notes: string): Promise<unknown>;
    /**
     * Whitelist an IP address
     * @param {string} ip - IP address to whitelist
     * @param {string} notes - Optional note
     */
    whitelistIP(ip: string, notes: string): Promise<unknown>;
    /**
     * Delete access rule
     * @param {string} ruleId - Rule ID to delete
     */
    deleteAccessRule(ruleId: string): Promise<unknown>;
    /**
     * Get all zone settings
     */
    getZoneSettings(): Promise<unknown>;
    /**
     * Get specific zone setting
     * @param {string} setting - Setting name
     */
    getZoneSetting(setting: string): Promise<unknown>;
    /**
     * Update zone setting
     * @param {string} setting - Setting name
     * @param {*} value - Setting value
     */
    updateZoneSetting(setting: string, value: any): Promise<unknown>;
    /**
     * Get development mode status
     */
    getDevelopmentMode(): Promise<unknown>;
    /**
     * Toggle development mode (disables caching for 3 hours)
     * @param {boolean} enabled - Enable or disable
     */
    setDevelopmentMode(enabled: boolean): Promise<unknown>;
    /**
     * Get minification settings
     */
    getMinifySettings(): Promise<unknown>;
    /**
     * Set minification settings
     * @param {Object} settings - { css: "on"|"off", html: "on"|"off", js: "on"|"off" }
     */
    setMinifySettings(settings: any): Promise<unknown>;
    /**
     * Get cache level
     */
    getCacheLevel(): Promise<unknown>;
    /**
     * Set cache level
     * @param {string} level - "aggressive", "basic", "simplified"
     */
    setCacheLevel(level: string): Promise<unknown>;
    /**
     * Get browser cache TTL
     */
    getBrowserCacheTTL(): Promise<unknown>;
    /**
     * Set browser cache TTL
     * @param {number} seconds - TTL in seconds (0 = respect origin)
     */
    setBrowserCacheTTL(seconds: number): Promise<unknown>;
    /**
     * Get zone details
     */
    getZoneDetails(): Promise<unknown>;
    /**
     * List all zones (if account ID is available)
     */
    listZones(): Promise<unknown>;
    /**
     * Get summary of current Cloudflare configuration
     */
    getConfigSummary(): Promise<{
        enabled: boolean;
        message: string;
        zone?: undefined;
        settings?: undefined;
        error?: undefined;
    } | {
        enabled: boolean;
        zone: {
            id: any;
            name: any;
            status: any;
            paused: any;
        };
        settings: {
            securityLevel: any;
            developmentMode: any;
            cacheLevel: any;
        };
        message?: undefined;
        error?: undefined;
    } | {
        enabled: boolean;
        error: any;
        message?: undefined;
        zone?: undefined;
        settings?: undefined;
    }>;
}
/**
 * Get or create singleton instance
 * @param {Object} config - Optional configuration
 */
export declare function getInstance(config: any): any;
/**
 * Initialize new instance (replaces singleton)
 * @param {Object} config - Configuration
 */
export declare function initialize(config: any): CloudflareService;
import getIPv4Ranges = CloudflareService.getIPv4Ranges;
import getIPv6Ranges = CloudflareService.getIPv6Ranges;
import getAllIPRanges = CloudflareService.getAllIPRanges;
import isCloudflareIP = CloudflareService.isCloudflareIP;
export { getIPv4Ranges, getIPv6Ranges, getAllIPRanges, isCloudflareIP };
//# sourceMappingURL=CloudflareService.d.ts.map