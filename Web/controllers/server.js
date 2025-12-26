/**
 * Public Server Page Controller
 * Handles SEO-friendly public server pages with slugs
 * Includes Server Profiles (Tier 1+) with customization options
 */

const parsers = require("../parsers");
const { renderError } = require("../helpers");
const { getGuild, TierManager } = require("../../Modules");
const CacheManager = require("../../Modules/CacheManager");
const { GetGuild } = getGuild;
const { generateUniqueSlug } = require("../../Modules/Utils/Slug");

// Social platform icons mapping
const SOCIAL_ICONS = {
	website: "fa-globe",
	twitter: "fa-twitter",
	youtube: "fa-youtube",
	twitch: "fa-twitch",
	reddit: "fa-reddit",
	github: "fa-github",
	instagram: "fa-instagram",
	tiktok: "fa-tiktok",
};

const controllers = module.exports;

/**
 * Public server page - displays server info with SEO-friendly slug URL
 * All servers have a basic profile page, Tier 1+ can customize
 * Routes: /server/:id/:slug, /server/:id (legacy, redirects to slug)
 */
controllers.publicPage = async (req, { res }) => {
	const serverId = req.params.id;

	// Find server document
	const serverDocument = await CacheManager.getServer(serverId);
	if (!serverDocument) {
		return renderError(res, "Server not found", undefined, 404);
	}

	// Check if server allows public visibility
	const publicData = serverDocument.config?.public_data || {};
	if (publicData.isShown === false) {
		return renderError(res, "This server's public page is not available", undefined, 404);
	}

	// Get guild data for name/icon
	const svr = new GetGuild(req.app.client, serverId);
	await svr.initialize();

	if (!svr.success) {
		return renderError(res, "Server not found", undefined, 404);
	}

	// Ensure server_listing object exists
	const serverListing = publicData.server_listing || {};

	// Generate slug if missing and listing is enabled
	if (!serverListing.slug && svr.name && serverListing.isEnabled) {
		const checkSlugExists = async slug => {
			const existing = await Servers.findOne({
				"config.public_data.server_listing.slug": slug,
				_id: { $ne: serverId },
			});
			return !!existing;
		};
		const newSlug = await generateUniqueSlug(svr.name, checkSlugExists);
		if (newSlug) {
			serverDocument.query.set("config.public_data.server_listing.slug", newSlug);
			await serverDocument.save().catch(() => null);
			serverListing.slug = newSlug;
		}
	}

	// Redirect legacy URL to canonical slug URL (301 for SEO) - only if slug exists
	if (serverListing.slug && !req.params.slug) {
		return res.redirect(301, `/server/${serverId}/${serverListing.slug}`);
	}

	// If slug doesn't match, redirect to correct slug
	if (serverListing.slug && req.params.slug !== serverListing.slug) {
		return res.redirect(301, `/server/${serverId}/${serverListing.slug}`);
	}

	// Parse server data for display
	const webp = req.accepts("image/webp") === "image/webp";
	const serverData = await parsers.serverData(req, serverDocument, webp);

	if (!serverData) {
		return renderError(res, "Failed to load server data", undefined, 500);
	}

	// Calculate member stats
	const memberCount = serverDocument.members ? Object.keys(serverDocument.members).length : 0;
	const messagesCount = serverDocument.messages_today || 0;

	// Build canonical URL
	const canonicalUrl = serverListing.slug ?
		`/server/${serverId}/${serverListing.slug}` :
		`/server/${serverId}`;

	// Build page title and description for SEO
	const pageTitle = `${serverData.name} - Discord Server`;
	const pageDescription = serverListing.description ?
		serverListing.description.substring(0, 160) :
		`Join ${serverData.name} on Discord. ${memberCount} members.`;

	// Get tier info for profile features - tier object has 'level' property
	const tierInfo = await TierManager.getServerTier(serverId);
	const tierLevel = tierInfo?.level || 0;
	const hasTier1 = tierLevel >= 1;
	const hasTier2 = tierLevel >= 2;

	// Get profile data if Tier 1+ and enabled
	const serverProfile = publicData.server_profile || {};
	const profileEnabled = hasTier1 && serverProfile.isEnabled;

	// Process social links with icons
	const socialLinks = (serverProfile.social_links || []).map(link => ({
		...link,
		icon: SOCIAL_ICONS[link.platform] || "fa-link",
	}));

	// Get leaderboard data if showing
	let leaderboard = [];
	if (profileEnabled && serverProfile.show_sections?.leaderboard) {
		const members = serverDocument.members || {};
		leaderboard = Object.entries(members)
			.filter(([, data]) => data.points > 0)
			.sort((a, b) => (b[1].points || 0) - (a[1].points || 0))
			.slice(0, 10)
			.map(([id, data], index) => ({
				rank: index + 1,
				odid: id,
				points: data.points || 0,
				username: svr.members[id]?.username || `User`,
				avatar: svr.members[id]?.avatar || null,
			}));
	}

	// Get featured channels if showing (Tier 2)
	let featuredChannels = [];
	if (hasTier2 && profileEnabled && serverProfile.show_sections?.channels && serverProfile.featured_channels?.length) {
		const channelIds = serverProfile.featured_channels;
		featuredChannels = channelIds
			.map(chId => {
				const ch = svr.channels?.[chId];
				if (!ch) return null;
				return {
					id: chId,
					name: ch.name,
					type: ch.type,
				};
			})
			.filter(Boolean)
			.slice(0, 5);
	}

	res.setPageData({
		page: "server-public.ejs",
		pageTitle,
		pageDescription,
		canonicalUrl,
		serverData: {
			...serverData,
			slug: serverListing.slug,
			category: serverListing.category || "Other",
			description: serverListing.description,
			inviteLink: serverListing.invite_link,
			memberCount,
			messagesCount,
		},
		// Profile data (Tier 1+)
		profile: {
			enabled: profileEnabled,
			hasTier1,
			hasTier2,
			bannerUrl: serverProfile.banner_url,
			tagline: serverProfile.tagline,
			about: serverProfile.about,
			rules: serverProfile.rules,
			themeColor: serverProfile.theme_color || "#14b8a6",
			socialLinks,
			showSections: serverProfile.show_sections || {},
			leaderboard,
			featuredChannels,
			// Discord widget (Tier 2 only)
			discordWidget: hasTier2 && serverProfile.discord_widget?.isEnabled ? {
				enabled: true,
				serverId,
			} : { enabled: false },
		},
		// JSON-LD structured data for SEO
		jsonLd: {
			"@context": "https://schema.org",
			"@type": "Organization",
			name: serverData.name,
			description: serverListing.description || `Discord community server`,
			url: `${configJS.hostingURL}server/${serverId}/${serverListing.slug || ""}`,
			logo: serverData.icon,
			foundingDate: serverDocument.added_at ? new Date(serverDocument.added_at).toISOString().split("T")[0] : undefined,
			numberOfEmployees: memberCount > 0 ? {
				"@type": "QuantitativeValue",
				value: memberCount,
				description: "Discord server members",
			} : undefined,
			interactionStatistic: messagesCount > 0 ? {
				"@type": "InteractionCounter",
				interactionType: "https://schema.org/CommentAction",
				userInteractionCount: messagesCount,
				description: "Messages today",
			} : undefined,
			category: serverListing.category || "Discord Server",
			memberOf: {
				"@type": "WebSite",
				name: "Skynet Discord Bot",
				url: configJS.hostingURL,
			},
		},
	});

	res.render();
};

