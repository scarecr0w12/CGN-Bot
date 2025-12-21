/**
 * Payment Provider Webhook Handlers
 *
 * Handles incoming webhooks from Stripe, PayPal, and BTCPay Server
 * to manage subscription lifecycle events.
 */

const crypto = require("crypto");
const { TierManager } = require("../../Modules/TierManager");
const VoteRewardsManager = require("../../Modules/VoteRewardsManager");
const EmailService = require("../../Modules/EmailService");

const controllers = module.exports;

// Helper to send receipt email after payment
async function sendPaymentReceiptEmail (client, data) {
	try {
		const siteSettings = await TierManager.getSiteSettings();
		const emailConfig = siteSettings?.email;

		// Check if email is enabled and receipts should be sent
		if (!emailConfig?.isEnabled || !emailConfig?.notifications?.send_receipts) {
			return;
		}

		const emailService = new EmailService(client);
		await emailService.sendReceipt(data);
	} catch (err) {
		logger.warn("Failed to send receipt email", { serverId: data.serverId }, err);
	}
}

// Helper to send subscription notification email
async function sendSubscriptionEmail (client, type, data) {
	try {
		const siteSettings = await TierManager.getSiteSettings();
		const emailConfig = siteSettings?.email;

		if (!emailConfig?.isEnabled || !emailConfig?.notifications?.send_subscription_alerts) {
			return;
		}

		const emailService = new EmailService(client);

		switch (type) {
			case "activated":
				await emailService.sendSubscriptionActivated(data);
				break;
			case "cancelled":
				await emailService.sendSubscriptionCancelled(data);
				break;
			case "expiring":
				await emailService.sendSubscriptionExpiring(data);
				break;
		}
	} catch (err) {
		logger.warn(`Failed to send ${type} email`, { serverId: data.serverId }, err);
	}
}

// ============================================
// STRIPE WEBHOOKS
// ============================================

controllers.stripe = async (req, res) => {
	const sig = req.headers["stripe-signature"];
	const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

	if (!webhookSecret) {
		logger.warn("Stripe webhook secret not configured");
		return res.sendStatus(400);
	}

	let event;
	try {
		const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
		event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
	} catch (err) {
		logger.warn("Stripe webhook signature verification failed", {}, err);
		return res.status(400).send(`Webhook Error: ${err.message}`);
	}

	logger.verbose(`Stripe webhook received: ${event.type}`, { eventId: event.id });

	try {
		switch (event.type) {
			case "checkout.session.completed": {
				const session = event.data.object;
				await handleStripeCheckoutCompleted(req.app.client, session);
				break;
			}
			case "customer.subscription.created":
			case "customer.subscription.updated": {
				const subscription = event.data.object;
				await handleStripeSubscriptionUpdate(req.app.client, subscription);
				break;
			}
			case "customer.subscription.deleted": {
				const subscription = event.data.object;
				await handleStripeSubscriptionCanceled(req.app.client, subscription);
				break;
			}
			case "invoice.payment_failed": {
				const invoice = event.data.object;
				await handleStripePaymentFailed(invoice);
				break;
			}
			default:
				logger.verbose(`Unhandled Stripe event type: ${event.type}`);
		}

		res.json({ received: true });
	} catch (err) {
		logger.error("Error processing Stripe webhook", { eventType: event.type }, err);
		res.status(500).json({ error: "Webhook processing failed" });
	}
};

