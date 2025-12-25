/**
 * Account routes for OAuth linking and account settings
 */

const { renderError } = require("../helpers");
const { GetGuild } = require("../../Modules/GetGuild");
const VoteRewardsManager = require("../../Modules/VoteRewardsManager");
const PremiumExtensionsManager = require("../../Modules/PremiumExtensionsManager");

module.exports = router => {
	const { passport } = router.app;

	// Account Settings Page
	router.get("/account", async (req, res) => {
		if (!req.isAuthenticated()) {
			return res.redirect("/login");
		}

		try {
			const TierManager = require("../../Modules/TierManager");
			const siteSettings = await TierManager.getSiteSettings();
			const userDoc = await Users.findOne(req.user.id);

			// Ensure linkedAccounts is always an array (MariaDB JSON fields may return non-array values)
			const linkedAccounts = Array.isArray(userDoc?.linked_accounts) ? userDoc.linked_accounts : [];

			res.render("pages/account-settings.ejs", {
				authUser: req.user,
				currentPage: "/account",
				linkedAccounts,
				oauthProviders: siteSettings?.oauth_providers || {},
				success: req.query.success || null,
				error: req.query.error || null,
			});
		} catch (err) {
			logger.error("Error loading account settings", {}, err);
			renderError(res, "Failed to load account settings.");
		}
	});

	// OAuth Link Routes - Google
	router.get("/auth/google", (req, res, next) => {
		if (!req.isAuthenticated()) {
			return res.redirect("/login");
		}
		passport.authenticate("google-link", { scope: ["profile", "email"] })(req, res, next);
	});

	router.get("/auth/google/callback",
		(req, res, next) => {
			passport.authenticate("google-link", {
				failureRedirect: "/account?error=google_link_failed",
				successRedirect: "/account?success=google_linked",
			})(req, res, next);
		},
	);

	// OAuth Link Routes - GitHub
	router.get("/auth/github", (req, res, next) => {
		if (!req.isAuthenticated()) {
			return res.redirect("/login");
		}
		passport.authenticate("github-link", { scope: ["user:email"] })(req, res, next);
	});

	router.get("/auth/github/callback",
		(req, res, next) => {
			passport.authenticate("github-link", {
				failureRedirect: "/account?error=github_link_failed",
				successRedirect: "/account?success=github_linked",
			})(req, res, next);
		},
	);

	// OAuth Link Routes - Twitch
	router.get("/auth/twitch", (req, res, next) => {
		if (!req.isAuthenticated()) {
			return res.redirect("/login");
		}
		passport.authenticate("twitch-link")(req, res, next);
	});

	router.get("/auth/twitch/callback",
		(req, res, next) => {
			passport.authenticate("twitch-link", {
				failureRedirect: "/account?error=twitch_link_failed",
				successRedirect: "/account?success=twitch_linked",
			})(req, res, next);
		},
	);

	// OAuth Link Routes - Patreon
	router.get("/auth/patreon", (req, res, next) => {
		if (!req.isAuthenticated()) {
			return res.redirect("/login");
		}
		passport.authenticate("patreon-link")(req, res, next);
	});

	router.get("/auth/patreon/callback",
		(req, res, next) => {
			passport.authenticate("patreon-link", {
				failureRedirect: "/account?error=patreon_link_failed",
				successRedirect: "/account?success=patreon_linked",
			})(req, res, next);
		},
	);

	// Unlink Account
	router.post("/account/unlink/:provider", async (req, res) => {
		if (!req.isAuthenticated()) {
			return res.sendStatus(401);
		}

		const { provider } = req.params;
		const validProviders = ["google", "github", "twitch", "patreon"];

		if (!validProviders.includes(provider)) {
			return res.status(400).json({ error: "Invalid provider" });
		}

		try {
			const user = await Users.findOne(req.user.id);
			if (!user) {
				return res.status(404).json({ error: "User not found" });
			}

			const existingAccounts = Array.isArray(user.linked_accounts) ? user.linked_accounts.filter(a => a._id !== provider) : [];
			user.query.set("linked_accounts", existingAccounts);
			await user.save();

			res.json({ success: true, message: `${provider} account unlinked` });
		} catch (err) {
			logger.error(`Error unlinking ${provider}`, {}, err);
			res.status(500).json({ error: "Failed to unlink account" });
		}
	});

	// Get mutual servers (servers where user and bot are both present)
	router.get("/account/servers", async (req, res) => {
		if (!req.isAuthenticated()) {
			return res.status(401).json({ error: "Not authenticated" });
		}

		try {
			const botServers = await GetGuild.getAll(req.app.client, {
				mutualOnlyTo: req.user.id,
				fullResolveMembers: ["OWNER"],
				parse: "noKeys",
			});

			const mutualServers = await Promise.all(
				botServers.sort((a, b) => a.name.localeCompare(b.name)).map(async svr => {
					const serverDocument = await Servers.findOne(svr.id);
					const memberDocument = serverDocument?.members?.[req.user.id];
					const owner = svr.members[svr.ownerId] || { username: "Unknown" };

					return {
						id: svr.id,
						name: svr.name,
						icon: req.app.client.getAvatarURL(svr.id, svr.icon, "icons"),
						owner: owner.username,
						memberCount: svr.memberCount,
						hasProfile: memberDocument?.profile_fields && Object.keys(memberDocument.profile_fields).length > 0,
						profile: memberDocument?.profile_fields || {},
					};
				}),
			);

			res.json({ servers: mutualServers });
		} catch (err) {
			logger.error("Error fetching mutual servers", {}, err);
			res.status(500).json({ error: "Failed to fetch servers" });
		}
	});

	// Get per-server profile for a specific server
	router.get("/account/servers/:serverId/profile", async (req, res) => {
		if (!req.isAuthenticated()) {
			return res.status(401).json({ error: "Not authenticated" });
		}

		const { serverId } = req.params;

		try {
			// Verify user is in the server
			const svr = new GetGuild(req.app.client, serverId);
			await svr.initialize(req.user.id, req.user.id);

			if (!svr.success) {
				return res.status(403).json({ error: "You are not a member of this server" });
			}

			const serverDocument = await Servers.findOne(serverId);
			if (!serverDocument) {
				return res.status(404).json({ error: "Server not found" });
			}

			const memberDocument = serverDocument.members?.[req.user.id];
			const profile = memberDocument?.profile_fields || {};

			res.json({
				serverId,
				serverName: svr.name,
				profile,
			});
		} catch (err) {
			logger.error("Error fetching server profile", { serverId }, err);
			res.status(500).json({ error: "Failed to fetch profile" });
		}
	});

	// Update per-server profile
	router.put("/account/servers/:serverId/profile", async (req, res) => {
		if (!req.isAuthenticated()) {
			return res.status(401).json({ error: "Not authenticated" });
		}

		const { serverId } = req.params;
		const { profile_fields } = req.body;

		if (!profile_fields || typeof profile_fields !== "object") {
			return res.status(400).json({ error: "Invalid profile data" });
		}

		// Validate profile fields (max 10 fields, max 100 char key, max 500 char value)
		const keys = Object.keys(profile_fields);
		if (keys.length > 10) {
			return res.status(400).json({ error: "Maximum 10 profile fields allowed" });
		}

		for (const key of keys) {
			if (key.length > 100) {
				return res.status(400).json({ error: "Field name must be 100 characters or less" });
			}
			if (typeof profile_fields[key] !== "string" || profile_fields[key].length > 500) {
				return res.status(400).json({ error: "Field value must be a string of 500 characters or less" });
			}
		}

		try {
			// Verify user is in the server
			const svr = new GetGuild(req.app.client, serverId);
			await svr.initialize(req.user.id, req.user.id);

			if (!svr.success) {
				return res.status(403).json({ error: "You are not a member of this server" });
			}

			const serverDocument = await Servers.findOne(serverId);
			if (!serverDocument) {
				return res.status(404).json({ error: "Server not found" });
			}

			// Ensure member document exists
			let memberDocument = serverDocument.members?.[req.user.id];
			if (!memberDocument) {
				serverDocument.query.prop("members").push({ _id: req.user.id });
				memberDocument = serverDocument.members[req.user.id];
			}

			// Update profile fields
			serverDocument.query.id("members", req.user.id).set("profile_fields", profile_fields);
			await serverDocument.save();

			res.json({
				success: true,
				message: "Profile updated successfully",
				profile: profile_fields,
			});
		} catch (err) {
			logger.error("Error updating server profile", { serverId }, err);
			res.status(500).json({ error: "Failed to update profile" });
		}
	});

	// Delete per-server profile
	router.delete("/account/servers/:serverId/profile", async (req, res) => {
		if (!req.isAuthenticated()) {
			return res.status(401).json({ error: "Not authenticated" });
		}

		const { serverId } = req.params;

		try {
			// Verify user is in the server
			const svr = new GetGuild(req.app.client, serverId);
			await svr.initialize(req.user.id, req.user.id);

			if (!svr.success) {
				return res.status(403).json({ error: "You are not a member of this server" });
			}

			const serverDocument = await Servers.findOne(serverId);
			if (!serverDocument) {
				return res.status(404).json({ error: "Server not found" });
			}

			const memberDocument = serverDocument.members?.[req.user.id];
			if (memberDocument) {
				serverDocument.query.id("members", req.user.id).set("profile_fields", {});
				await serverDocument.save();
			}

			res.json({ success: true, message: "Profile deleted successfully" });
		} catch (err) {
			logger.error("Error deleting server profile", { serverId }, err);
			res.status(500).json({ error: "Failed to delete profile" });
		}
	});

	// ============================================
	// VOTE REWARDS ROUTES
	// ============================================

	// Get user's vote rewards info
	router.get("/account/vote-rewards", async (req, res) => {
		if (!req.isAuthenticated()) {
			return res.status(401).json({ error: "Not authenticated" });
		}

		try {
			const [voteRewards, settings, voteSites] = await Promise.all([
				VoteRewardsManager.getUserVoteRewards(req.user.id),
				VoteRewardsManager.getSettings(),
				VoteRewardsManager.getVoteSites(),
			]);

			// Check vote availability for each site
			const sitesWithStatus = await Promise.all(
				voteSites.map(async site => {
					const status = await VoteRewardsManager.canVote(req.user.id, site.id);
					return { ...site, ...status };
				}),
			);

			res.json({
				balance: voteRewards.balance || 0,
				lifetimeEarned: voteRewards.lifetime_earned || 0,
				lifetimeSpent: voteRewards.lifetime_spent || 0,
				totalVotes: voteRewards.total_votes || 0,
				lastVoteAt: voteRewards.last_vote_at,
				isEnabled: settings.isEnabled || false,
				pointsPerVote: settings.points_per_vote || 100,
				weekendMultiplier: settings.weekend_multiplier || 2,
				redemption: settings.redemption || {},
				voteSites: sitesWithStatus,
			});
		} catch (err) {
			logger.error("Error fetching vote rewards", {}, err);
			res.status(500).json({ error: "Failed to fetch vote rewards" });
		}
	});

	// Get vote rewards transaction history
	router.get("/account/vote-rewards/history", async (req, res) => {
		if (!req.isAuthenticated()) {
			return res.status(401).json({ error: "Not authenticated" });
		}

		try {
			const limit = Math.min(parseInt(req.query.limit) || 50, 100);
			const transactions = await VoteRewardsManager.getTransactionHistory(req.user.id, limit);

			res.json({ transactions });
		} catch (err) {
			logger.error("Error fetching vote rewards history", {}, err);
			res.status(500).json({ error: "Failed to fetch history" });
		}
	});

	// Redeem points for a premium tier on a server
	router.post("/account/vote-rewards/redeem-tier", async (req, res) => {
		if (!req.isAuthenticated()) {
			return res.status(401).json({ error: "Not authenticated" });
		}

		const { serverId, tierId, durationDays } = req.body;

		if (!serverId || !tierId || !durationDays) {
			return res.status(400).json({ error: "Missing required fields: serverId, tierId, durationDays" });
		}

		try {
			// Verify user is the server owner or has admin permissions
			const svr = new GetGuild(req.app.client, serverId);
			await svr.initialize(req.user.id, req.user.id);

			if (!svr.success) {
				return res.status(403).json({ error: "You are not a member of this server" });
			}

			// Check if user is server owner
			if (svr.ownerId !== req.user.id) {
				return res.status(403).json({ error: "Only server owners can redeem premium tiers" });
			}

			const result = await VoteRewardsManager.redeemForTier(
				req.user.id,
				serverId,
				tierId,
				parseInt(durationDays),
			);

			res.json(result);
		} catch (err) {
			logger.error("Error redeeming vote rewards for tier", { serverId, tierId }, err);
			res.status(400).json({ error: err.message || "Failed to redeem points" });
		}
	});

	// Get servers where user is owner (for tier redemption)
	router.get("/account/vote-rewards/owned-servers", async (req, res) => {
		if (!req.isAuthenticated()) {
			return res.status(401).json({ error: "Not authenticated" });
		}

		try {
			const TierManager = require("../../Modules/TierManager");
			const botServers = await GetGuild.getAll(req.app.client, {
				mutualOnlyTo: req.user.id,
				fullResolveMembers: ["OWNER"],
				parse: "noKeys",
			});

			// Filter to servers where user is owner
			const ownedServers = await Promise.all(
				botServers
					.filter(svr => svr.ownerId === req.user.id)
					.map(async svr => {
						const serverTier = await TierManager.getServerTier(svr.id);
						const subscription = await TierManager.getServerSubscription(svr.id);

						return {
							id: svr.id,
							name: svr.name,
							icon: req.app.client.getAvatarURL(svr.id, svr.icon, "icons"),
							memberCount: svr.memberCount,
							currentTier: serverTier,
							subscription: subscription ? {
								tierId: subscription.tier_id,
								expiresAt: subscription.expires_at,
								source: subscription.source,
							} : null,
						};
					}),
			);

			res.json({ servers: ownedServers });
		} catch (err) {
			logger.error("Error fetching owned servers", {}, err);
			res.status(500).json({ error: "Failed to fetch servers" });
		}
	});

	// Get available tiers for redemption
	router.get("/account/vote-rewards/tiers", async (req, res) => {
		if (!req.isAuthenticated()) {
			return res.status(401).json({ error: "Not authenticated" });
		}

		try {
			const TierManager = require("../../Modules/TierManager");
			const [tiers, settings] = await Promise.all([
				TierManager.getTiers(),
				VoteRewardsManager.getSettings(),
			]);

			const pointsPerDollar = settings.redemption?.points_per_dollar || 1000;

			// Calculate point costs for each tier
			const tiersWithCosts = tiers
				.filter(t => t.price_monthly > 0)
				.map(tier => {
					const dailyPrice = tier.price_monthly / 30;
					return {
						id: tier._id,
						name: tier.name,
						description: tier.description,
						level: tier.level,
						priceMonthly: tier.price_monthly,
						pointsCostPerDay: Math.ceil(dailyPrice * pointsPerDollar),
						pointsCostPerWeek: Math.ceil(dailyPrice * 7 * pointsPerDollar),
						pointsCostPerMonth: Math.ceil(tier.price_monthly * pointsPerDollar),
						features: tier.features,
						color: tier.color,
						badgeIcon: tier.badge_icon,
					};
				});

			res.json({
				tiers: tiersWithCosts,
				minDays: settings.redemption?.min_redemption_days || 7,
				maxDays: settings.redemption?.max_redemption_days || 365,
			});
		} catch (err) {
			logger.error("Error fetching tiers for redemption", {}, err);
			res.status(500).json({ error: "Failed to fetch tiers" });
		}
	});

	// Get point packages for purchase
	router.get("/account/vote-rewards/packages", async (req, res) => {
		if (!req.isAuthenticated()) {
			return res.status(401).json({ error: "Not authenticated" });
		}

		try {
			const settings = await VoteRewardsManager.getSettings();
			const purchaseSettings = settings.purchase || {};

			if (!purchaseSettings.isEnabled) {
				return res.json({ isEnabled: false, packages: [] });
			}

			res.json({
				isEnabled: true,
				packages: purchaseSettings.packages || [],
				minAmount: purchaseSettings.min_purchase_amount || 5,
				maxAmount: purchaseSettings.max_purchase_amount || 100,
				pointsPerDollar: settings.redemption?.points_per_dollar || 1000,
			});
		} catch (err) {
			logger.error("Error fetching point packages", {}, err);
			res.status(500).json({ error: "Failed to fetch packages" });
		}
	});

	// Purchase a premium extension with vote points
	router.post("/account/vote-rewards/redeem-extension", async (req, res) => {
		if (!req.isAuthenticated()) {
			return res.status(401).json({ error: "Not authenticated" });
		}

		const { extensionId } = req.body;

		if (!extensionId) {
			return res.status(400).json({ error: "Missing extensionId" });
		}

		try {
			const result = await VoteRewardsManager.redeemForExtension(req.user.id, extensionId);
			res.json(result);
		} catch (err) {
			logger.error("Error purchasing extension", { extensionId }, err);
			res.status(400).json({ error: err.message || "Failed to purchase extension" });
		}
	});

	router.get("/account/extensions/earnings", async (req, res) => {
		if (!req.isAuthenticated()) {
			return res.status(401).json({ error: "Not authenticated" });
		}
		try {
			const earnings = await PremiumExtensionsManager.getExtensionEarnings(req.user.id);
			const extensions = await PremiumExtensionsManager.getUserExtensions(req.user.id);
			return res.json({ earnings, extensions });
		} catch (err) {
			logger.error("Error fetching extension earnings", {}, err);
			return res.status(500).json({ error: "Failed to fetch earnings" });
		}
	});

	router.post("/account/extensions/withdraw", async (req, res) => {
		if (!req.isAuthenticated()) {
			return res.status(401).json({ error: "Not authenticated" });
		}
		const amount = typeof req.body?.amount === "string" ? parseInt(req.body.amount, 10) : req.body?.amount;
		try {
			const result = await PremiumExtensionsManager.withdrawEarnings(req.user.id, amount);
			return res.json(result);
		} catch (err) {
			logger.error("Error withdrawing extension earnings", {}, err);
			return res.status(400).json({ error: err.message || "Failed to withdraw earnings" });
		}
	});

	// Check if user has access to a premium extension
	router.get("/account/vote-rewards/extension-access/:extensionId", async (req, res) => {
		if (!req.isAuthenticated()) {
			return res.status(401).json({ error: "Not authenticated" });
		}

		try {
			const hasAccess = await VoteRewardsManager.hasUserPurchasedExtension(
				req.user.id,
				req.params.extensionId,
			);
			res.json({ hasAccess });
		} catch (err) {
			logger.error("Error checking extension access", {}, err);
			res.status(500).json({ error: "Failed to check access" });
		}
	});

	// Create checkout session for point purchase
	router.post("/account/vote-rewards/purchase", async (req, res) => {
		if (!req.isAuthenticated()) {
			return res.status(401).json({ error: "Not authenticated" });
		}

		const { packageId, customAmount } = req.body;

		try {
			const TierManager = require("../../Modules/TierManager");
			const siteSettings = await TierManager.getSiteSettings();
			const settings = siteSettings?.vote_rewards || {};
			const purchaseSettings = settings.purchase || {};

			if (!purchaseSettings.isEnabled) {
				return res.status(400).json({ error: "Point purchases are not enabled" });
			}

			let amount, points, bonusPoints = 0, description;

			if (packageId) {
				// Package purchase
				const pkg = (purchaseSettings.packages || []).find(p => p._id === packageId);
				if (!pkg) {
					return res.status(404).json({ error: "Package not found" });
				}
				amount = pkg.price;
				points = pkg.points;
				bonusPoints = pkg.bonus_points || 0;
				description = `Vote Points: ${pkg.name || `${points} points`}`;
			} else if (customAmount) {
				// Custom amount purchase
				amount = parseFloat(customAmount);
				const minAmount = purchaseSettings.min_purchase_amount || 5;
				const maxAmount = purchaseSettings.max_purchase_amount || 100;

				if (amount < minAmount || amount > maxAmount) {
					return res.status(400).json({ error: `Amount must be between $${minAmount} and $${maxAmount}` });
				}

				const pointsPerDollar = settings.redemption?.points_per_dollar || 1000;
				points = Math.floor(amount * pointsPerDollar);
				description = `Vote Points: ${points} points`;
			} else {
				return res.status(400).json({ error: "Please specify packageId or customAmount" });
			}

			// Check which payment provider to use
			const stripeEnabled = siteSettings?.payment_providers?.stripe?.isEnabled && process.env.STRIPE_SECRET_KEY;
			const btcpayEnabled = siteSettings?.payment_providers?.btcpay?.isEnabled && process.env.BTCPAY_API_KEY;

			if (stripeEnabled) {
				// Create Stripe checkout session
				const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

				const session = await stripe.checkout.sessions.create({
					mode: "payment",
					payment_method_types: ["card"],
					line_items: [{
						price_data: {
							currency: "usd",
							product_data: {
								name: description,
								description: bonusPoints > 0 ? `Includes ${bonusPoints} bonus points!` : undefined,
							},
							unit_amount: Math.round(amount * 100),
						},
						quantity: 1,
					}],
					metadata: {
						type: "vote_points_purchase",
						user_id: req.user.id,
						points: points.toString(),
						bonus_points: bonusPoints.toString(),
						package_id: packageId || "",
					},
					success_url: `${process.env.WEB_BASE_URL || `${req.protocol}://${req.get("host")}`}/account?success=points_purchased`,
					cancel_url: `${process.env.WEB_BASE_URL || `${req.protocol}://${req.get("host")}`}/account?error=purchase_cancelled`,
				});

				return res.json({ checkoutUrl: session.url, provider: "stripe" });
			} else if (btcpayEnabled) {
				// Create BTCPay invoice
				const fetch = require("node-fetch");
				const btcpayUrl = process.env.BTCPAY_URL;
				const btcpayApiKey = process.env.BTCPAY_API_KEY;
				const btcpayStoreId = process.env.BTCPAY_STORE_ID;

				const invoiceResponse = await fetch(`${btcpayUrl}/api/v1/stores/${btcpayStoreId}/invoices`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `token ${btcpayApiKey}`,
					},
					body: JSON.stringify({
						amount: amount.toString(),
						currency: "USD",
						metadata: {
							type: "vote_points_purchase",
							user_id: req.user.id,
							points: points.toString(),
							bonus_points: bonusPoints.toString(),
							package_id: packageId || "",
						},
						checkout: {
							redirectURL: `${process.env.WEB_BASE_URL || `${req.protocol}://${req.get("host")}`}/account?success=points_purchased`,
						},
					}),
				});

				if (!invoiceResponse.ok) {
					throw new Error("Failed to create BTCPay invoice");
				}

				const invoice = await invoiceResponse.json();
				return res.json({ checkoutUrl: invoice.checkoutLink, provider: "btcpay" });
			} else {
				return res.status(400).json({ error: "No payment provider configured" });
			}
		} catch (err) {
			logger.error("Error creating point purchase checkout", {}, err);
			res.status(500).json({ error: "Failed to create checkout session" });
		}
	});
};
