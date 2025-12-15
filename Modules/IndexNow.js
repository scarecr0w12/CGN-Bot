/**
 * IndexNow Module - Notifies search engines about URL changes
 * https://www.indexnow.org/
 *
 * Supports Bing, Yandex, and other IndexNow-compatible search engines
 */

const https = require("https");

class IndexNow {
	constructor (client) {
		this.client = client;
		this.key = process.env.INDEXNOW_API_KEY;
		this.enabled = !!this.key;
		this.endpoint = process.env.INDEXNOW_ENDPOINT || "https://api.indexnow.org/indexnow";

		// Queue for batch submissions
		this.queue = [];
		this.flushTimer = null;
		this.flushDelay = 5000; // 5 seconds delay for batching

		// Stats tracking
		this.stats = {
			submitted: 0,
			succeeded: 0,
			failed: 0,
			lastSubmission: null,
			lastError: null,
			lastResponse: null,
		};
	}

	/**
	 * Get the host URL from config
	 */
	getHost () {
		if (!this.client?.configJS?.hostingURL) return null;
		try {
			const url = new URL(this.client.configJS.hostingURL);
			return url.host;
		} catch {
			return null;
		}
	}

	/**
	 * Get current stats
	 */
	getStats () {
		return {
			...this.stats,
			enabled: this.enabled,
			queueLength: this.queue.length,
			host: this.getHost(),
			keyConfigured: !!this.key,
		};
	}

	/**
	 * Submit a single URL to IndexNow
	 * @param {string} urlPath - The URL path (e.g., "/blog/my-post")
	 */
	async submitUrl (urlPath) {
		if (!this.enabled) {
			logger.debug("IndexNow: Skipping submission - API key not configured");
			return false;
		}

		const host = this.getHost();
		if (!host) {
			logger.warn("IndexNow: Cannot submit - hosting URL not configured");
			return false;
		}

		const fullUrl = `${this.client.configJS.hostingURL.replace(/\/$/, "")}${urlPath}`;

		// Add to queue for batch processing
		if (!this.queue.includes(fullUrl)) {
			this.queue.push(fullUrl);
		}

		// Set up flush timer if not already set
		if (!this.flushTimer) {
			this.flushTimer = setTimeout(() => this.flush(), this.flushDelay);
		}

		return true;
	}

	/**
	 * Submit multiple URLs at once
	 * @param {string[]} urlPaths - Array of URL paths
	 */
	async submitUrls (urlPaths) {
		for (const path of urlPaths) {
			await this.submitUrl(path);
		}
	}

	/**
	 * Flush the queue and submit all pending URLs
	 */
	async flush () {
		this.flushTimer = null;

		if (this.queue.length === 0) return;

		const urls = [...this.queue];
		this.queue = [];

		const host = this.getHost();
		if (!host) return;

		const payload = {
			host,
			key: this.key,
			keyLocation: `${this.client.configJS.hostingURL.replace(/\/$/, "")}/${this.key}.txt`,
			urlList: urls,
		};

		try {
			logger.info(`IndexNow: Submitting ${urls.length} URL(s) to search engines`, { urls });
			const result = await this.makeRequest(payload);
			this.stats.submitted += urls.length;
			this.stats.lastSubmission = new Date().toISOString();
			this.stats.lastResponse = result;

			if (result.success) {
				this.stats.succeeded += urls.length;
				logger.info(`IndexNow: Successfully submitted ${urls.length} URL(s)`, { urls, statusCode: result.statusCode });
			} else {
				this.stats.failed += urls.length;
				this.stats.lastError = result.error;
				// Log more details for debugging
				if (result.statusCode === 403) {
					logger.error(`IndexNow: Key verification failed (403) - Ensure site is verified in Bing Webmaster Tools`, {
						urls,
						error: result.error,
						keyLocation: payload.keyLocation,
						host: payload.host,
					});
				} else if (result.statusCode === 422) {
					logger.error(`IndexNow: URL/host mismatch (422) - URLs must match the host domain`, {
						urls,
						error: result.error,
						host: payload.host,
					});
				} else {
					logger.warn(`IndexNow: Failed to submit URLs - ${result.error}`, { urls, statusCode: result.statusCode });
				}
			}
			return result;
		} catch (err) {
			this.stats.failed += urls.length;
			this.stats.lastError = err.message;
			logger.error("IndexNow: Error submitting URLs", { urls }, err);
			return { success: false, error: err.message };
		}
	}