async function handleStripeCheckoutCompleted (client, session) {
	const customerId = session.customer;
	const metadata = session.metadata || {};

	// Check if this is a vote points purchase
	if (metadata.type === "vote_points_purchase") {
		const userId = metadata.user_id;
		const points = parseInt(metadata.points) || 0;
		const bonusPoints = parseInt(metadata.bonus_points) || 0;
		const totalPoints = points + bonusPoints;
		const amountPaid = (session.amount_total || 0) / 100;

		if (!userId || totalPoints <= 0) {
			logger.warn("Stripe vote points purchase missing data", { sessionId: session.id, metadata });
			return;
		}

		await VoteRewardsManager.completePurchase(
			userId,
			totalPoints,
			"stripe",
			session.id,
			amountPaid,
			session.currency?.toUpperCase() || "USD",
		);
		logger.info(`Vote points purchase completed: ${userId} received ${totalPoints} points via Stripe`);
		return;
	}

	// Regular subscription checkout
	const serverId = metadata.server_id || metadata.discord_server_id;
	const purchasedBy = metadata.discord_user_id || metadata.purchased_by;
	const tierId = metadata.tier_id;
	const billingPeriod = metadata.billing_period;

	if (!serverId) {
		logger.warn("Stripe checkout missing server_id metadata", { sessionId: session.id });
		return;
	}

	// Link Stripe customer to server
	await TierManager.linkPaymentCustomer(serverId, "stripe", customerId);
	logger.info(`Stripe customer linked: ${customerId} -> server ${serverId} (purchased by ${purchasedBy})`);

	// Send receipt email
	if (session.customer_email && tierId) {
		const siteSettings = await TierManager.getSiteSettings();
		const tier = siteSettings?.tiers?.find(t => t._id === tierId);
		const guild = client?.guilds?.cache?.get(serverId);

		await sendPaymentReceiptEmail(client, {
			email: session.customer_email,
			serverName: guild?.name || serverId,
			serverId,
			tierName: tier?.name || tierId,
			tierId,
			amount: session.amount_total || 0,
			currency: session.currency?.toUpperCase() || "USD",
			billingPeriod: billingPeriod || "monthly",
			transactionId: session.id,
			purchaseDate: new Date(),
		});
	}
}

async function handleStripeSubscriptionUpdate (client, subscription) {
	const customerId = subscription.customer;
	const { status } = subscription;
	const priceId = subscription.items?.data?.[0]?.price?.id;

	// Find server by Stripe customer ID
	const server = await TierManager.findServerByPaymentCustomer("stripe", customerId);
	if (!server) {
		logger.warn("Stripe subscription update for unknown customer", { customerId });
		return;
	}

	if (status === "active" || status === "trialing") {
		// Get tier from price mapping
		const tier = await TierManager.getTierByPaymentProduct("stripe", priceId);
		if (tier) {
			const expiresAt = subscription.current_period_end ?
				new Date(subscription.current_period_end * 1000) :
				null;

			await TierManager.setServerTier(
				server._id,
				tier._id,
				"stripe",
				expiresAt,
				"subscription_active",
			);
			logger.info(`Server ${server._id} assigned tier ${tier._id} via Stripe`);

			// Send subscription activated email
			const guild = client?.guilds?.cache?.get(server._id);
			const siteSettings = await TierManager.getSiteSettings();
			const tierFeatures = siteSettings?.features?.filter(f =>
				tier.features?.includes(f._id),
			).map(f => f.name) || [];

			// Try to get purchaser's email from server subscription
			const purchaserEmail = server.subscription?.purchaser_email;
			if (purchaserEmail) {
				await sendSubscriptionEmail(client, "activated", {
					email: purchaserEmail,
					serverName: guild?.name || server._id,
					serverId: server._id,
					tierName: tier.name,
					tierId: tier._id,
					features: tierFeatures,
					expiresAt,
				});
			}
		}
	} else if (status === "past_due" || status === "unpaid") {
		logger.warn(`Stripe subscription ${status} for server ${server._id}`);
	}
}

async function handleStripeSubscriptionCanceled (client, subscription) {
	const customerId = subscription.customer;

	const server = await TierManager.findServerByPaymentCustomer("stripe", customerId);
	if (!server) {
		logger.warn("Stripe cancellation for unknown customer", { customerId });
		return;
	}

	// Get tier info before canceling
	const tierInfo = server.subscription?.tier_id;
	const siteSettings = await TierManager.getSiteSettings();
	const tier = siteSettings?.tiers?.find(t => t._id === tierInfo);

	await TierManager.cancelSubscription(server._id, "stripe_canceled");
	logger.info(`Stripe subscription canceled for server ${server._id}`);

	// Send cancellation email
	const guild = client?.guilds?.cache?.get(server._id);
	const purchaserEmail = server.subscription?.purchaser_email;
	if (purchaserEmail) {
		await sendSubscriptionEmail(client, "cancelled", {
			email: purchaserEmail,
			serverName: guild?.name || server._id,
			serverId: server._id,
			tierName: tier?.name || "Premium",
			endDate: subscription.current_period_end ?
				new Date(subscription.current_period_end * 1000) : new Date(),
		});
	}
}