/**
 * Generate or regenerate slug for a server
 * POST /server/:id/generate-slug
 */
controllers.generateSlug = async (req, res) => {
	if (!req.isAuthenticated()) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	const serverId = req.params.id;
	const serverDocument = await CacheManager.getServer(serverId);

	if (!serverDocument) {
		return res.status(404).json({ error: "Server not found" });
	}

	// Check if user has admin access to this server
	const svr = new GetGuild(req.app.client, serverId);
	await svr.initialize(req.user.id);

	if (!svr.success) {
		return res.status(404).json({ error: "Server not found" });
	}

	const member = svr.members[req.user.id];
	if (req.app.client.getUserBotAdmin(svr, serverDocument, member) < 3) {
		return res.status(403).json({ error: "Insufficient permissions" });
	}

	// Generate new slug from server name
	const checkSlugExists = async slug => {
		const existing = await Servers.findOne({
			"config.public_data.server_listing.slug": slug,
			_id: { $ne: serverId },
		});
		return !!existing;
	};

	const newSlug = await generateUniqueSlug(svr.name, checkSlugExists);

	if (!newSlug) {
		return res.status(500).json({ error: "Failed to generate slug" });
	}

	serverDocument.query.set("config.public_data.server_listing.slug", newSlug);
	await serverDocument.save();

	res.json({
		success: true,
		slug: newSlug,
		url: `/server/${serverId}/${newSlug}`,
	});
};