	/**
	 * Make HTTP request to IndexNow API
	 * @param {object} payload - The request payload
	 */
	makeRequest (payload) {
		return new Promise((resolve, reject) => {
			const data = JSON.stringify(payload);
			const url = new URL(this.endpoint);

			const options = {
				hostname: url.hostname,
				port: 443,
				path: url.pathname,
				method: "POST",
				headers: {
					"Content-Type": "application/json; charset=utf-8",
					"Content-Length": Buffer.byteLength(data),
				},
			};

			const req = https.request(options, res => {
				let body = "";
				res.on("data", chunk => { body += chunk; });
				res.on("end", () => {
					// IndexNow returns:
					// 200 - OK, URL submitted successfully
					// 202 - Accepted, URL received
					// 400 - Bad request, invalid format
					// 403 - Forbidden, key not valid
					// 422 - Unprocessable Entity, URLs don't belong to host
					// 429 - Too Many Requests, rate limited
					if (res.statusCode === 200 || res.statusCode === 202) {
						resolve({ success: true, statusCode: res.statusCode });
					} else {
						resolve({
							success: false,
							statusCode: res.statusCode,
							error: `HTTP ${res.statusCode}: ${body || res.statusMessage}`,
						});
					}
				});
			});

			req.on("error", err => reject(err));
			req.write(data);
			req.end();
		});
	}

	/**
	 * Submit URL immediately without batching (for important updates)
	 * @param {string} urlPath - The URL path
	 */
	async submitImmediate (urlPath) {
		if (!this.enabled) return false;

		const host = this.getHost();
		if (!host) return false;

		const fullUrl = `${this.client.configJS.hostingURL.replace(/\/$/, "")}${urlPath}`;

		const payload = {
			host,
			key: this.key,
			keyLocation: `${this.client.configJS.hostingURL.replace(/\/$/, "")}/${this.key}.txt`,
			urlList: [fullUrl],
		};

		try {
			logger.info(`IndexNow: Immediately submitting URL`, { url: fullUrl });
			const result = await this.makeRequest(payload);
			this.stats.submitted += 1;
			this.stats.lastSubmission = new Date().toISOString();
			this.stats.lastResponse = result;

			if (result.success) {
				this.stats.succeeded += 1;
				logger.info(`IndexNow: Immediately submitted URL successfully`, { url: fullUrl, statusCode: result.statusCode });
			} else {
				this.stats.failed += 1;
				this.stats.lastError = result.error;
				logger.warn(`IndexNow: Immediate submission failed`, { url: fullUrl, error: result.error, statusCode: result.statusCode });
			}
			return result;
		} catch (err) {
			this.stats.failed += 1;
			this.stats.lastError = err.message;
			logger.error("IndexNow: Error in immediate submission", { url: fullUrl }, err);
			return { success: false, error: err.message };
		}
	}

	/**
	 * Test the IndexNow configuration by submitting the homepage
	 * @returns {object} Test result with diagnostic info
	 */
	async testConfiguration () {
		const host = this.getHost();
		const hostingURL = this.client?.configJS?.hostingURL?.replace(/\/$/, "");

		const diagnostics = {
			enabled: this.enabled,
			keyConfigured: !!this.key,
			keyLength: this.key?.length || 0,
			host,
			hostingURL,
			keyLocation: hostingURL ? `${hostingURL}/${this.key}.txt` : null,
			stats: this.stats,
		};

		if (!this.enabled) {
			return {
				success: false,
				error: "IndexNow API key not configured. Set INDEXNOW_API_KEY in .env",
				diagnostics,
			};
		}

		if (!host) {
			return {
				success: false,
				error: "Hosting URL not configured in config.js",
				diagnostics,
			};
		}

		// Test submission with homepage
		const testUrl = hostingURL;
		const payload = {
			host,
			key: this.key,
			keyLocation: `${hostingURL}/${this.key}.txt`,
			urlList: [testUrl],
		};

		try {
			logger.info("IndexNow: Running configuration test", { testUrl });
			const result = await this.makeRequest(payload);

			return {
				success: result.success,
				statusCode: result.statusCode,
				error: result.error || null,
				diagnostics,
				troubleshooting: result.success ? null : this.getTroubleshootingTips(result.statusCode),
			};
		} catch (err) {
			return {
				success: false,
				error: err.message,
				diagnostics,
			};
		}
	}

	/**
	 * Get troubleshooting tips based on error code
	 */
	getTroubleshootingTips (statusCode) {
		const tips = {
			403: [
				"The site needs to be verified in Bing Webmaster Tools",
				"Visit https://www.bing.com/webmasters to add and verify your site",
				"Ensure the key file is accessible at the keyLocation URL",
				"The key in the file must match INDEXNOW_API_KEY exactly",
			],
			422: [
				"The submitted URLs don't match the host domain",
				"Ensure hostingURL in config.js matches your actual domain",
				"Check that the key matches the domain ownership",
			],
			429: [
				"Too many requests - you're being rate limited",
				"Wait a few minutes before trying again",
				"Consider reducing submission frequency",
			],
			400: [
				"Invalid request format",
				"Check that the API key is a valid format (alphanumeric)",
			],
		};
		return tips[statusCode] || ["Unknown error - check IndexNow documentation"];
	}
}

module.exports = IndexNow;
