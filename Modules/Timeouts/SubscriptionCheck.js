/**
 * Subscription Expiration Check Task
 *
 * Periodically checks for expired server subscriptions and handles them appropriately.
 * Premium subscriptions are per-SERVER, not per-user.
 */

const Base = require("./Base");

module.exports = class SubscriptionCheck extends Base {
	constructor (client) {
		// Run every hour (3600000ms)
		super(client, 3600000);
	}

	async _handle () {
		try {
			const TierManager = require("../TierManager");

			// Get all servers with active subscriptions that might have expired
			const now = new Date();
			const expiredServers = await Servers.find({
				"subscription.tier_id": { $exists: true, $nin: [null, "free"] },
				"subscription.expires_at": { $exists: true, $lte: now },
				"subscription.is_active": { $ne: false },
			}).exec();

			if (!expiredServers || expiredServers.length === 0) {
				logger.verbose("No expired server subscriptions found");
				return;
			}

			logger.info(`Found ${expiredServers.length} expired server subscriptions to process`);

			for (const server of expiredServers) {
				try {
					// Check if the subscription source supports auto-renewal
					const source = server.subscription?.source;

					// For payment provider sources, the webhook should handle renewal
					// Only auto-expire manual and one-time payments
					if (["manual", "btcpay", "gift"].includes(source)) {
						await TierManager.checkExpiration(server._id);
						logger.info(`Expired subscription for server ${server._id} (source: ${source})`);
					} else {
						// For Stripe/PayPal/Patreon, give a grace period
						// The payment provider should send a webhook if they're still active
						// 7 days grace period
						const gracePeriod = 7 * 24 * 60 * 60 * 1000;
						const expiresAt = new Date(server.subscription.expires_at);

						if (now - expiresAt > gracePeriod) {
							// Past grace period, likely a cancelled subscription
							await TierManager.checkExpiration(server._id);
							logger.info(`Expired subscription (past grace period) for server ${server._id}`);
						}
					}
				} catch (serverErr) {
					logger.warn(`Error processing expired subscription for server ${server._id}`, {}, serverErr);
				}
			}

			// Also check for subscriptions that will expire soon (send reminders)
			// 3 days from now
			const soonExpiringDate = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
			const soonExpiring = await Servers.find({
				"subscription.tier_id": { $exists: true, $nin: [null, "free"] },
				"subscription.expires_at": { $exists: true, $gte: now, $lte: soonExpiringDate },
				"subscription.is_active": true,
				"subscription.expiration_warned": { $ne: true },
			}).exec();

			if (soonExpiring && soonExpiring.length > 0) {
				logger.info(`Found ${soonExpiring.length} server subscriptions expiring soon`);
				// Could notify server admins here if desired
				for (const server of soonExpiring) {
					try {
						// Mark as warned to avoid repeated warnings - set full subscription object
						const oldSubscription = server.subscription || {};
						server.query.set("subscription", {
							...oldSubscription,
							expiration_warned: true,
						});
						await server.save();

						// Optionally notify the server owner or purchased_by user
						// const purchasedBy = server.subscription?.purchased_by;
						// if (purchasedBy) {
						//   const discordUser = await this.client.users.fetch(purchasedBy);
						//   await discordUser.send(...);
						// }
					} catch (warnErr) {
						logger.verbose(`Could not warn about expiring subscription for server ${server._id}`, {}, warnErr);
					}
				}
			}
		} catch (err) {
			logger.error("Error in subscription expiration check", {}, err);
		}
	}
};
