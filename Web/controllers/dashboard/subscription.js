/**
 * Dashboard Subscription Controller
 *
 * Manages server premium subscription within the server dashboard.
 * Premium is per-server, so admins manage their server's subscription here.
 */

const TierManager = require("../../../Modules/TierManager");
const { renderError } = require("../../helpers");

const controllers = module.exports;

/**
 * Server subscription management page
 */
controllers.manage = async (req, { res }) => {
	const { svr } = req;
	const serverDocument = svr.document;

	try {
		// Get site settings (tiers, features, etc.)
		const siteSettings = await TierManager.getSiteSettings();
		const tiers = siteSettings?.tiers || [];
		const features = siteSettings?.features || [];
		const redemptionConfig = siteSettings?.vote_rewards?.redemption || {};

		// Get server's current subscription
		const subscription = await TierManager.getServerSubscription(svr.id);
		const serverTier = await TierManager.getServerTier(svr.id);
		const serverFeatures = await TierManager.getServerFeatures(svr.id);

		// Get user's points for redemption (server owner or current user)
		let userPoints = 0;
		let redemptionInfo = null;
		if (req.consolemember) {
			const userDoc = await Users.findOne(req.consolemember.user.id);
			userPoints = userDoc?.points || 0;

			// Calculate redemption info
			if (redemptionConfig.isEnabled && redemptionConfig.redeemable_tier_id) {
				const redeemTier = tiers.find(t => t._id === redemptionConfig.redeemable_tier_id);
				if (redeemTier) {
					const pointsPerDollar = redemptionConfig.points_per_dollar || 1000;
					const pricePerMonth = redeemTier.price_monthly || 5;
					const pointsPerDay = Math.ceil((pricePerMonth / 30) * pointsPerDollar);

					redemptionInfo = {
						enabled: true,
						tier: redeemTier,
						pointsPerDollar,
						pointsPerDay,
						pointsPerMonth: Math.ceil(pricePerMonth * pointsPerDollar),
						minDays: redemptionConfig.min_redemption_days || 7,
						maxDays: redemptionConfig.max_redemption_days || 365,
						affordableDays: Math.floor(userPoints / pointsPerDay),
					};
				}
			}
		}

		// Check if server owner (only owner can manage subscription)
		const isOwner = svr.ownerId === req.consolemember?.user?.id;
		const canManageSubscription = isOwner || process.env.SKYNET_HOST === req.consolemember?.user?.id;

		res.setPageData({
			page: "admin-subscription.ejs",
			tiers,
			features,
			serverTier,
			subscription,
			serverFeatures: Array.from(serverFeatures),
			userPoints,
			redemptionInfo,
			isOwner,
			canManageSubscription,
			yearlyDiscount: siteSettings?.yearly_discount || 20,
		});
		// Set minimal configData required for admin-menu partial
		res.setConfigData({
			commands: {
				trivia: serverDocument.config.commands?.trivia || { isEnabled: false },
			},
		});
		res.render();
	} catch (err) {
		logger.error("Error loading subscription page", { svrid: svr.id }, err);
		renderError(res, "Failed to load subscription page", err.message);
	}
};

/**
 * Redeem points for server premium
 */
