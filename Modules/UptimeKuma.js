/**
 * Uptime Kuma API Client
 * Provides integration with Uptime Kuma for status page data
 */

const { UPTIME_KUMA_URL = "http://uptime-kuma:3001", UPTIME_KUMA_API_KEY, UPTIME_KUMA_STATUS_PAGE_SLUG = "status" } = process.env;

class UptimeKumaClient {
	constructor () {
		this.baseUrl = UPTIME_KUMA_URL;
		this.apiKey = UPTIME_KUMA_API_KEY;
		this.statusPageSlug = UPTIME_KUMA_STATUS_PAGE_SLUG;
		this.cache = {
			statusPage: null,
			heartbeats: null,
			lastFetch: 0,
		};
		// 30 seconds cache
		this.cacheTTL = 30000;
	}

	/**
	 * Check if Uptime Kuma is configured
	 */
	isConfigured () {
		return Boolean(this.baseUrl);
	}

	/**
	 * Make an API request to Uptime Kuma
	 */
	async request (endpoint, options = {}) {
		const url = `${this.baseUrl}${endpoint}`;
		const headers = {
			"Content-Type": "application/json",
			...this.apiKey && { Authorization: `Bearer ${this.apiKey}` },
		};

		try {
			const response = await fetch(url, {
				...options,
				headers: { ...headers, ...options.headers },
				signal: AbortSignal.timeout(30000),
			});

			if (!response.ok) {
				throw new Error(`Uptime Kuma API error: ${response.status} ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			if (error.name === "TimeoutError" || error.code === "ECONNREFUSED") {
				logger.debug("Uptime Kuma is not reachable", {}, error);
				return null;
			}
			throw error;
		}
	}

	/**
	 * Get public status page data (no auth required)
	 */
	async getStatusPage () {
		const now = Date.now();
		if (this.cache.statusPage && now - this.cache.lastFetch < this.cacheTTL) {
			return this.cache.statusPage;
		}

		try {
			const data = await this.request(`/api/status-page/${this.statusPageSlug}`);
			if (data) {
				this.cache.statusPage = data;
				this.cache.lastFetch = now;
			}
			return data;
		} catch (error) {
			logger.warn("Failed to fetch Uptime Kuma status page", {}, error);
			return this.cache.statusPage || null;
		}
	}

	/**
	 * Get heartbeat data for the status page (no auth required)
	 */
	async getHeartbeats () {
		const now = Date.now();
		if (this.cache.heartbeats && now - this.cache.lastFetch < this.cacheTTL) {
			return this.cache.heartbeats;
		}

		try {
			const data = await this.request(`/api/status-page/heartbeat/${this.statusPageSlug}`);
			if (data) {
				this.cache.heartbeats = data;
				this.cache.lastFetch = now;
			}
			return data;
		} catch (error) {
			logger.warn("Failed to fetch Uptime Kuma heartbeats", {}, error);
			return this.cache.heartbeats || null;
		}
	}

	/**
	 * Get combined status data for display
	 */
	async getStatusData () {
		if (!this.isConfigured()) {
			return {
				configured: false,
				available: false,
				statusPage: null,
				heartbeats: null,
				monitors: [],
			};
		}

		const [statusPage, heartbeats] = await Promise.all([
			this.getStatusPage(),
			this.getHeartbeats(),
		]);

		if (!statusPage || !heartbeats) {
			return {
				configured: true,
				available: false,
				statusPage: null,
				heartbeats: null,
				monitors: [],
			};
		}

		// Process monitors with their heartbeat data
		const monitors = this.processMonitors(statusPage, heartbeats);

		return {
			configured: true,
			available: true,
			statusPage: {
				title: (statusPage.config && statusPage.config.title) || "Status",
				description: (statusPage.config && statusPage.config.description) || "",
				incident: statusPage.incident,
			},
			heartbeats: heartbeats.heartbeatList || {},
			monitors,
			overallStatus: this.calculateOverallStatus(monitors),
			uptimePercentage: this.calculateUptimePercentage(heartbeats.heartbeatList || {}),
		};
	}

	/**
	 * Process monitors from status page and heartbeat data
	 */
	processMonitors (statusPage, heartbeats) {
		const monitors = [];
		const heartbeatList = heartbeats.heartbeatList || {};
		const uptimeList = heartbeats.uptimeList || {};

		// Extract monitors from public groups
		if (statusPage.publicGroupList) {
			for (const group of statusPage.publicGroupList) {
				for (const monitor of group.monitorList || []) {
					const monitorHeartbeats = heartbeatList[monitor.id] || [];
					const latestHeartbeat = monitorHeartbeats[monitorHeartbeats.length - 1];
					const uptime24h = uptimeList[`${monitor.id}_24`] || 0;
					const uptime30d = uptimeList[`${monitor.id}_720`] || 0;

					monitors.push({
						id: monitor.id,
						name: monitor.name,
						type: monitor.type,
						group: group.name,
						status: latestHeartbeat ? latestHeartbeat.status : -1,
						statusText: this.getStatusText(latestHeartbeat ? latestHeartbeat.status : undefined),
						statusClass: this.getStatusClass(latestHeartbeat ? latestHeartbeat.status : undefined),
						ping: (latestHeartbeat && latestHeartbeat.ping) || null,
						uptime24h: (uptime24h * 100).toFixed(2),
						uptime30d: (uptime30d * 100).toFixed(2),
						heartbeats: monitorHeartbeats.slice(-50).map(hb => ({
							status: hb.status,
							time: hb.time,
							ping: hb.ping,
						})),
					});
				}
			}
		}

		return monitors;
	}

	/**
	 * Get status text from status code
	 */
	getStatusText (status) {
		switch (status) {
			case 1: return "Up";
			case 0: return "Down";
			case 2: return "Pending";
			case 3: return "Maintenance";
			default: return "Unknown";
		}
	}

	/**
	 * Get CSS class for status
	 */
	getStatusClass (status) {
		switch (status) {
			case 1: return "success";
			case 0: return "danger";
			case 2: return "warning";
			case 3: return "info";
			default: return "dark";
		}
	}

	/**
	 * Calculate overall status from all monitors
	 */
	calculateOverallStatus (monitors) {
		if (!monitors.length) return { status: -1, text: "No Monitors", class: "dark" };

		const hasDown = monitors.some(m => m.status === 0);
		const hasPending = monitors.some(m => m.status === 2);
		const hasMaintenance = monitors.some(m => m.status === 3);

		if (hasDown) return { status: 0, text: "Partial Outage", class: "danger" };
		if (hasMaintenance) return { status: 3, text: "Maintenance", class: "info" };
		if (hasPending) return { status: 2, text: "Degraded", class: "warning" };

		const allUp = monitors.every(m => m.status === 1);
		if (allUp) return { status: 1, text: "All Systems Operational", class: "success" };

		return { status: -1, text: "Unknown", class: "dark" };
	}

	/**
	 * Calculate average uptime percentage across all monitors
	 */
	calculateUptimePercentage (heartbeatList) {
		const monitorIds = Object.keys(heartbeatList);
		if (!monitorIds.length) return 0;

		let totalUptime = 0;
		let totalCount = 0;

		for (const id of monitorIds) {
			const heartbeats = heartbeatList[id] || [];
			const upCount = heartbeats.filter(hb => hb.status === 1).length;
			totalUptime += upCount;
			totalCount += heartbeats.length;
		}

		if (totalCount === 0) return 0;
		return ((totalUptime / totalCount) * 100).toFixed(2);
	}

	/**
	 * Clear the cache
	 */
	clearCache () {
		this.cache = {
			statusPage: null,
			heartbeats: null,
			lastFetch: 0,
		};
	}
}

// Export singleton instance
module.exports = new UptimeKumaClient();
