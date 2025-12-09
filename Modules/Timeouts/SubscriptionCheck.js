/**
 * Subscription Expiration Check Task
 *
 * Periodically checks for expired subscriptions and handles them appropriately
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

			// Get all users with active subscriptions that might have expired
			const now = new Date();
			const expiredUsers = await Users.find({
				"subscription.tier_id": { $exists: true, $ne: null },
				"subscription.expires_at": { $exists: true, $lte: now },
				"subscription.is_active": { $ne: false },
			});

			if (expiredUsers.length === 0) {
				logger.verbose("No expired subscriptions found");
				return;
			}

			logger.info(`Found ${expiredUsers.length} expired subscriptions to process`);

			for (const user of expiredUsers) {
				try {
					// Check if the subscription source supports auto-renewal
					const source = user.subscription?.source;

					// For payment provider sources, the webhook should handle renewal
					// Only auto-expire manual and one-time payments
					if (["manual", "btcpay", "gift"].includes(source)) {
						await TierManager.checkExpiration(user._id);
						logger.info(`Expired subscription for user ${user._id} (source: ${source})`);
					} else {
						// For Stripe/PayPal/Patreon, give a grace period
						// The payment provider should send a webhook if they're still active
						// 7 days grace period
						const gracePeriod = 7 * 24 * 60 * 60 * 1000;
						const expiresAt = new Date(user.subscription.expires_at);

						if (now - expiresAt > gracePeriod) {
							// Past grace period, likely a cancelled subscription
							await TierManager.checkExpiration(user._id);
							logger.info(`Expired subscription (past grace period) for user ${user._id}`);
						}
					}
				} catch (userErr) {
					logger.warn(`Error processing expired subscription for ${user._id}`, {}, userErr);
				}
			}

			// Also check for subscriptions that will expire soon (send reminders)
			// 3 days from now
			const soonExpiringDate = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
			const soonExpiring = await Users.find({
				"subscription.tier_id": { $exists: true, $ne: null },
				"subscription.expires_at": { $exists: true, $gte: now, $lte: soonExpiringDate },
				"subscription.is_active": true,
				"subscription.expiration_warned": { $ne: true },
			});

			if (soonExpiring.length > 0) {
				logger.info(`Found ${soonExpiring.length} subscriptions expiring soon`);
				// Could send DM reminders here if desired
				for (const user of soonExpiring) {
					try {
						// Mark as warned to avoid repeated warnings
						user.query.set("subscription.expiration_warned", true);
						await user.save();

						// Optionally send DM reminder
						// const discordUser = await this.client.users.fetch(user._id);
						// await discordUser.send(...);
					} catch (warnErr) {
						logger.verbose(`Could not warn user ${user._id} about expiring subscription`, {}, warnErr);
					}
				}
			}
		} catch (err) {
			logger.error("Error in subscription expiration check", {}, err);
		}
	}
};
