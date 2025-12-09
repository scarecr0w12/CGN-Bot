/**
 * CloudflareService - Centralized Cloudflare API integration
 *
 * Provides:
 * - Cache purging (full/selective)
 * - Zone analytics
 * - Security settings management
 * - Rate limiting rules
 * - DNS management
 */

const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";

// Cloudflare IP ranges for proxy trust (updated periodically)
// Source: https://www.cloudflare.com/ips/
const CF_IPV4_RANGES = [
	"103.21.244.0/22",
	"103.22.200.0/22",
	"103.31.4.0/22",
	"104.16.0.0/13",
	"104.24.0.0/14",
	"108.162.192.0/18",
	"131.0.72.0/22",
	"141.101.64.0/18",
	"162.158.0.0/15",
	"172.64.0.0/13",
	"173.245.48.0/20",
	"188.114.96.0/20",
	"190.93.240.0/20",
	"197.234.240.0/22",
	"198.41.128.0/17",
];

const CF_IPV6_RANGES = [
	"2400:cb00::/32",
	"2606:4700::/32",
	"2803:f800::/32",
	"2405:b500::/32",
	"2405:8100::/32",
	"2a06:98c0::/29",
	"2c0f:f248::/32",
];

class CloudflareService {
	constructor (config = {}) {
		this.apiToken = config.apiToken || process.env.CLOUDFLARE_API_TOKEN;
		this.zoneId = config.zoneId || process.env.CLOUDFLARE_ZONE_ID;
		this.accountId = config.accountId || process.env.CLOUDFLARE_ACCOUNT_ID;
		this.enabled = !!(this.apiToken && this.zoneId);

		if (!this.enabled) {
			logger.warn("CloudflareService: Missing API token or Zone ID - service disabled");
		}
	}

	/**
	 * Check if Cloudflare integration is enabled
	 */
	isEnabled () {
		return this.enabled;
	}

	/**
	 * Make authenticated API request to Cloudflare
	 */
	async apiRequest (endpoint, options = {}) {
		if (!this.enabled) {
			throw new Error("CloudflareService is not configured");
		}

		const url = endpoint.startsWith("http") ? endpoint : `${CLOUDFLARE_API_BASE}${endpoint}`;

		const response = await fetch(url, {
			...options,
			headers: {
				Authorization: `Bearer ${this.apiToken}`,
				"Content-Type": "application/json",
				...options.headers,
			},
		});

		const data = await response.json();

		if (!data.success) {
			const errorMsg = data.errors?.map(e => e.message).join(", ") || "Unknown Cloudflare API error";
			throw new Error(`Cloudflare API error: ${errorMsg}`);
		}

		return data;
	}

	// ============================================
	// CACHE MANAGEMENT
	// ============================================

	/**
	 * Purge entire zone cache
	 */
	async purgeAllCache () {
		logger.info("CloudflareService: Purging entire zone cache");

		return this.apiRequest(`/zones/${this.zoneId}/purge_cache`, {
			method: "POST",
			body: JSON.stringify({ purge_everything: true }),
		});
	}

	/**
	 * Purge specific URLs from cache
	 * @param {string[]} urls - Array of URLs to purge
	 */
	async purgeUrls (urls) {
		if (!Array.isArray(urls) || urls.length === 0) {
			throw new Error("URLs array is required");
		}

		// Cloudflare limits to 30 URLs per request
		const chunks = [];
		for (let i = 0; i < urls.length; i += 30) {
			chunks.push(urls.slice(i, i + 30));
		}

		logger.info(`CloudflareService: Purging ${urls.length} URLs in ${chunks.length} request(s)`);

		const results = [];
		for (const chunk of chunks) {
			const result = await this.apiRequest(`/zones/${this.zoneId}/purge_cache`, {
				method: "POST",
				body: JSON.stringify({ files: chunk }),
			});
			results.push(result);
		}

		return results;
	}

	/**
	 * Purge cache by tags (Enterprise only)
	 * @param {string[]} tags - Cache tags to purge
	 */
	async purgeTags (tags) {
		if (!Array.isArray(tags) || tags.length === 0) {
			throw new Error("Tags array is required");
		}

		logger.info(`CloudflareService: Purging cache tags: ${tags.join(", ")}`);

		return this.apiRequest(`/zones/${this.zoneId}/purge_cache`, {
			method: "POST",
			body: JSON.stringify({ tags }),
		});
	}

	/**
	 * Purge cache by prefixes
	 * @param {string[]} prefixes - URL prefixes to purge
	 */
	async purgePrefixes (prefixes) {
		if (!Array.isArray(prefixes) || prefixes.length === 0) {
			throw new Error("Prefixes array is required");
		}

		logger.info(`CloudflareService: Purging cache prefixes: ${prefixes.join(", ")}`);

		return this.apiRequest(`/zones/${this.zoneId}/purge_cache`, {
			method: "POST",
			body: JSON.stringify({ prefixes }),
		});
	}