controllers.redeemPoints = async (req, res) => {
	const { svr } = req;
	const userId = req.consolemember?.user?.id;

	// Only server owner can redeem points for the server
	const isOwner = svr.ownerId === userId;
	if (!isOwner && process.env.SKYNET_HOST !== userId) {
		return res.status(403).json({ error: "Only the server owner can redeem points for server premium" });
	}

	const { days } = req.body;
	const requestedDays = parseInt(days, 10);

	if (!requestedDays || requestedDays < 1) {
		return res.status(400).json({ error: "Invalid number of days" });
	}

	try {
		const siteSettings = await TierManager.getSiteSettings();
		const redemptionConfig = siteSettings?.vote_rewards?.redemption || {};

		if (!redemptionConfig.isEnabled) {
			return res.status(400).json({ error: "Point redemption is not enabled" });
		}

		const tiers = siteSettings?.tiers || [];
		const redeemTier = tiers.find(t => t._id === redemptionConfig.redeemable_tier_id);
		if (!redeemTier) {
			return res.status(400).json({ error: "Redeemable tier not configured" });
		}

		// Check bounds
		const minDays = redemptionConfig.min_redemption_days || 7;
		const maxDays = redemptionConfig.max_redemption_days || 365;
		if (requestedDays < minDays || requestedDays > maxDays) {
			return res.status(400).json({ error: `Days must be between ${minDays} and ${maxDays}` });
		}

		// Calculate cost
		const pointsPerDollar = redemptionConfig.points_per_dollar || 1000;
		const pricePerMonth = redeemTier.price_monthly || 5;
		const pointsPerDay = Math.ceil((pricePerMonth / 30) * pointsPerDollar);
		const totalCost = pointsPerDay * requestedDays;

		// Check user has enough points
		const userDoc = await Users.findOne(userId);
		const userPoints = userDoc?.points || 0;

		if (userPoints < totalCost) {
			return res.status(400).json({
				error: `Insufficient points. Need ${totalCost.toLocaleString()}, have ${userPoints.toLocaleString()}`,
			});
		}

		// Deduct points
		userDoc.query.inc("points", -totalCost);
		await userDoc.save();

		// Calculate expiration
		const currentSubscription = await TierManager.getServerSubscription(svr.id);
		let expiresAt;
		if (currentSubscription?.expires_at && new Date(currentSubscription.expires_at) > new Date()) {
			// Extend existing subscription
			expiresAt = new Date(currentSubscription.expires_at);
			expiresAt.setDate(expiresAt.getDate() + requestedDays);
		} else {
			// New subscription
			expiresAt = new Date();
			expiresAt.setDate(expiresAt.getDate() + requestedDays);
		}

		// Set server tier
		try {
			const result = await TierManager.setServerTier(
				svr.id,
				redeemTier._id,
				"points_redemption",
				expiresAt,
				`Redeemed ${requestedDays} days with ${totalCost} points`,
				userId,
			);

			if (!result) {
				throw new Error("Failed to apply premium tier to server");
			}
		} catch (err) {
			logger.error("Failed to apply tier after point deduction, refunding points", { svrid: svr.id, userId, points: totalCost }, err);

			// Refund points
			userDoc.query.inc("points", totalCost);
			await userDoc.save();

			throw new Error("Failed to apply premium tier. Points have been refunded.");
		}

		logger.info("Server premium redeemed with points", {
			svrid: svr.id,
			userId,
			days: requestedDays,
			pointsSpent: totalCost,
			expiresAt,
		});

		res.json({
			success: true,
			message: `Successfully redeemed ${requestedDays} days of premium!`,
			newExpiration: expiresAt.toISOString(),
			pointsSpent: totalCost,
			remainingPoints: userPoints - totalCost,
		});
	} catch (err) {
		logger.error("Failed to redeem points for server premium", { svrid: svr.id, userId }, err);
		res.status(500).json({ error: "Failed to redeem points" });
	}
};

/**
 * Cancel server subscription
 */
controllers.cancel = async (req, res) => {
	const { svr } = req;
	const userId = req.consolemember?.user?.id;

	// Only server owner can cancel
	const isOwner = svr.ownerId === userId;
	if (!isOwner && process.env.SKYNET_HOST !== userId) {
		return res.status(403).json({ error: "Only the server owner can cancel the subscription" });
	}

	try {
		await TierManager.cancelSubscription(svr.id, "user_canceled");

		logger.info("Server subscription canceled", { svrid: svr.id, userId });

		res.json({ success: true, message: "Subscription canceled" });
	} catch (err) {
		logger.error("Failed to cancel server subscription", { svrid: svr.id, userId }, err);
		res.status(500).json({ error: "Failed to cancel subscription" });
	}
};
