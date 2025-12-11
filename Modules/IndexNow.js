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
		this.endpoint = "https://api.indexnow.org/indexnow";

		// Queue for batch submissions
		this.queue = [];
		this.flushTimer = null;
		this.flushDelay = 5000; // 5 seconds delay for batching
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
			const result = await this.makeRequest(payload);
			if (result.success) {
				logger.info(`IndexNow: Successfully submitted ${urls.length} URL(s)`, { urls });
			} else {
				logger.warn(`IndexNow: Failed to submit URLs - ${result.error}`, { urls });
			}
			return result;
		} catch (err) {
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
			const result = await this.makeRequest(payload);
			if (result.success) {
				logger.info(`IndexNow: Immediately submitted URL`, { url: fullUrl });
			}
			return result;
		} catch (err) {
			logger.error("IndexNow: Error in immediate submission", { url: fullUrl }, err);
			return { success: false, error: err.message };
		}
	}
}

module.exports = IndexNow;
