/**
 * Membership Controller
 *
 * Handles public membership pages and checkout flow.
 * Premium subscriptions are per-server (guild), not per-user.
 */

const { request } = require("undici");
const TierManager = require("../../Modules/TierManager");

const controllers = module.exports;

/**
 * Public membership/pricing page
 * Premium subscriptions are per-server, so user must select a server to subscribe
 */
controllers.pricing = async (req, { res }) => {
	try {
		const siteSettings = await TierManager.getSiteSettings();
		const tiers = siteSettings?.tiers || [];
		const features = siteSettings?.features || [];
		const yearlyDiscount = siteSettings?.yearly_discount || 20;

		const userServers = [];
		let selectedServer = null;
		let serverTier = null;
		let serverSubscription = null;

		// Get server from query param
		const selectedServerId = req.query.server;

		if (req.isAuthenticated()) {
			// Get user's servers where they have admin permissions
			const userGuilds = req.user.guilds || [];
			const botGuilds = await req.app.client.guilds.cache;

			// Filter to servers where user is admin/owner and bot is present
			for (const guild of userGuilds) {
				// Check if user has admin or manage server permission (0x8 = ADMINISTRATOR, 0x20 = MANAGE_GUILD)
				const hasAdminPerms = (guild.permissions & 0x8) === 0x8 || (guild.permissions & 0x20) === 0x20 || guild.owner;
				const botInGuild = botGuilds.has(guild.id);

				if (hasAdminPerms && botInGuild) {
					userServers.push({
						id: guild.id,
						name: guild.name,
						icon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
					});
				}
			}

			// If a server is selected, get its subscription info
			if (selectedServerId) {
				const serverInList = userServers.find(s => s.id === selectedServerId);
				if (serverInList) {
					selectedServer = serverInList;
					serverTier = await TierManager.getServerTier(selectedServerId);
					serverSubscription = await TierManager.getServerSubscription(selectedServerId);
				}
			}
		}

		res.setPageData({
			page: "membership.ejs",
			tiers,
			features,
			yearlyDiscount,
			userServers,
			selectedServer,
			serverTier,
			serverSubscription,
		});
		res.render();
	} catch (err) {
		logger.error("Error loading membership page", {}, err);
		res.setPageData({
			page: "error.ejs",
			error_text: "Failed to load membership page",
			error_line: "Please try again later",
		});
		res.render();
	}
};

/**
 * Create Checkout Session (Stripe or BTCPay)
 */
