/**
 * Account routes for OAuth linking and account settings
 */

const { renderError } = require("../helpers");

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

			const userTier = await TierManager.getUserTier(req.user.id);
			const userFeatures = await TierManager.getUserFeatures(req.user.id);

			res.render("pages/account-settings.ejs", {
				authUser: req.user,
				currentPage: "/account",
				linkedAccounts: userDoc?.linked_accounts || [],
				subscription: userDoc?.subscription || {},
				userTier: userTier,
				userFeatures: Array.from(userFeatures),
				oauthProviders: siteSettings?.oauth_providers || {},
				tiers: siteSettings?.tiers || [],
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

			const existingAccounts = user.linked_accounts?.filter(a => a._id !== provider) || [];
			user.query.set("linked_accounts", existingAccounts);
			await user.save();

			res.json({ success: true, message: `${provider} account unlinked` });
		} catch (err) {
			logger.error(`Error unlinking ${provider}`, {}, err);
			res.status(500).json({ error: "Failed to unlink account" });
		}
	});
};