async function handleStripePaymentFailed (invoice) {
	const customerId = invoice.customer;

	const server = await TierManager.findServerByPaymentCustomer("stripe", customerId);
	if (server) {
		logger.warn(`Stripe payment failed for server ${server._id}`, { invoiceId: invoice.id });
		// Could notify server owner here
	}
}

// ============================================
// PAYPAL WEBHOOKS
// ============================================

controllers.paypal = async (req, res) => {
	const webhookId = process.env.PAYPAL_WEBHOOK_ID;

	if (!webhookId) {
		logger.warn("PayPal webhook ID not configured");
		return res.sendStatus(400);
	}

	// Verify webhook signature
	const isValid = await verifyPayPalWebhook(req, webhookId);
	if (!isValid) {
		logger.warn("PayPal webhook signature verification failed");
		return res.sendStatus(401);
	}

	const event = req.body;
	logger.verbose(`PayPal webhook received: ${event.event_type}`, { eventId: event.id });

	try {
		switch (event.event_type) {
			case "BILLING.SUBSCRIPTION.ACTIVATED":
			case "BILLING.SUBSCRIPTION.UPDATED": {
				await handlePayPalSubscriptionActive(event.resource);
				break;
			}
			case "BILLING.SUBSCRIPTION.CANCELLED":
			case "BILLING.SUBSCRIPTION.EXPIRED":
			case "BILLING.SUBSCRIPTION.SUSPENDED": {
				await handlePayPalSubscriptionEnded(event.resource, event.event_type);
				break;
			}
			case "PAYMENT.SALE.COMPLETED": {
				await handlePayPalPaymentCompleted(event.resource);
				break;
			}
			default:
				logger.verbose(`Unhandled PayPal event type: ${event.event_type}`);
		}

		res.json({ received: true });
	} catch (err) {
		logger.error("Error processing PayPal webhook", { eventType: event.event_type }, err);
		res.status(500).json({ error: "Webhook processing failed" });
	}
};

async function verifyPayPalWebhook (req) {
	// PayPal webhook verification requires calling their API
	// For production, implement full verification
	// https://developer.paypal.com/docs/api/webhooks/v1/#verify-webhook-signature

	const transmissionId = req.headers["paypal-transmission-id"];
	const transmissionTime = req.headers["paypal-transmission-time"];
	const certUrl = req.headers["paypal-cert-url"];
	const transmissionSig = req.headers["paypal-transmission-sig"];

	if (!transmissionId || !transmissionTime || !certUrl || !transmissionSig) {
		return false;
	}

	// In production, verify against PayPal API
	// For now, accept if headers are present
	return true;
}

async function handlePayPalSubscriptionActive (subscription) {
	const subscriptionId = subscription.id;
	const planId = subscription.plan_id;
	// custom_id should contain server_id (premium is per-server)
	const serverId = subscription.custom_id;

	if (!serverId) {
		logger.warn("PayPal subscription missing custom_id (server_id)", { subscriptionId });
		return;
	}

	// Link PayPal subscription to server
	await TierManager.linkPaymentCustomer(serverId, "paypal", subscriptionId);

	// Get tier from plan mapping
	const tier = await TierManager.getTierByPaymentProduct("paypal", planId);
	if (tier) {
		const expiresAt = subscription.billing_info?.next_billing_time ?
			new Date(subscription.billing_info.next_billing_time) :
			null;

		await TierManager.setServerTier(serverId, tier._id, "paypal", expiresAt, "subscription_active");
		logger.info(`Server ${serverId} assigned tier ${tier._id} via PayPal`);
	}
}

