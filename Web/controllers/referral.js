/**
 * Referral Controller - Handles referral link routes and referral dashboard
 */

const ReferralManager = require("../../Modules/ReferralManager");
const { renderError } = require("../helpers");

const controllers = module.exports;

/**
 * Handle referral invite link
 * GET /invite/ref/:code
 * Redirects to Discord OAuth with referral tracking
 */
controllers.handleReferralInvite = async (req, res) => {
	const { code } = req.params;

	if (!code) {
		return renderError(res, "Invalid referral link", undefined, 400);
	}

	// Validate the referral code exists
	const referrer = await ReferralManager.findUserByReferralCode(code);
	if (!referrer) {
		return renderError(res, "Invalid referral code", undefined, 404);
	}

	// Store referral code in session for processing after bot joins
	if (req.session) {
		req.session.referralCode = code.toUpperCase();
	}

	// If user is authenticated, store a pending referral for them
	// This will be checked when any server they own adds the bot
	if (req.isAuthenticated() && req.app.client.cache) {
		const redis = req.app.client.cache;
		// Store: user who clicked referral link -> referral code (expires in 1 hour)
		await redis.set(`referral:clicker:${req.user.id}`, code.toUpperCase(), "EX", 3600);
		logger.debug("Stored pending referral for user", { userId: req.user.id, code: code.toUpperCase() });
	}

	// Build the OAuth invite URL with state parameter containing referral code
	const hasConfig = global.configJS && typeof global.configJS.oauthLink === "string";
	const hasClient = req.app && req.app.client && req.app.client.user && req.app.client.user.id;

	if (!hasConfig || !hasClient) {
		return renderError(res, "Bot invite link is not configured");
	}

	// Add referral code to state parameter for tracking
	const baseInviteUrl = global.configJS.oauthLink.format({ id: req.app.client.user.id });
	const separator = baseInviteUrl.includes("?") ? "&" : "?";
	const inviteUrl = `${baseInviteUrl}${separator}state=ref_${code.toUpperCase()}`;

	res.redirect(inviteUrl);
};

/**
 * Get user's referral information
 * GET /api/referral/stats
 */
controllers.getReferralStats = async (req, res) => {
	if (!req.isAuthenticated()) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	try {
		const stats = await ReferralManager.getReferralStats(req.user.id);
		const rewards = ReferralManager.getRewardConfig();

		// Generate referral code if user doesn't have one
		if (!stats.referralCode) {
			stats.referralCode = await ReferralManager.generateReferralCode(req.user.id);
		}

		// Build the full referral URL
		stats.referralUrl = ReferralManager.buildReferralUrl(stats.referralCode);

		res.json({
			...stats,
			rewards: {
				basePoints: rewards.BASE_REFERRAL_POINTS,
				retentionBonus: rewards.RETENTION_BONUS_POINTS,
				minServerMembers: rewards.MIN_SERVER_MEMBERS,
			},
		});
	} catch (err) {
		logger.warn("Failed to get referral stats", { userId: req.user.id }, err);
		res.status(500).json({ error: "Failed to get referral statistics" });
	}
};

/**
 * Generate or regenerate referral code
 * POST /api/referral/generate-code
 */
controllers.generateReferralCode = async (req, res) => {
	if (!req.isAuthenticated()) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	try {
		const code = await ReferralManager.generateReferralCode(req.user.id);
		const referralUrl = ReferralManager.buildReferralUrl(code);

		res.json({
			success: true,
			referralCode: code,
			referralUrl,
		});
	} catch (err) {
		logger.warn("Failed to generate referral code", { userId: req.user.id }, err);
		res.status(500).json({ error: "Failed to generate referral code" });
	}
};

/**
 * Referral dashboard page
 * GET /account/referrals
 */
controllers.referralDashboard = async (req, { res }) => {
	if (!req.isAuthenticated()) {
		return res.redirect("/login");
	}

	try {
		const stats = await ReferralManager.getReferralStats(req.user.id);
		const rewards = ReferralManager.getRewardConfig();

		// Generate referral code if user doesn't have one
		if (!stats.referralCode) {
			stats.referralCode = await ReferralManager.generateReferralCode(req.user.id);
		}

		stats.referralUrl = ReferralManager.buildReferralUrl(stats.referralCode);

		res.setPageData({
			page: "account-referrals.ejs",
			pageTitle: "My Referrals",
			referralStats: stats,
			rewards: {
				basePoints: rewards.BASE_REFERRAL_POINTS,
				retentionBonus: rewards.RETENTION_BONUS_POINTS,
				minServerMembers: rewards.MIN_SERVER_MEMBERS,
			},
		});

		res.render();
	} catch (err) {
		logger.warn("Failed to load referral dashboard", { userId: req.user.id }, err);
		renderError(res, "Failed to load referral information");
	}
};
