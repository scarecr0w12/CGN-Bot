/**
 * Account routes for OAuth linking and account settings
 */

const { renderError } = require("../helpers");
const { GetGuild } = require("../../Modules/GetGuild");

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
};
