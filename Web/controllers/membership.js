/**
 * Membership Controller
 *
 * Handles public membership pages and checkout flow
 */

const TierManager = require("../../Modules/TierManager");

const controllers = module.exports;

/**
 * Public membership/pricing page
 */
controllers.pricing = async (req, res) => {
	try {
		const siteSettings = await TierManager.getSiteSettings();
		const tiers = siteSettings?.tiers || [];
		const features = siteSettings?.features || [];

		let userTier = null;
		let subscription = null;

		if (req.isAuthenticated()) {
			userTier = await TierManager.getUserTier(req.user.id);
			subscription = await TierManager.getUserSubscription(req.user.id);
		}

		res.render("pages/membership.ejs", {
			authUser: req.user || null,
			currentPage: "/membership",
			tiers,
			features,
			userTier,
			subscription,
		});
	} catch (err) {
		logger.error("Error loading membership page", {}, err);
		res.status(500).render("pages/error.ejs", {
			error_text: "Failed to load membership page",
			error_line: "Please try again later",
		});
	}
};

/**
 * Create Stripe checkout session
 */
controllers.createCheckout = async (req, res) => {
	if (!req.isAuthenticated()) {
		return res.status(401).json({ error: "You must be logged in to subscribe" });
	}

	const { tier_id: tierId, billing_period: billingPeriod } = req.body;

	if (!tierId) {
		return res.status(400).json({ error: "Tier ID is required" });
	}

	try {
		const siteSettings = await TierManager.getSiteSettings();
		const tier = siteSettings?.tiers?.find(t => t._id === tierId);

		if (!tier || !tier.is_purchasable) {
			return res.status(400).json({ error: "Invalid or unavailable tier" });
		}

		// Check if Stripe is configured
		if (!process.env.STRIPE_SECRET_KEY) {
			return res.status(503).json({ error: "Payment processing is not configured" });
		}

		const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
		const paymentProviders = siteSettings?.payment_providers?.stripe;

		if (!paymentProviders?.isEnabled) {
			return res.status(503).json({ error: "Stripe payments are not enabled" });
		}

		// Find the price ID for this tier
		const priceMapping = paymentProviders.product_mapping?.find(m => m.tier_id === tierId);
		let priceId = priceMapping?.stripe_price_id;

		// If no price mapping, create a price dynamically (for testing)
		if (!priceId) {
			// Create a product and price on the fly
			const price = billingPeriod === "yearly" ? tier.price_yearly : tier.price_monthly;

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

		// Create checkout session
		const session = await stripe.checkout.sessions.create({
			mode: "subscription",
			payment_method_types: ["card"],
			line_items: [{
				price: priceId,
				quantity: 1,
			}],
			success_url: `${configJS.hostingURL}membership/success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${configJS.hostingURL}membership`,
			customer_email: req.user.email || undefined,
			client_reference_id: req.user.id,
			metadata: {
				discord_user_id: req.user.id,
				tier_id: tierId,
				billing_period: billingPeriod,
			},
			subscription_data: {
				metadata: {
					discord_user_id: req.user.id,
					tier_id: tierId,
				},
			},
		});

		logger.info(`Stripe checkout session created for user ${req.user.id}`, { sessionId: session.id, tierId });

		res.json({ checkout_url: session.url });
	} catch (err) {
		logger.error("Error creating checkout session", { userId: req.user?.id }, err);
		res.status(500).json({ error: "Failed to create checkout session" });
	}
};

/**
 * Handle successful checkout
 */
controllers.success = async (req, res) => {
	const sessionId = req.query.session_id;

	if (!sessionId) {
		return res.redirect("/membership");
	}

	try {
		// Verify the session with Stripe
		if (process.env.STRIPE_SECRET_KEY) {
			const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
			const session = await stripe.checkout.sessions.retrieve(sessionId);

			if (session.payment_status === "paid") {
				// The webhook should handle the subscription activation,
				// but we can show a success message here
				return res.render("pages/membership-success.ejs", {
					authUser: req.user || null,
					currentPage: "/membership/success",
					session,
				});
			}
		}

		res.redirect("/membership");
	} catch (err) {
		logger.error("Error verifying checkout session", {}, err);
		res.redirect("/membership");
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