async function handlePayPalSubscriptionEnded (subscription, eventType) {
	const subscriptionId = subscription.id;

	const server = await TierManager.findServerByPaymentCustomer("paypal", subscriptionId);
	if (!server) {
		logger.warn("PayPal subscription end for unknown server", { subscriptionId });
		return;
	}

	await TierManager.cancelSubscription(server._id, `paypal_${eventType.toLowerCase()}`);
	logger.info(`PayPal subscription ended for server ${server._id}: ${eventType}`);
}

async function handlePayPalPaymentCompleted (sale) {
	logger.verbose("PayPal payment completed", { saleId: sale.id });
	// Payment completed - subscription should already be active
}

// ============================================
// BTCPAY WEBHOOKS
// ============================================

controllers.btcpay = async (req, res) => {
	const webhookSecret = process.env.BTCPAY_WEBHOOK_SECRET;

	if (!webhookSecret) {
		logger.warn("BTCPay webhook secret not configured");
		return res.sendStatus(400);
	}

	// Verify HMAC signature
	const sig = req.headers["btcpay-sig"];
	if (!sig) {
		logger.warn("BTCPay webhook missing signature");
		return res.sendStatus(401);
	}

	// Use raw body for signature verification (JSON.stringify may change ordering)
	const rawBody = req.rawBody || JSON.stringify(req.body);
	const expectedSig = `sha256=${crypto
		.createHmac("sha256", webhookSecret)
		.update(rawBody)
		.digest("hex")}`;

	if (sig !== expectedSig) {
		logger.warn("BTCPay webhook signature mismatch", {
			received: sig,
			expected: expectedSig,
			hasRawBody: !!req.rawBody,
		});
		return res.sendStatus(401);
	}

	const event = req.body;
	logger.verbose(`BTCPay webhook received: ${event.type}`, { invoiceId: event.invoiceId });

	try {
		switch (event.type) {
			case "InvoiceSettled":
			case "InvoiceProcessing": {
				await handleBTCPayInvoiceSettled(req.app.client, event);
				break;
			}
			case "InvoiceExpired":
			case "InvoiceInvalid": {
				await handleBTCPayInvoiceFailed(event);
				break;
			}
			default:
				logger.verbose(`Unhandled BTCPay event type: ${event.type}`);
		}

		res.json({ received: true });
	} catch (err) {
		logger.error("Error processing BTCPay webhook", { eventType: event.type }, err);
		res.status(500).json({ error: "Webhook processing failed" });
	}
};

async function handleBTCPayInvoiceSettled (client, event) {
	const { invoiceId } = event;
	const metadata = event.metadata || {};

	// Check if this is a vote points purchase
	if (metadata.type === "vote_points_purchase") {
		const userId = metadata.user_id;
		const points = parseInt(metadata.points) || 0;
		const bonusPoints = parseInt(metadata.bonus_points) || 0;
		const totalPoints = points + bonusPoints;
		const amountPaid = parseFloat(event.amount) || 0;

		if (!userId || totalPoints <= 0) {
			logger.warn("BTCPay vote points purchase missing data", { invoiceId, metadata });
			return;
		}

		await VoteRewardsManager.completePurchase(
			userId,
			totalPoints,
			"btcpay",
			invoiceId,
			amountPaid,
			event.currency || "USD",
		);
		logger.info(`Vote points purchase completed: ${userId} received ${totalPoints} points via BTCPay`);
		return;
	}

	// Regular subscription/tier purchase
	const serverId = metadata.server_id || metadata.discord_server_id;
	const tierId = metadata.tier_id;
	const durationDays = parseInt(metadata.duration_days) || 30;
	const purchasedBy = metadata.discord_user_id || metadata.purchased_by;
	const billingPeriod = metadata.billing_period;
	const purchaserEmail = metadata.email;

	if (!serverId || !tierId) {
		logger.warn("BTCPay invoice missing metadata (server_id or tier_id)", { invoiceId });
		return;
	}

	// Link BTCPay customer to server
	await TierManager.linkPaymentCustomer(serverId, "btcpay", invoiceId);

	// Calculate expiration
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + durationDays);

	await TierManager.setServerTier(serverId, tierId, "btcpay", expiresAt, "crypto_payment", purchasedBy);
	logger.info(`Server ${serverId} assigned tier ${tierId} via BTCPay for ${durationDays} days (purchased by ${purchasedBy})`);

	// Send receipt email
	if (purchaserEmail && tierId) {
		const siteSettings = await TierManager.getSiteSettings();
		const tier = siteSettings?.tiers?.find(t => t._id === tierId);
		const guild = client?.guilds?.cache?.get(serverId);

		await sendPaymentReceiptEmail(client, {
			email: purchaserEmail,
			serverName: guild?.name || serverId,
			serverId,
			tierName: tier?.name || tierId,
			tierId,
			amount: Math.round((parseFloat(event.amount) || 0) * 100),
			currency: event.currency || "USD",
			billingPeriod: billingPeriod || "monthly",
			transactionId: invoiceId,
			purchaseDate: new Date(),
		});
	}
}