	// ============================================
	// ANALYTICS
	// ============================================

	/**
	 * Get zone analytics summary
	 * @param {Object} options - Query options
	 * @param {string} options.since - Start time (ISO 8601 or relative like "-1440" for minutes)
	 * @param {string} options.until - End time (ISO 8601 or relative)
	 * @param {boolean} options.continuous - Include continuous data
	 */
	async getAnalytics (options = {}) {
		// Default: last 24 hours
		const params = new URLSearchParams({
			since: options.since || "-1440",
			until: options.until || "0",
			continuous: options.continuous || "true",
		});

		return this.apiRequest(`/zones/${this.zoneId}/analytics/dashboard?${params}`);
	}

	/**
	 * Get zone analytics by time period
	 * @param {string} period - "day", "week", "month"
	 */
	async getAnalyticsByPeriod (period = "day") {
		const periodMap = {
			day: "-1440",
			week: "-10080",
			month: "-43200",
		};

		const since = periodMap[period] || periodMap.day;
		return this.getAnalytics({ since });
	}

	/**
	 * Get bandwidth statistics
	 */
	async getBandwidthStats (options = {}) {
		const analytics = await this.getAnalytics(options);
		const totals = analytics.result?.totals || {};

		return {
			totalBytes: totals.bandwidth?.all || 0,
			cachedBytes: totals.bandwidth?.cached || 0,
			uncachedBytes: totals.bandwidth?.uncached || 0,
			cacheHitRatio: totals.bandwidth?.all > 0 ?
				((totals.bandwidth?.cached / totals.bandwidth?.all) * 100).toFixed(2) :
				0,
		};
	}

	/**
	 * Get request statistics
	 */
	async getRequestStats (options = {}) {
		const analytics = await this.getAnalytics(options);
		const totals = analytics.result?.totals || {};

		return {
			totalRequests: totals.requests?.all || 0,
			cachedRequests: totals.requests?.cached || 0,
			uncachedRequests: totals.requests?.uncached || 0,
			cacheHitRatio: totals.requests?.all > 0 ?
				((totals.requests?.cached / totals.requests?.all) * 100).toFixed(2) :
				0,
			byStatus: totals.requests?.http_status || {},
			byContentType: totals.requests?.content_type || {},
			byCountry: totals.requests?.country || {},
		};
	}

	/**
	 * Get threat statistics
	 */
	async getThreatStats (options = {}) {
		const analytics = await this.getAnalytics(options);
		const totals = analytics.result?.totals || {};

		return {
			totalThreats: totals.threats?.all || 0,
			byType: totals.threats?.type || {},
			byCountry: totals.threats?.country || {},
		};
	}

	// ============================================
	// SECURITY SETTINGS
	// ============================================

	/**
	 * Get current security level
	 */
	async getSecurityLevel () {
		return this.apiRequest(`/zones/${this.zoneId}/settings/security_level`);
	}

	/**
	 * Set security level
	 * @param {string} level - "off", "essentially_off", "low", "medium", "high", "under_attack"
	 */
	async setSecurityLevel (level) {
		const validLevels = ["off", "essentially_off", "low", "medium", "high", "under_attack"];
		if (!validLevels.includes(level)) {
			throw new Error(`Invalid security level. Must be one of: ${validLevels.join(", ")}`);
		}

		logger.info(`CloudflareService: Setting security level to: ${level}`);

		return this.apiRequest(`/zones/${this.zoneId}/settings/security_level`, {
			method: "PATCH",
			body: JSON.stringify({ value: level }),
		});
	}

	/**
	 * Enable "I'm Under Attack" mode
	 */
	async enableUnderAttackMode () {
		return this.setSecurityLevel("under_attack");
	}

	/**
	 * Disable "I'm Under Attack" mode (set to medium)
	 */
	async disableUnderAttackMode () {
		return this.setSecurityLevel("medium");
	}

	/**
	 * Get browser integrity check setting
	 */
	async getBrowserCheck () {
		return this.apiRequest(`/zones/${this.zoneId}/settings/browser_check`);
	}

	/**
	 * Set browser integrity check
	 * @param {boolean} enabled - Enable or disable
	 */
	async setBrowserCheck (enabled) {
		return this.apiRequest(`/zones/${this.zoneId}/settings/browser_check`, {
			method: "PATCH",
			body: JSON.stringify({ value: enabled ? "on" : "off" }),
		});
	}

	/**
	 * Get challenge TTL setting
	 */
	async getChallengeTTL () {
		return this.apiRequest(`/zones/${this.zoneId}/settings/challenge_ttl`);
	}

