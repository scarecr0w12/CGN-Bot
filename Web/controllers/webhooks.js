/**
 * Payment Provider Webhook Handlers
 *
 * Handles incoming webhooks from Stripe, PayPal, and BTCPay Server
 * to manage subscription lifecycle events.
 */

const TierManager = require("../../Modules/TierManager");
const crypto = require("crypto");

const controllers = module.exports;

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
				await handleStripeCheckoutCompleted(session);
				break;
			}
			case "customer.subscription.created":
			case "customer.subscription.updated": {
				const subscription = event.data.object;
				await handleStripeSubscriptionUpdate(subscription);
				break;
			}
			case "customer.subscription.deleted": {
				const subscription = event.data.object;
				await handleStripeSubscriptionCanceled(subscription);
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

async function handleStripeCheckoutCompleted (session) {
	const customerId = session.customer;
	const discordUserId = session.metadata?.discord_user_id;

	if (!discordUserId) {
		logger.warn("Stripe checkout missing discord_user_id metadata", { sessionId: session.id });
		return;
	}

	// Link Stripe customer to user
	await TierManager.linkPaymentCustomer(discordUserId, "stripe", customerId);
	logger.info(`Stripe customer linked: ${customerId} -> ${discordUserId}`);
}

async function handleStripeSubscriptionUpdate (subscription) {
	const customerId = subscription.customer;
	const { status } = subscription;
	const priceId = subscription.items?.data?.[0]?.price?.id;

	// Find user by Stripe customer ID
	const user = await TierManager.findUserByPaymentCustomer("stripe", customerId);
	if (!user) {
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

			await TierManager.setUserTier(
				user._id,
				tier._id,
				"stripe",
				expiresAt,
				"subscription_active",
			);
			logger.info(`User ${user._id} assigned tier ${tier._id} via Stripe`);
		}
	} else if (status === "past_due" || status === "unpaid") {
		logger.warn(`Stripe subscription ${status} for user ${user._id}`);
	}
}

async function handleStripeSubscriptionCanceled (subscription) {
	const customerId = subscription.customer;

	const user = await TierManager.findUserByPaymentCustomer("stripe", customerId);
	if (!user) {
		logger.warn("Stripe cancellation for unknown customer", { customerId });
		return;
	}

	await TierManager.cancelSubscription(user._id, "stripe_canceled");
	logger.info(`Stripe subscription canceled for user ${user._id}`);
}

async function handleStripePaymentFailed (invoice) {
	const customerId = invoice.customer;

	const user = await TierManager.findUserByPaymentCustomer("stripe", customerId);
	if (user) {
		logger.warn(`Stripe payment failed for user ${user._id}`, { invoiceId: invoice.id });
		// Could send notification to user here
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
	// custom_id should contain discord_user_id
	const customData = subscription.custom_id;

	if (!customData) {
		logger.warn("PayPal subscription missing custom_id", { subscriptionId });
		return;
	}

	const discordUserId = customData;

	// Link PayPal subscription to user
	await TierManager.linkPaymentCustomer(discordUserId, "paypal", subscriptionId);

	// Get tier from plan mapping
	const tier = await TierManager.getTierByPaymentProduct("paypal", planId);
	if (tier) {
		const expiresAt = subscription.billing_info?.next_billing_time ?
			new Date(subscription.billing_info.next_billing_time) :
			null;

		await TierManager.setUserTier(discordUserId, tier._id, "paypal", expiresAt, "subscription_active");
		logger.info(`User ${discordUserId} assigned tier ${tier._id} via PayPal`);
	}
}

async function handlePayPalSubscriptionEnded (subscription, eventType) {
	const subscriptionId = subscription.id;

	const user = await TierManager.findUserByPaymentCustomer("paypal", subscriptionId);
	if (!user) {
		logger.warn("PayPal subscription end for unknown user", { subscriptionId });
		return;
	}

	await TierManager.cancelSubscription(user._id, `paypal_${eventType.toLowerCase()}`);
	logger.info(`PayPal subscription ended for user ${user._id}: ${eventType}`);
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
				await handleBTCPayInvoiceSettled(event);
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

async function handleBTCPayInvoiceSettled (event) {
	const { invoiceId } = event;
	const metadata = event.metadata || {};
	const discordUserId = metadata.discord_user_id;
	const tierId = metadata.tier_id;
	const durationDays = parseInt(metadata.duration_days) || 30;

	if (!discordUserId || !tierId) {
		logger.warn("BTCPay invoice missing metadata", { invoiceId });
		return;
	}

	// Link BTCPay customer
	await TierManager.linkPaymentCustomer(discordUserId, "btcpay", invoiceId);

	// Calculate expiration
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + durationDays);

	await TierManager.setUserTier(discordUserId, tierId, "btcpay", expiresAt, "crypto_payment");
	logger.info(`User ${discordUserId} assigned tier ${tierId} via BTCPay for ${durationDays} days`);
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

	// Find user by linked Patreon account
	const user = await Users.findOne({ "linked_accounts._id": "patreon", "linked_accounts.provider_user_id": patronId });
	if (!user) {
		logger.warn("Patreon pledge for unlinked patron", { patronId });
		return;
	}

	if (tierId) {
		// Get local tier from Patreon tier mapping
		const settings = await TierManager.getSiteSettings();
		const tierMapping = settings?.oauth_providers?.patreon?.tier_mapping || [];
		const mapping = tierMapping.find(m => m._id === tierId);

		if (mapping) {
			await TierManager.setUserTier(user._id, mapping.local_tier_id, "patreon", null, "patreon_pledge");
			logger.info(`User ${user._id} assigned tier ${mapping.local_tier_id} via Patreon pledge`);
		}
	}
}

async function handlePatreonPledgeDeleted (data) {
	const patronId = data.relationships?.user?.data?.id;

	if (!patronId) return;

	const user = await Users.findOne({ "linked_accounts._id": "patreon", "linked_accounts.provider_user_id": patronId });
	if (!user) return;

	await TierManager.cancelSubscription(user._id, "patreon_pledge_deleted");
	logger.info(`Patreon pledge deleted for user ${user._id}`);
}