async function handleBTCPayInvoiceFailed (event) {
	const { invoiceId } = event;
	logger.warn(`BTCPay invoice failed: ${event.type}`, { invoiceId });
	// Could notify user here
}

// ============================================
// PATREON WEBHOOKS
// ============================================

controllers.patreon = async (req, res) => {
	const webhookSecret = process.env.PATREON_WEBHOOK_SECRET;

	if (!webhookSecret) {
		logger.warn("Patreon webhook secret not configured");
		return res.sendStatus(400);
	}

	// Verify HMAC signature
	const sig = req.headers["x-patreon-signature"];
	if (!sig) {
		logger.warn("Patreon webhook missing signature");
		return res.sendStatus(401);
	}

	const expectedSig = crypto
		.createHmac("md5", webhookSecret)
		.update(req.rawBody)
		.digest("hex");

	if (sig !== expectedSig) {
		logger.warn("Patreon webhook signature mismatch");
		return res.sendStatus(401);
	}

	const event = req.body;
	const trigger = req.headers["x-patreon-event"];
	logger.verbose(`Patreon webhook received: ${trigger}`);

	try {
		switch (trigger) {
			case "members:pledge:create":
			case "members:pledge:update": {
				await handlePatreonPledgeActive(event.data);
				break;
			}
			case "members:pledge:delete": {
				await handlePatreonPledgeDeleted(event.data);
				break;
			}
			default:
				logger.verbose(`Unhandled Patreon event: ${trigger}`);
		}

		res.json({ received: true });
	} catch (err) {
		logger.error("Error processing Patreon webhook", { trigger }, err);
		res.status(500).json({ error: "Webhook processing failed" });
	}
};

async function handlePatreonPledgeActive (data) {
	const patronId = data.relationships?.user?.data?.id;
	const tierId = data.relationships?.currently_entitled_tiers?.data?.[0]?.id;

	if (!patronId) {
		logger.warn("Patreon pledge missing patron ID");
		return;
	}

	// Find user by linked Patreon account to get their servers
	const user = await Users.findOne({ "linked_accounts._id": "patreon", "linked_accounts.provider_user_id": patronId });
	if (!user) {
		logger.warn("Patreon pledge for unlinked patron", { patronId });
		return;
	}

	// For Patreon, we need to find which server the user wants to apply the tier to
	// Check if user has a default server set for Patreon benefits
	const patreonServerId = user.patreon_server_id;
	if (!patreonServerId) {
		logger.warn("Patreon pledge but user has no default server configured", { patronId, userId: user._id });
		return;
	}

	if (tierId) {
		// Get local tier from Patreon tier mapping
		const settings = await TierManager.getSiteSettings();
		const tierMapping = settings?.oauth_providers?.patreon?.tier_mapping || [];
		const mapping = tierMapping.find(m => m._id === tierId);

		if (mapping) {
			await TierManager.setServerTier(patreonServerId, mapping.local_tier_id, "patreon", null, "patreon_pledge", user._id);
			logger.info(`Server ${patreonServerId} assigned tier ${mapping.local_tier_id} via Patreon pledge from user ${user._id}`);
		}
	}
}