	/**
	 * Set challenge TTL
	 * @param {number} seconds - TTL in seconds (300 to 31536000)
	 */
	async setChallengeTTL (seconds) {
		const validValues = [300, 900, 1800, 2700, 3600, 7200, 10800, 14400, 28800, 57600, 86400, 604800, 2592000, 31536000];
		if (!validValues.includes(seconds)) {
			throw new Error(`Invalid challenge TTL. Must be one of: ${validValues.join(", ")}`);
		}

		return this.apiRequest(`/zones/${this.zoneId}/settings/challenge_ttl`, {
			method: "PATCH",
			body: JSON.stringify({ value: seconds }),
		});
	}

	// ============================================
	// FIREWALL / ACCESS RULES
	// ============================================

	/**
	 * List firewall access rules
	 */
	async listAccessRules (options = {}) {
		const params = new URLSearchParams({
			page: options.page || 1,
			per_page: options.perPage || 20,
			...options.filters,
		});

		return this.apiRequest(`/zones/${this.zoneId}/firewall/access_rules/rules?${params}`);
	}

	/**
	 * Create access rule (block/whitelist IP)
	 * @param {Object} rule - Rule configuration
	 * @param {string} rule.mode - "block", "challenge", "whitelist", "js_challenge"
	 * @param {Object} rule.configuration - { target: "ip"|"ip_range"|"country", value: "..." }
	 * @param {string} rule.notes - Optional note
	 */
	async createAccessRule (rule) {
		if (!rule.mode || !rule.configuration) {
			throw new Error("Rule mode and configuration are required");
		}

		logger.info(`CloudflareService: Creating access rule - ${rule.mode} for ${rule.configuration.value}`);

		return this.apiRequest(`/zones/${this.zoneId}/firewall/access_rules/rules`, {
			method: "POST",
			body: JSON.stringify({
				mode: rule.mode,
				configuration: rule.configuration,
				notes: rule.notes || `Created via API on ${new Date().toISOString()}`,
			}),
		});
	}

	/**
	 * Block an IP address
	 * @param {string} ip - IP address to block
	 * @param {string} notes - Optional note
	 */
	async blockIP (ip, notes) {
		return this.createAccessRule({
			mode: "block",
			configuration: { target: "ip", value: ip },
			notes: notes || `Blocked via API`,
		});
	}

	/**
	 * Whitelist an IP address
	 * @param {string} ip - IP address to whitelist
	 * @param {string} notes - Optional note
	 */
	async whitelistIP (ip, notes) {
		return this.createAccessRule({
			mode: "whitelist",
			configuration: { target: "ip", value: ip },
			notes: notes || `Whitelisted via API`,
		});
	}

	/**
	 * Delete access rule
	 * @param {string} ruleId - Rule ID to delete
	 */
	async deleteAccessRule (ruleId) {
		logger.info(`CloudflareService: Deleting access rule: ${ruleId}`);

		return this.apiRequest(`/zones/${this.zoneId}/firewall/access_rules/rules/${ruleId}`, {
			method: "DELETE",
		});
	}

	// ============================================
	// ZONE SETTINGS
	// ============================================

	/**
	 * Get all zone settings
	 */
	async getZoneSettings () {
		return this.apiRequest(`/zones/${this.zoneId}/settings`);
	}

	/**
	 * Get specific zone setting
	 * @param {string} setting - Setting name
	 */
	async getZoneSetting (setting) {
		return this.apiRequest(`/zones/${this.zoneId}/settings/${setting}`);
	}

	/**
	 * Update zone setting
	 * @param {string} setting - Setting name
	 * @param {*} value - Setting value
	 */
	async updateZoneSetting (setting, value) {
		return this.apiRequest(`/zones/${this.zoneId}/settings/${setting}`, {
			method: "PATCH",
			body: JSON.stringify({ value }),
		});
	}

	/**
	 * Get development mode status
	 */
	async getDevelopmentMode () {
		return this.apiRequest(`/zones/${this.zoneId}/settings/development_mode`);
	}

	/**
	 * Toggle development mode (disables caching for 3 hours)
	 * @param {boolean} enabled - Enable or disable
	 */
	async setDevelopmentMode (enabled) {
		logger.info(`CloudflareService: ${enabled ? "Enabling" : "Disabling"} development mode`);

		return this.apiRequest(`/zones/${this.zoneId}/settings/development_mode`, {
			method: "PATCH",
			body: JSON.stringify({ value: enabled ? "on" : "off" }),
		});
	}

	/**
	 * Get minification settings
	 */
	async getMinifySettings () {
		return this.apiRequest(`/zones/${this.zoneId}/settings/minify`);
	}