/**
 * Server Profile Editor Page (Dashboard)
 * GET /dashboard/:svrid/server-profile
 * Free servers see a preview with upsell, Tier 1+ can edit
 */
controllers.profileEditor = async (req, { res }) => {
	if (!req.isAuthenticated()) {
		return res.redirect("/login");
	}

	const serverId = req.params.svrid;
	const serverDocument = await CacheManager.getServer(serverId);

	if (!serverDocument) {
		return renderError(res, "Server not found", undefined, 404);
	}

	const svr = new GetGuild(req.app.client, serverId);
	await svr.initialize(req.user.id);

	if (!svr.success) {
		return renderError(res, "Server not found", undefined, 404);
	}

	const member = svr.members[req.user.id];
	if (req.app.client.getUserBotAdmin(svr, serverDocument, member) < 3) {
		return renderError(res, "Insufficient permissions", undefined, 403);
	}

	// Get tier info - tier object has 'level' property
	const tierInfo = await TierManager.getServerTier(serverId);
	const tierLevel = tierInfo?.level || 0;
	const hasTier1 = tierLevel >= 1;
	const hasTier2 = tierLevel >= 2;

	const webp = req.accepts("image/webp") === "image/webp";
	const publicData = serverDocument.config?.public_data || {};
	const serverProfile = publicData.server_profile || {};
	const serverListing = publicData.server_listing || {};

	console.log("[PROFILE EDITOR] Loading profile for:", serverId);
	console.log("[PROFILE EDITOR] serverProfile:", JSON.stringify(serverProfile));

	// Get text channels for Discord widget selection (Tier 1+ only)
	let textChannels = [];
	if (hasTier1) {
		textChannels = Object.entries(svr.channels || {})
			.filter(([, ch]) => ch.type === 0) // Text channels only
			.map(([id, ch]) => ({ id, name: ch.name }))
			.sort((a, b) => a.name.localeCompare(b.name));
	}

	// Set serverData for admin-menu partial (expects serverData.id directly)
	res.setServerData({
		id: svr.id,
		name: svr.name,
		icon: req.app.client.getAvatarURL(svr.id, svr.icon, "icons", webp),
	});

	// Set sudo for admin-sudo partial (required by admin-menu)
	res.template.sudo = req.isSudo || false;

	res.setPageData({
		page: "admin-server-profile.ejs",
		pageTitle: "Server Profile",
		slug: serverListing.slug,
		tierInfo: {
			tier: tierLevel,
			hasTier1,
			hasTier2,
		},
		profile: {
			isEnabled: serverProfile.isEnabled || false,
			bannerUrl: serverProfile.banner_url || "",
			tagline: serverProfile.tagline || "",
			about: serverProfile.about || "",
			rules: serverProfile.rules || "",
			themeColor: serverProfile.theme_color || "#14b8a6",
			socialLinks: serverProfile.social_links || [],
			featuredChannels: serverProfile.featured_channels || [],
			showSections: serverProfile.show_sections || {
				stats: true,
				leaderboard: true,
				rules: false,
				social: true,
				channels: false,
			},
			discordWidget: serverProfile.discord_widget || {
				isEnabled: false,
				channel_id: "",
			},
		},
		textChannels,
		socialPlatforms: Object.keys(SOCIAL_ICONS),
	});

	res.render();
};

/**
 * Update Server Profile
 * POST /api/server/:serverId/profile
 */