controllers.createCheckout = async (req, res) => {
	if (!req.isAuthenticated()) {
		return res.status(401).json({ error: "You must be logged in to subscribe" });
	}

	const { tier_id: tierId, billing_period: billingPeriod, server_id: serverId } = req.body;

	if (!tierId) {
		return res.status(400).json({ error: "Tier ID is required" });
	}

	// Validate server ID - premium is per-server
	if (!serverId) {
		return res.status(400).json({ error: "Server ID is required - premium subscriptions are per-server" });
	}

	// Verify user has admin access to this server
	const serverDoc = await Servers.findOne(serverId);
	if (!serverDoc) {
		return res.status(400).json({ error: "Server not found. The bot must be in the server first." });
	}

	try {
		const siteSettings = await TierManager.getSiteSettings();
		const tier = siteSettings?.tiers?.find(t => t._id === tierId);

		if (!tier || !tier.is_purchasable) {
			return res.status(400).json({ error: "Invalid or unavailable tier" });
		}

		// Priority 1: Stripe
		const stripeConfig = siteSettings?.payment_providers?.stripe;
		if (process.env.STRIPE_SECRET_KEY && stripeConfig?.isEnabled) {
			const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

			// Find the price ID for this tier
			const priceMapping = stripeConfig.product_mapping?.find(m => m.tier_id === tierId);
			let priceId = priceMapping?.stripe_price_id;

			// If no price mapping, create a price dynamically (for testing)
			if (!priceId) {
				// Calculate price based on billing period and discount
				let price = tier.price_monthly;
				if (billingPeriod === "yearly") {
					price = tier.price_monthly * 12 * (1 - (tier.yearly_discount || 0) / 100);
				}
				price = Math.round(price);

				if (!price || price <= 0) {
					return res.status(400).json({ error: "This tier is not available for purchase" });
				}

				const product = await stripe.products.create({
					name: `${tier.name} Membership`,
					description: tier.description || `${tier.name} tier subscription`,
					metadata: { tier_id: tierId },
				});

				const stripePrice = await stripe.prices.create({
					product: product.id,
					unit_amount: price,
					currency: "usd",
					recurring: {
						interval: billingPeriod === "yearly" ? "year" : "month",
					},
					metadata: { tier_id: tierId },
				});

				priceId = stripePrice.id;
				logger.info(`Created dynamic Stripe price for tier ${tierId}: ${priceId}`);
			}

			// Create checkout session - subscription is for the server, not user
			const session = await stripe.checkout.sessions.create({
				mode: "subscription",
				payment_method_types: ["card"],
				line_items: [{
					price: priceId,
					quantity: 1,
				}],
				success_url: `${configJS.hostingURL}membership/success?session_id={CHECKOUT_SESSION_ID}&provider=stripe&server=${serverId}`,
				cancel_url: `${configJS.hostingURL}dashboard/${serverId}/subscription`,
				customer_email: req.user.email || undefined,
				client_reference_id: serverId, // Server ID as reference
				metadata: {
					discord_server_id: serverId,
					purchased_by: req.user.id,
					tier_id: tierId,
					billing_period: billingPeriod,
				},
				subscription_data: {
					metadata: {
						discord_server_id: serverId,
						purchased_by: req.user.id,
						tier_id: tierId,
					},
				},
			});

			logger.info(`Stripe checkout session created for server ${serverId}`, { sessionId: session.id, tierId, purchasedBy: req.user.id });
			return res.json({ checkout_url: session.url });
		}

		// Priority 2: BTCPay
		const btcpayConfig = siteSettings?.payment_providers?.btcpay;
		const btcpayUrl = process.env.BTCPAY_URL;
		const btcpayApiKey = process.env.BTCPAY_API_KEY;
		const btcpayStoreId = process.env.BTCPAY_STORE_ID;

		if (btcpayConfig?.isEnabled && btcpayUrl && btcpayApiKey && btcpayStoreId) {
			let priceCents = tier.price_monthly;
			if (billingPeriod === "yearly") {
				priceCents = tier.price_monthly * 12 * (1 - ((tier.yearly_discount || 0) / 100));
			}
			priceCents = Math.round(priceCents);

			const amount = (priceCents / 100).toFixed(2);

			if (!amount || parseFloat(amount) <= 0) {
				return res.status(400).json({ error: "This tier is not available for purchase" });
			}

			// Create BTCPay invoice - subscription is for the server, not user
			const { statusCode, body } = await request(`${btcpayUrl}/api/v1/stores/${btcpayStoreId}/invoices`, {
				method: "POST",
				headers: {
					Authorization: `token ${btcpayApiKey}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					amount: amount,
					currency: "USD",
					metadata: {
						tier_id: tierId,
						billing_period: billingPeriod,
						discord_server_id: serverId,
						purchased_by: req.user.id,
						email: req.user.email || undefined,
						orderId: `${serverId}-${tierId}-${Date.now()}`,
					},
					checkout: {
						redirectURL: `${configJS.hostingURL}membership/success?session_id={InvoiceId}&provider=btcpay&server=${serverId}`,
					},
				}),
			});

			const responseData = await body.json();

			if (statusCode !== 200) {
				logger.error("BTCPay invoice creation failed", { status: statusCode, error: responseData });
				throw new Error("Failed to create BTCPay invoice");
			}

			logger.info(`BTCPay invoice created for server ${serverId}`, { invoiceId: responseData.id, tierId, purchasedBy: req.user.id });
			return res.json({ checkout_url: responseData.checkoutLink });
		}

		// No provider configured
		return res.status(503).json({ error: "Payment processing is not configured" });
	} catch (err) {
		logger.error("Error creating checkout session", { serverId, userId: req.user?.id }, err);
		res.status(500).json({ error: "Failed to create checkout session" });
	}
};

/**
 * Handle successful checkout
 */
controllers.success = async (req, { res }) => {
	const sessionId = req.query.session_id;
	const serverId = req.query.server;

	if (!sessionId) {
		return res._redirect(serverId ? `/dashboard/${serverId}/subscription` : "/membership");
	}

	try {
		// Verify the session with Stripe
		if (process.env.STRIPE_SECRET_KEY) {
			const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
			const session = await stripe.checkout.sessions.retrieve(sessionId);

			if (session.payment_status === "paid") {
				// The webhook should handle the subscription activation,
				// but we can show a success message here
				res.setPageData({
					page: "membership-success.ejs",
					session,
					serverId,
				});
				return res.render();
			}
		}

		res._redirect(serverId ? `/dashboard/${serverId}/subscription` : "/membership");
	} catch (err) {
		logger.error("Error verifying checkout session", { serverId }, err);
		res._redirect(serverId ? `/dashboard/${serverId}/subscription` : "/membership");
	}
};

/**
 * Create PayPal subscription
 */
controllers.createPayPalCheckout = async (req, res) => {
	if (!req.isAuthenticated()) {
		return res.status(401).json({ error: "You must be logged in to subscribe" });
	}

	const { tier_id: tierId } = req.body;

	if (!tierId) {
		return res.status(400).json({ error: "Tier ID is required" });
	}

	try {
		const siteSettings = await TierManager.getSiteSettings();
		const paymentProviders = siteSettings?.payment_providers?.paypal;

		if (!paymentProviders?.isEnabled) {
			return res.status(503).json({ error: "PayPal payments are not enabled" });
		}

		// Find the plan ID for this tier
		const planMapping = paymentProviders.plan_mapping?.find(m => m.tier_id === tierId);

		if (!planMapping) {
			return res.status(400).json({ error: "No PayPal plan configured for this tier" });
		}

		// Return the PayPal subscription link
		// Users will need to subscribe via PayPal's interface
		const paypalSubscribeUrl = `https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=${planMapping._id}&custom_id=${req.user.id}`;

		res.json({ checkout_url: paypalSubscribeUrl });
	} catch (err) {
		logger.error("Error creating PayPal checkout", { userId: req.user?.id }, err);
		res.status(500).json({ error: "Failed to create PayPal checkout" });
	}
};

/**
 * Redeem vote points for premium tier time
 */
controllers.redeemPoints = async (req, res) => {
	if (!req.isAuthenticated()) {
		return res.status(401).json({ error: "You must be logged in to redeem points" });
	}

	const { days } = req.body;
	const requestedDays = parseInt(days);

	if (!requestedDays || requestedDays < 1) {
		return res.status(400).json({ error: "Invalid number of days" });
	}

	try {
		const siteSettings = await TierManager.getSiteSettings();
		const redemptionConfig = siteSettings?.vote_rewards?.redemption;

		// Check if redemption is enabled
		if (!redemptionConfig?.isEnabled) {
			return res.status(403).json({ error: "Point redemption is not enabled" });
		}

		// Validate days range
		const minDays = redemptionConfig.min_redemption_days || 7;
		const maxDays = redemptionConfig.max_redemption_days || 365;

		if (requestedDays < minDays) {
			return res.status(400).json({ error: `Minimum redemption is ${minDays} days` });
		}
		if (requestedDays > maxDays) {
			return res.status(400).json({ error: `Maximum redemption is ${maxDays} days` });
		}

		// Get the redeemable tier
		const tierId = redemptionConfig.redeemable_tier_id;
		const tier = siteSettings?.tiers?.find(t => t._id === tierId);

		if (!tier) {
			return res.status(400).json({ error: "No tier configured for redemption" });
		}

		// Calculate points required
		const pointsPerDollar = redemptionConfig.points_per_dollar || 1000;
		const pricePerMonth = tier.price_monthly || 5;
		const pricePerDay = pricePerMonth / 30;
		const dollarCost = pricePerDay * requestedDays;
		const pointsRequired = Math.ceil(dollarCost * pointsPerDollar);

		// Get user's current points
		const userDoc = await Users.findOne(req.user.id);
		const currentPoints = userDoc?.points || 0;

		if (currentPoints < pointsRequired) {
			return res.status(400).json({
				error: "Insufficient points",
				required: pointsRequired,
				current: currentPoints,
				shortfall: pointsRequired - currentPoints,
			});
		}

		// Deduct points
		userDoc.query.inc("points", -pointsRequired);
		await userDoc.save();

		// Calculate expiration
		const expiresAt = new Date();

		// If user already has this tier, extend from current expiration
		const currentTier = await TierManager.getUserTier(req.user.id);
		if (currentTier?.tier_id === tierId && currentTier?.expires_at && new Date(currentTier.expires_at) > expiresAt) {
			expiresAt.setTime(new Date(currentTier.expires_at).getTime());
		}

		expiresAt.setDate(expiresAt.getDate() + requestedDays);

		// Assign the tier
		await TierManager.setUserTier(req.user.id, tierId, "vote_redemption", expiresAt, "point_redemption");

		logger.info("User redeemed points for tier", {
			userId: req.user.id,
			tierId,
			days: requestedDays,
			pointsSpent: pointsRequired,
			expiresAt,
		});

		res.json({
			success: true,
			tier_name: tier.name,
			days: requestedDays,
			points_spent: pointsRequired,
			points_remaining: currentPoints - pointsRequired,
			expires_at: expiresAt.toISOString(),
		});
	} catch (err) {
		logger.error("Error redeeming points", { userId: req.user?.id }, err);
		res.status(500).json({ error: "Failed to redeem points" });
	}
};

/**
 * Get redemption info for authenticated user
 */
controllers.getRedemptionInfo = async (req, res) => {
	if (!req.isAuthenticated()) {
		return res.status(401).json({ error: "You must be logged in" });
	}

	try {
		const siteSettings = await TierManager.getSiteSettings();
		const redemptionConfig = siteSettings?.vote_rewards?.redemption;

		if (!redemptionConfig?.isEnabled) {
			return res.json({ enabled: false });
		}

		const tierId = redemptionConfig.redeemable_tier_id;
		const tier = siteSettings?.tiers?.find(t => t._id === tierId);

		if (!tier) {
			return res.json({ enabled: false });
		}

		// Get user points
		const userDoc = await Users.findOne(req.user.id);
		const currentPoints = userDoc?.points || 0;

		// Calculate costs
		const pointsPerDollar = redemptionConfig.points_per_dollar || 1000;
		const pricePerMonth = tier.price_monthly || 5;
		const pointsPerMonth = Math.ceil(pricePerMonth * pointsPerDollar);
		const pointsPerDay = Math.ceil((pricePerMonth / 30) * pointsPerDollar);

		// How many days can user afford?
		const affordableDays = Math.floor(currentPoints / pointsPerDay);

		res.json({
			enabled: true,
			tier_id: tierId,
			tier_name: tier.name,
			tier_price_monthly: pricePerMonth,
			points_per_dollar: pointsPerDollar,
			points_per_month: pointsPerMonth,
			points_per_day: pointsPerDay,
			min_days: redemptionConfig.min_redemption_days || 7,
			max_days: redemptionConfig.max_redemption_days || 365,
			user_points: currentPoints,
			affordable_days: affordableDays,
		});
	} catch (err) {
		logger.error("Error getting redemption info", { userId: req.user?.id }, err);
		res.status(500).json({ error: "Failed to get redemption info" });
	}
};