	/**
	 * Set minification settings
	 * @param {Object} settings - { css: "on"|"off", html: "on"|"off", js: "on"|"off" }
	 */
	async setMinifySettings (settings) {
		return this.apiRequest(`/zones/${this.zoneId}/settings/minify`, {
			method: "PATCH",
			body: JSON.stringify({ value: settings }),
		});
	}

	/**
	 * Get cache level
	 */
	async getCacheLevel () {
		return this.apiRequest(`/zones/${this.zoneId}/settings/cache_level`);
	}

	/**
	 * Set cache level
	 * @param {string} level - "aggressive", "basic", "simplified"
	 */
	async setCacheLevel (level) {
		const validLevels = ["aggressive", "basic", "simplified"];
		if (!validLevels.includes(level)) {
			throw new Error(`Invalid cache level. Must be one of: ${validLevels.join(", ")}`);
		}

		return this.apiRequest(`/zones/${this.zoneId}/settings/cache_level`, {
			method: "PATCH",
			body: JSON.stringify({ value: level }),
		});
	}

	/**
	 * Get browser cache TTL
	 */
	async getBrowserCacheTTL () {
		return this.apiRequest(`/zones/${this.zoneId}/settings/browser_cache_ttl`);
	}

	/**
	 * Set browser cache TTL
	 * @param {number} seconds - TTL in seconds (0 = respect origin)
	 */
	async setBrowserCacheTTL (seconds) {
		return this.apiRequest(`/zones/${this.zoneId}/settings/browser_cache_ttl`, {
			method: "PATCH",
			body: JSON.stringify({ value: seconds }),
		});
	}

	// ============================================
	// ZONE INFO
	// ============================================

	/**
	 * Get zone details
	 */
	async getZoneDetails () {
		return this.apiRequest(`/zones/${this.zoneId}`);
	}

	/**
	 * List all zones (if account ID is available)
	 */
	async listZones () {
		return this.apiRequest("/zones");
	}

	// ============================================
	// STATIC HELPERS
	// ============================================

	/**
	 * Get Cloudflare IPv4 ranges for proxy trust
	 */
	static getIPv4Ranges () {
		return [...CF_IPV4_RANGES];
	}

	/**
	 * Get Cloudflare IPv6 ranges for proxy trust
	 */
	static getIPv6Ranges () {
		return [...CF_IPV6_RANGES];
	}

	/**
	 * Get all Cloudflare IP ranges
	 */
	static getAllIPRanges () {
		return [...CF_IPV4_RANGES, ...CF_IPV6_RANGES];
	}

	/**
	 * Check if an IP is from Cloudflare
	 * @param {string} ip - IP address to check
	 */
	static isCloudflareIP (ip) {
		// Simple check - for production, use a proper IP range checker
		const ranges = CloudflareService.getAllIPRanges();
		// This is a simplified check; for accurate results, use an IP range library
		return ranges.some(range => {
			const [rangeIP] = range.split("/");
			return ip.startsWith(rangeIP.split(".").slice(0, 2).join("."));
		});
	}

	/**
	 * Get summary of current Cloudflare configuration
	 */
	async getConfigSummary () {
		if (!this.enabled) {
			return { enabled: false, message: "Cloudflare integration not configured" };
		}

		try {
			const [zone, security, devMode, cacheLevel] = await Promise.all([
				this.getZoneDetails(),
				this.getSecurityLevel(),
				this.getDevelopmentMode(),
				this.getCacheLevel(),
			]);

			return {
				enabled: true,
				zone: {
					id: zone.result.id,
					name: zone.result.name,
					status: zone.result.status,
					paused: zone.result.paused,
				},
				settings: {
					securityLevel: security.result.value,
					developmentMode: devMode.result.value,
					cacheLevel: cacheLevel.result.value,
				},
			};
		} catch (err) {
			logger.error("CloudflareService: Failed to get config summary", {}, err);
			return { enabled: true, error: err.message };
		}
	}
}

// Singleton instance
let instance = null;

module.exports = {
	CloudflareService,

	/**
	 * Get or create singleton instance
	 * @param {Object} config - Optional configuration
	 */
	getInstance (config) {
		if (!instance) {
			instance = new CloudflareService(config);
		}
		return instance;
	},

	/**
	 * Initialize new instance (replaces singleton)
	 * @param {Object} config - Configuration
	 */
	initialize (config) {
		instance = new CloudflareService(config);
		return instance;
	},

	// Export static methods
	getIPv4Ranges: CloudflareService.getIPv4Ranges,
	getIPv6Ranges: CloudflareService.getIPv6Ranges,
	getAllIPRanges: CloudflareService.getAllIPRanges,
	isCloudflareIP: CloudflareService.isCloudflareIP,
};