controllers.updateProfile = async (req, res) => {
	console.log("[PROFILE UPDATE] Received request for server:", req.params.serverId);
	console.log("[PROFILE UPDATE] Request body:", JSON.stringify(req.body, null, 2));

	if (!req.isAuthenticated()) {
		console.log("[PROFILE UPDATE] Not authenticated");
		return res.status(401).json({ error: "Unauthorized" });
	}
	console.log("[PROFILE UPDATE] User authenticated:", req.user.id);

	const serverId = req.params.serverId;
	const serverDocument = await CacheManager.getServer(serverId);

	if (!serverDocument) {
		console.log("[PROFILE UPDATE] Server not found:", serverId);
		return res.status(404).json({ error: "Server not found" });
	}
	console.log("[PROFILE UPDATE] Server document found");

	const svr = new GetGuild(req.app.client, serverId);
	await svr.initialize(req.user.id);

	if (!svr.success) {
		return res.status(404).json({ error: "Server not found" });
	}

	const member = svr.members[req.user.id];
	if (req.app.client.getUserBotAdmin(svr, serverDocument, member) < 3) {
		return res.status(403).json({ error: "Insufficient permissions" });
	}

	// Check tier - tier object has 'level' property
	const tierInfo = await TierManager.getServerTier(serverId);
	console.log("[PROFILE UPDATE] Tier info:", JSON.stringify(tierInfo));
	const tierLevel = tierInfo?.level || 0;
	console.log("[PROFILE UPDATE] Tier level:", tierLevel);
	if (tierLevel < 1) {
		console.log("[PROFILE UPDATE] Tier too low, rejecting");
		return res.status(403).json({ error: "Server Profiles require Tier 1 or higher" });
	}

	const {
		isEnabled,
		bannerUrl,
		tagline,
		about,
		rules,
		themeColor,
		socialLinks,
		featuredChannels,
		showSections,
		discordWidget,
	} = req.body;

	// Ensure nested structure exists before setting values
	if (!serverDocument.config) serverDocument.config = {};
	if (!serverDocument.config.public_data) serverDocument.config.public_data = {};
	if (!serverDocument.config.public_data.server_profile) serverDocument.config.public_data.server_profile = {};

	const profile = serverDocument.config.public_data.server_profile;

	// Update profile fields directly on the document
	profile.isEnabled = !!isEnabled;

	if (bannerUrl !== undefined) {
		profile.banner_url = String(bannerUrl).substring(0, 500);
	}
	if (tagline !== undefined) {
		profile.tagline = String(tagline).substring(0, 150);
	}
	if (about !== undefined) {
		profile.about = String(about).substring(0, 5000);
	}
	if (rules !== undefined) {
		profile.rules = String(rules).substring(0, 2000);
	}
	if (themeColor !== undefined && /^#[0-9A-Fa-f]{6}$/.test(themeColor)) {
		profile.theme_color = themeColor;
	}

	// Update social links
	if (Array.isArray(socialLinks)) {
		profile.social_links = socialLinks
			.filter(l => l.platform && l.url)
			.map(l => ({
				platform: String(l.platform),
				url: String(l.url).substring(0, 300),
			}))
			.slice(0, 8);
	}

	// Update featured channels
	if (Array.isArray(featuredChannels)) {
		profile.featured_channels = featuredChannels.slice(0, 5);
	}

	// Update show sections
	if (showSections && typeof showSections === "object") {
		profile.show_sections = {
			stats: !!showSections.stats,
			leaderboard: !!showSections.leaderboard,
			rules: !!showSections.rules,
			social: !!showSections.social,
			channels: tierLevel >= 2 ? !!showSections.channels : false,
		};
	}

	// Update Discord widget (Tier 2 only)
	if (tierLevel >= 2 && discordWidget && typeof discordWidget === "object") {
		profile.discord_widget = {
			isEnabled: !!discordWidget.isEnabled,
			channel_id: discordWidget.channel_id || "",
		};
	}

	// Mark the document as modified so save() knows to update it
	serverDocument._new = false;
	serverDocument._atomics = serverDocument._atomics || {};
	serverDocument._atomics.$set = serverDocument._atomics.$set || {};
	serverDocument._atomics.$set["config.public_data.server_profile"] = profile;

	try {
		console.log("[PROFILE UPDATE] Saving document...");
		console.log("[PROFILE UPDATE] Atomics:", JSON.stringify(serverDocument._atomics));
		const result = await serverDocument.save();
		console.log("[PROFILE UPDATE] Save result:", JSON.stringify(result));
		res.json({ success: true, message: "Profile updated successfully" });
	} catch (err) {
		console.log("[PROFILE UPDATE] Save failed:", err.message);
		logger.warn("Failed to update server profile", { serverId }, err);
		res.status(500).json({ error: "Failed to save profile" });
	}
};