async function handlePatreonPledgeDeleted (data) {
	const patronId = data.relationships?.user?.data?.id;

	if (!patronId) return;

	const user = await Users.findOne({ "linked_accounts._id": "patreon", "linked_accounts.provider_user_id": patronId });
	if (!user) return;

	// Find the server that has this user's Patreon benefits
	const patreonServerId = user.patreon_server_id;
	if (!patreonServerId) return;

	await TierManager.cancelSubscription(patreonServerId, "patreon_pledge_deleted");
	logger.info(`Patreon pledge deleted - server ${patreonServerId} subscription canceled (patron: ${user._id})`);
}

// ============================================
// BOT LIST VOTE WEBHOOKS
// ============================================

/**
 * top.gg Vote Webhook
 * Receives vote notifications when users vote for the bot on top.gg
 */
controllers.topgg = async (req, res) => {
	try {
		const siteSettings = await SiteSettings.findOne("main");
		const config = siteSettings?.bot_lists?.topgg;

		if (!config?.isEnabled) {
			return res.status(404).json({ error: "Not configured" });
		}

		// Verify webhook secret
		const authHeader = req.headers.authorization;
		if (config.webhook_secret && authHeader !== config.webhook_secret) {
			logger.warn("top.gg webhook auth failed", { received: authHeader?.substring(0, 10) });
			return res.status(401).json({ error: "Unauthorized" });
		}

		// Process the vote
		const botLists = req.app.get("botLists");
		if (botLists) {
			await botLists.processVote("topgg", req.body);
		} else {
			logger.warn("BotLists module not initialized");
		}

		res.status(200).json({ success: true });
	} catch (err) {
		logger.error("Error processing top.gg webhook", {}, err);
		res.status(500).json({ error: "Internal error" });
	}
};

/**
 * Discord Bot List Vote Webhook
 * Receives vote notifications when users vote for the bot on discordbotlist.com
 */
controllers.discordbotlist = async (req, res) => {
	try {
		const siteSettings = await SiteSettings.findOne("main");
		const config = siteSettings?.bot_lists?.discordbotlist;

		if (!config?.isEnabled) {
			return res.status(404).json({ error: "Not configured" });
		}

		// Verify webhook secret
		const authHeader = req.headers.authorization;
		if (config.webhook_secret && authHeader !== config.webhook_secret) {
			logger.warn("discordbotlist webhook auth failed", { received: authHeader?.substring(0, 10) });
			return res.status(401).json({ error: "Unauthorized" });
		}

		// Process the vote
		const botLists = req.app.get("botLists");
		if (botLists) {
			await botLists.processVote("discordbotlist", req.body);
		} else {
			logger.warn("BotLists module not initialized");
		}

		res.status(200).json({ success: true });
	} catch (err) {
		logger.error("Error processing discordbotlist webhook", {}, err);
		res.status(500).json({ error: "Internal error" });
	}
};

/**
 * TopBotList Vote Webhook
 * Receives vote notifications when users vote for the bot on topbotlist.net
 * Webhook payload: { bot, user, type, isWeekend, query }
 */
controllers.topbotlist = async (req, res) => {
	try {
		const siteSettings = await SiteSettings.findOne("main");
		const config = siteSettings?.bot_lists?.topbotlist;

		if (!config?.isEnabled) {
			return res.status(404).json({ error: "Not configured" });
		}

		// Verify webhook secret (sent in Authorization header)
		const authHeader = req.headers.authorization;
		if (config.webhook_secret && authHeader !== config.webhook_secret) {
			logger.warn("topbotlist webhook auth failed", { received: authHeader?.substring(0, 10) });
			return res.status(401).json({ error: "Unauthorized" });
		}

		// TopBotList webhook payload format:
		// { bot: "BOT_ID", user: "USER_ID", type: "vote", isWeekend: false, query: "?ref=..." }
		const voteData = {
			user: req.body.user,
			type: req.body.type,
			isWeekend: req.body.isWeekend || false,
			query: req.body.query,
		};

		// Process the vote
		const botLists = req.app.get("botLists");
		if (botLists) {
			await botLists.processVote("topbotlist", voteData);
		} else {
			logger.warn("BotLists module not initialized");
		}

		res.status(200).json({ success: true });
	} catch (err) {
		logger.error("Error processing topbotlist webhook", {}, err);
		res.status(500).json({ error: "Internal error" });
	}
};
