const Logger = require("../../Internals/Logger");
const logger = new Logger("YouTubeMonitor");

class YouTubeMonitor {
	constructor (client) {
		this.client = client;
		this.activeAlerts = new Map();
		this.checkInterval = null;
		this.apiKey = process.env.YOUTUBE_API_KEY;
		this.apiUrl = "https://www.googleapis.com/youtube/v3";
	}

	async start () {
		if (!this.apiKey) {
			logger.warn("YouTube API key not configured. Skipping YouTube monitor.");
			return;
		}

		try {
			await this.loadAlerts();
			this.startPolling();
			logger.info("YouTube monitor started successfully");
		} catch (error) {
			logger.error("Failed to start YouTube monitor:", error);
		}
	}

	async loadAlerts () {
		const SocialAlerts = this.client.database.models.socialAlerts;
		const alerts = await SocialAlerts.find({ platform: "youtube", enabled: true }).exec();

		for (const alert of alerts) {
			this.activeAlerts.set(alert._id.toString(), alert);
		}

		logger.info(`Loaded ${alerts.length} YouTube alerts`);
	}

	startPolling () {
		if (this.checkInterval) {
			clearInterval(this.checkInterval);
		}

		this.checkInterval = setInterval(async () => {
			await this.checkChannels();
		}, 120000); // Check every 2 minutes (YouTube quota is expensive)

		// Initial check
		this.checkChannels().catch(err => logger.error("Initial channel check failed:", err));
	}

	async checkChannels () {
		if (this.activeAlerts.size === 0) return;

		try {
			// Batch alerts by unique channel IDs
			const channelIds = [...new Set([...this.activeAlerts.values()].map(a => a.account_id))];

			// YouTube API allows up to 50 channel IDs per request
			const batches = [];
			for (let i = 0; i < channelIds.length; i += 50) {
				batches.push(channelIds.slice(i, i + 50));
			}

			for (const batch of batches) {
				await this.checkBatch(batch);
			}
		} catch (error) {
			logger.error("Error checking YouTube channels:", error);
		}
	}

	async checkBatch (channelIds) {
		try {
			// Get latest videos/streams from channels
			const url = new URL(`${this.apiUrl}/search`);
			url.searchParams.set("part", "snippet");
			url.searchParams.set("channelId", channelIds.join(","));
			url.searchParams.set("order", "date");
			url.searchParams.set("maxResults", "5");
			url.searchParams.set("type", "video");
			url.searchParams.set("key", this.apiKey);

			const response = await fetch(url.toString());
			const data = await response.json();

			if (data.error) {
				logger.error("YouTube API error:", data.error.message);
				return;
			}

			// Check each alert
			for (const [alertId, alert] of this.activeAlerts) {
				if (!channelIds.includes(alert.account_id)) continue;

				// Find videos from this channel
				const channelVideos = data.items.filter(item => item.snippet.channelId === alert.account_id);

				if (channelVideos.length === 0) continue;

				const latestVideo = channelVideos[0];
				const lastVideoId = alert.last_status?.video_id;

				// New video detected
				if (latestVideo.id.videoId !== lastVideoId) {
					await this.handleNewVideo(alert, latestVideo);
				}

				// Update status
				await this.updateAlertStatus(alertId, {
					video_id: latestVideo.id.videoId,
					checked_at: new Date(),
				});
			}
		} catch (error) {
			logger.error("Error checking batch:", error);
		}
	}

	async handleNewVideo (alert, videoData) {
		logger.info(`New video detected: ${videoData.snippet.title}`);

		const manager = this.client.socialAlerts;

		if (manager) {
			const formattedData = {
				channel_name: videoData.snippet.channelTitle,
				title: videoData.snippet.title,
				url: `https://www.youtube.com/watch?v=${videoData.id.videoId}`,
				thumbnail: videoData.snippet.thumbnails.high?.url || videoData.snippet.thumbnails.default?.url,
				published_at: videoData.snippet.publishedAt,
			};

			await manager.sendAlert(alert, formattedData);
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
		logger.info(`Added YouTube alert: ${alert.account_name}`);
	}

	async removeAlert (alert) {
		this.activeAlerts.delete(alert._id.toString());
		logger.info(`Removed YouTube alert: ${alert.account_name}`);
	}

	async stop () {
		if (this.checkInterval) {
			clearInterval(this.checkInterval);
			this.checkInterval = null;
		}
		this.activeAlerts.clear();
		logger.info("YouTube monitor stopped");
	}

	async getChannelByUsername (username) {
		try {
			const url = new URL(`${this.apiUrl}/channels`);
			url.searchParams.set("part", "snippet");
			url.searchParams.set("forUsername", username);
			url.searchParams.set("key", this.apiKey);

			const response = await fetch(url.toString());
			const data = await response.json();

			return data.items?.[0] || null;
		} catch (error) {
			logger.error("Error fetching YouTube channel:", error);
			return null;
		}
	}

	async getChannelById (channelId) {
		try {
			const url = new URL(`${this.apiUrl}/channels`);
			url.searchParams.set("part", "snippet");
			url.searchParams.set("id", channelId);
			url.searchParams.set("key", this.apiKey);

			const response = await fetch(url.toString());
			const data = await response.json();

			return data.items?.[0] || null;
		} catch (error) {
			logger.error("Error fetching YouTube channel:", error);
			return null;
		}
	}
}

module.exports = YouTubeMonitor;
