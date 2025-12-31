const Logger = require("../../Internals/Logger");
const logger = new Logger("TwitchMonitor");

class TwitchMonitor {
	constructor (client) {
		this.client = client;
		this.activeAlerts = new Map();
		this.checkInterval = null;
		this.apiUrl = "https://api.twitch.tv/helix";
		this.clientId = process.env.TWITCH_CLIENT_ID;
		this.clientSecret = process.env.TWITCH_CLIENT_SECRET;
		this.accessToken = null;
	}

	async start () {
		if (!this.clientId || !this.clientSecret) {
			logger.warn("Twitch API credentials not configured. Skipping Twitch monitor.");
			return;
		}

		try {
			await this.authenticate();
			await this.loadAlerts();
			this.startPolling();
			logger.info("Twitch monitor started successfully");
		} catch (error) {
			logger.error("Failed to start Twitch monitor:", error);
		}
	}

	async authenticate () {
		try {
			const response = await fetch("https://id.twitch.tv/oauth2/token", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					client_id: this.clientId,
					client_secret: this.clientSecret,
					grant_type: "client_credentials",
				}),
			});

			const data = await response.json();
			this.accessToken = data.access_token;
			logger.info("Twitch authentication successful");
		} catch (error) {
			logger.error("Twitch authentication failed:", error);
			throw error;
		}
	}

	async loadAlerts () {
		const SocialAlerts = this.client.database.models.socialAlerts;
		const alerts = await SocialAlerts.find({ platform: "twitch", enabled: true }).exec();

		for (const alert of alerts) {
			this.activeAlerts.set(alert._id.toString(), alert);
		}

		logger.info(`Loaded ${alerts.length} Twitch alerts`);
	}

	startPolling () {
		if (this.checkInterval) {
			clearInterval(this.checkInterval);
		}

		this.checkInterval = setInterval(async () => {
			await this.checkStreams();
		}, 60000); // Check every minute

		// Initial check
		this.checkStreams().catch(err => logger.error("Initial stream check failed:", err));
	}

	async checkStreams () {
		if (this.activeAlerts.size === 0) return;

		try {
			// Batch alerts by unique account IDs
			const accountIds = [...new Set([...this.activeAlerts.values()].map(a => a.account_id))];

			// Twitch API allows up to 100 user IDs per request
			const batches = [];
			for (let i = 0; i < accountIds.length; i += 100) {
				batches.push(accountIds.slice(i, i + 100));
			}

			for (const batch of batches) {
				await this.checkBatch(batch);
			}
		} catch (error) {
			logger.error("Error checking Twitch streams:", error);
		}
	}

	async checkBatch (userIds) {
		try {
			const url = new URL(`${this.apiUrl}/streams`);
			userIds.forEach(id => url.searchParams.append("user_id", id));

			const response = await fetch(url.toString(), {
				headers: {
					"Client-ID": this.clientId,
					"Authorization": `Bearer ${this.accessToken}`,
				},
			});

			if (response.status === 401) {
				// Token expired, reauthenticate
				await this.authenticate();
				return await this.checkBatch(userIds);
			}

			const data = await response.json();
			const liveStreams = new Map(data.data.map(s => [s.user_id, s]));

			// Check each alert
			for (const [alertId, alert] of this.activeAlerts) {
				if (!userIds.includes(alert.account_id)) continue;

				const stream = liveStreams.get(alert.account_id);
				const wasLive = alert.last_status && alert.last_status.is_live;
				const isLive = !!stream;

				// Stream went live
				if (isLive && !wasLive) {
					await this.handleStreamLive(alert, stream);
				}

				// Update status
				await this.updateAlertStatus(alertId, {
					is_live: isLive,
					checked_at: new Date(),
					stream_data: stream || null,
				});
			}
		} catch (error) {
			logger.error("Error checking batch:", error);
		}
	}

	async handleStreamLive (alert, streamData) {
		logger.info(`Stream went live: ${streamData.user_name}`);

		const manager = this.client.socialAlerts;

		if (manager) {
			await manager.sendAlert(alert, streamData);
		}
	}

	async updateAlertStatus (alertId, status) {
		const SocialAlerts = this.client.database.models.socialAlerts;
		await SocialAlerts.update(
			{ _id: alertId },
			{
				last_check: status.checked_at,
				last_status: status,
			}
		);

		// Update in-memory cache
		const alert = this.activeAlerts.get(alertId);
		if (alert) {
			alert.last_status = status;
			alert.last_check = status.checked_at;
		}
	}

	async addAlert (alert) {
		this.activeAlerts.set(alert._id.toString(), alert);
		logger.info(`Added Twitch alert: ${alert.account_name}`);
	}

	async removeAlert (alert) {
		this.activeAlerts.delete(alert._id.toString());
		logger.info(`Removed Twitch alert: ${alert.account_name}`);
	}

	async stop () {
		if (this.checkInterval) {
			clearInterval(this.checkInterval);
			this.checkInterval = null;
		}
		this.activeAlerts.clear();
		logger.info("Twitch monitor stopped");
	}

	async getUserByLogin (login) {
		try {
			const response = await fetch(`${this.apiUrl}/users?login=${login}`, {
				headers: {
					"Client-ID": this.clientId,
					"Authorization": `Bearer ${this.accessToken}`,
				},
			});

			const data = await response.json();
			return data.data[0] || null;
		} catch (error) {
			logger.error("Error fetching Twitch user:", error);
			return null;
		}
	}
}

module.exports = TwitchMonitor;
