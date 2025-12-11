/**
 * WebhookDispatcher - Manages custom webhook integrations for premium servers
 *
 * Allows servers to send event notifications to external webhooks.
 * Premium feature gated by `webhook_integrations` (per-server).
 */

const fetch = require("node-fetch");
const TierManager = require("./TierManager");

// Supported webhook events
const WEBHOOK_EVENTS = {
	MEMBER_JOIN: "member_join",
	MEMBER_LEAVE: "member_leave",
	MESSAGE_DELETE: "message_delete",
	MEMBER_BAN: "member_ban",
	MEMBER_UNBAN: "member_unban",
	ROLE_UPDATE: "role_update",
	CHANNEL_CREATE: "channel_create",
	CHANNEL_DELETE: "channel_delete",
	COMMAND_USED: "command_used",
	MODERATION_ACTION: "moderation_action",
};

// Webhook delivery status
const DELIVERY_STATUS = {
	PENDING: "pending",
	SUCCESS: "success",
	FAILED: "failed",
	RETRYING: "retrying",
};

class WebhookDispatcher {
	constructor (client) {
		this.client = client;
		this.queue = [];
		this.retryAttempts = 3;
		// 5 seconds retry delay
		this.retryDelay = 5000;
		this.processing = false;
	}

	/**
	 * Check if a server has webhook integrations enabled
	 * @param {string} serverId - Server/guild ID
	 * @returns {Promise<boolean>}
	 */
	async hasWebhookAccess (serverId) {
		return TierManager.canAccess(serverId, "webhook_integrations");
	}

	/**
	 * Register a webhook for a server
	 * @param {Object} serverDocument - Server document
	 * @param {Object} webhookConfig - Webhook configuration
	 * @returns {Object} Created webhook info
	 */
	async registerWebhook (serverDocument, webhookConfig) {
		const { url, events, name, secret } = webhookConfig;

		if (!url || !events || events.length === 0) {
			throw new Error("Invalid webhook configuration");
		}

		// Validate URL
		try {
			const testUrl = new URL(url);
			if (!testUrl) throw new Error("Invalid");
		} catch {
			throw new Error("Invalid webhook URL");
		}

		// Validate events
		const validEvents = events.filter(e => Object.values(WEBHOOK_EVENTS).includes(e));
		if (validEvents.length === 0) {
			throw new Error("No valid events specified");
		}

		const webhook = {
			id: `wh_${Date.now()}_${Math.random().toString(36).substring(7)}`,
			name: name || "Custom Webhook",
			url,
			events: validEvents,
			secret: secret || null,
			enabled: true,
			created_at: new Date(),
			last_triggered: null,
			failure_count: 0,
		};

		// Add to server document
		if (!serverDocument.config.webhooks) {
			serverDocument.config.webhooks = [];
		}
		serverDocument.config.webhooks.push(webhook);

		return webhook;
	}

	/**
	 * Dispatch an event to all subscribed webhooks
	 * @param {string} guildId - Guild ID
	 * @param {string} event - Event type
	 * @param {Object} payload - Event payload
	 */
	async dispatch (guildId, event, payload) {
		try {
			const serverDocument = await Servers.findOne(guildId);
			if (!serverDocument?.config?.webhooks?.length) return;

			// Get server owner for premium check
			const guild = this.client.guilds.cache.get(guildId);
			if (!guild) return;

			const hasAccess = await this.hasWebhookAccess(guild.ownerId);
			if (!hasAccess) return;

			// Find webhooks subscribed to this event
			const subscribedWebhooks = serverDocument.config.webhooks.filter(
				wh => wh.enabled && wh.events.includes(event),
			);

			for (const webhook of subscribedWebhooks) {
				this.queue.push({
					webhook,
					event,
					payload: {
						event,
						guild_id: guildId,
						timestamp: new Date().toISOString(),
						data: payload,
					},
					attempts: 0,
					serverDocument,
				});
			}

			this.processQueue();
		} catch (error) {
			logger.warn("Webhook dispatch error", { svrid: guildId, event }, error);
		}
	}

	/**
	 * Process the webhook queue
	 */
	async processQueue () {
		if (this.processing || this.queue.length === 0) return;

		this.processing = true;

		while (this.queue.length > 0) {
			const item = this.queue.shift();
			await this.deliverWebhook(item);
		}

		this.processing = false;
	}

	/**
	 * Deliver a webhook payload
	 * @param {Object} item - Queue item
	 */
	async deliverWebhook (item) {
		const { webhook, payload, attempts, serverDocument } = item;

		try {
			const headers = {
				"Content-Type": "application/json",
				"User-Agent": "Skynet-Webhook/1.0",
				"X-Webhook-Event": payload.event,
				"X-Webhook-Delivery": `${Date.now()}`,
			};

			// Add signature if secret is configured
			if (webhook.secret) {
				const crypto = require("crypto");
				const signature = crypto
					.createHmac("sha256", webhook.secret)
					.update(JSON.stringify(payload))
					.digest("hex");
				headers["X-Webhook-Signature"] = `sha256=${signature}`;
			}

			const response = await fetch(webhook.url, {
				method: "POST",
				headers,
				body: JSON.stringify(payload),
				timeout: 10000,
			});

			if (response.ok) {
				// Update last triggered
				const webhookIndex = serverDocument.config.webhooks.findIndex(w => w.id === webhook.id);
				if (webhookIndex !== -1) {
					serverDocument.query.set(`config.webhooks.${webhookIndex}.last_triggered`, new Date());
					serverDocument.query.set(`config.webhooks.${webhookIndex}.failure_count`, 0);
				}
				logger.debug(`Webhook delivered successfully`, { webhookId: webhook.id, event: payload.event });
			} else {
				throw new Error(`HTTP ${response.status}`);
			}
		} catch (error) {
			logger.warn(`Webhook delivery failed`, { webhookId: webhook.id, attempt: attempts + 1 }, error);

			// Retry logic
			if (attempts < this.retryAttempts) {
				setTimeout(() => {
					this.queue.push({ ...item, attempts: attempts + 1 });
					this.processQueue();
				}, this.retryDelay * (attempts + 1));
			} else {
				// Mark as failed after max retries
				const webhookIndex = serverDocument.config.webhooks.findIndex(w => w.id === webhook.id);
				if (webhookIndex !== -1) {
					const currentFailures = serverDocument.config.webhooks[webhookIndex].failure_count || 0;
					serverDocument.query.set(`config.webhooks.${webhookIndex}.failure_count`, currentFailures + 1);

					// Disable webhook after 10 consecutive failures
					if (currentFailures >= 9) {
						serverDocument.query.set(`config.webhooks.${webhookIndex}.enabled`, false);
						logger.warn(`Webhook disabled due to repeated failures`, { webhookId: webhook.id });
					}
				}
			}
		}
	}

	/**
	 * Test a webhook URL
	 * @param {string} url - Webhook URL to test
	 * @returns {Promise<Object>} Test result
	 */
	async testWebhook (url) {
		try {
			const testPayload = {
				event: "test",
				timestamp: new Date().toISOString(),
				data: { message: "This is a test webhook from Skynet" },
			};

			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"User-Agent": "Skynet-Webhook/1.0",
					"X-Webhook-Event": "test",
				},
				body: JSON.stringify(testPayload),
				timeout: 10000,
			});

			return {
				success: response.ok,
				status: response.status,
				statusText: response.statusText,
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
			};
		}
	}
}

module.exports = WebhookDispatcher;
module.exports.WEBHOOK_EVENTS = WEBHOOK_EVENTS;
module.exports.DELIVERY_STATUS = DELIVERY_STATUS;
