const path = require("path");
const showdown = require("showdown");
const ObjectId = require("../../Database/ObjectID");
// Feedback model is available via global.Feedback (initialized in Driver.js)
const md = new showdown.Converter({
	tables: true,
	simplifiedAutoLink: true,
	strikethrough: true,
	tasklists: true,
	smoothLivePreview: true,
	smartIndentationFix: true,
	extensions: [require("showdown-xss-filter")],
});
md.setFlavor("github");
const { Tail } = require("tail");

const { getRoundedUptime, saveMaintainerConsoleOptions: save, getChannelData, canDo, renderError } = require("../helpers");
const { GetGuild } = require("../../Modules").getGuild;
const Constants = require("../../Internals/Constants");
const PremiumExtensionsManager = require("../../Modules/PremiumExtensionsManager");

/**
 * Safely get site settings for READ operations (GET requests).
 * Returns existing document or null - NEVER creates/saves a new document.
 * Callers should use configJS defaults when null is returned.
 */
const getSiteSettingsForRead = async () => SiteSettings.findOne("main");

/**
 * Safely get or create site settings for WRITE operations (POST requests).
 * Returns existing document or creates a new one (but doesn't save it - caller must save after setting data).
 */
const getSiteSettingsForWrite = async () => {
	let siteSettings = await SiteSettings.findOne("main");
	if (!siteSettings) {
		siteSettings = SiteSettings.new({ _id: "main" });
	}
	return siteSettings;
};

const controllers = module.exports;

controllers.maintainer = async (req, { res }) => {
	const result = await Servers.aggregate([{
		$group: {
			_id: null,
			total: {
				$sum: {
					$add: ["$messages_today"],
				},
			},
		},
	}]);
	let messageCount = 0;
	if (result && result.length > 0 && result[0] && result[0].total) {
		messageCount = result[0].total;
	}

	const trafficData = await req.app.client.traffic.data();
	const version = await req.app.client.central.API("versions").branch(configJSON.branch).get(configJSON.version)
		.catch(() => null);
	let checkData = version && await version.check();
	if (!checkData) checkData = { utd: false, current: null };

	res.setPageData({
		serverCount: await req.app.client.guilds.totalCount,
		userCount: await req.app.client.users.totalCount,
		totalMessageCount: messageCount,
		roundedUptime: getRoundedUptime(process.uptime()),
		trafficData,
		currentShard: req.app.client.shardID,
		page: "maintainer.ejs",
	});

	res.setConfigData({
		shardCount: configJS.shardTotal,
		version: configJSON.version,
		utd: checkData.utd,
		currentVersion: checkData.current && checkData.current.tag,
		disabled: !checkData.current,
	});
	res.render();
};

controllers.servers = {};

controllers.servers.list = async (req, { res }) => {
	const renderPage = data => {
		res.setPageData({
			activeSearchQuery: req.query.q,
			selectedServer: req.query.i || "0",
			page: "maintainer-server-list.ejs",
		});
		if (data) res.setConfigData(data);
		res.render();
	};

	if (req.query.q) {
		const query = req.query.q.toLowerCase();
		let data = await GetGuild.getAll(req.app.client, { parse: "noKeys", findFilter: query, fullResolveMaps: ["channels"] });
		if (data) {
			data = data.map(svr => ({
				name: svr.name,
				id: svr.id,
				icon: req.app.client.getAvatarURL(svr.id, svr.icon, "icons"),
				channelData: getChannelData(svr),
			}));
		}
		if (data.length < parseInt(req.query.i) + 1) req.query.i = 0;

		if (req.query.leave !== undefined) {
			req.app.client.IPC.send("leaveGuild", data[parseInt(req.query.i)].id);
			renderPage();
		} else if (req.query.block !== undefined) {
			req.app.client.IPC.send("leaveGuild", data[parseInt(req.query.i)].id);
			configJSON.guildBlocklist.push(data[parseInt(req.query.i)].id);
			save(req, res, true, true);
			renderPage();
		} else if (req.query.message) {
			req.app.client.IPC.send("sendMessage", { guild: data[parseInt(req.query.i)].id, channel: req.query.chid, message: req.query.message });
			res.sendStatus(200);
		} else {
			renderPage(data);
		}
	} else {
		renderPage();
	}
};

controllers.servers.list.post = async (req, res) => {
	if (req.body.removeFromActivity && !configJSON.activityBlocklist.includes(req.body.removeFromActivity)) {
		configJSON.activityBlocklist.push(req.body.removeFromActivity);
	}
	if (req.body.unbanFromActivity) {
		const index = configJSON.activityBlocklist.indexOf(req.body.unbanFromActivity);
		if (index > -1) configJSON.activityBlocklist.splice(index, 1);
	}
	save(req, res, true);
};

controllers.servers.bigmessage = async (req, { res }) => {
	res.setPageData({
		serverCount: await req.app.client.guilds.totalCount,
		page: "maintainer-big-message.ejs",
	}).render();
};
controllers.servers.bigmessage.post = async (req, res) => {
	if (req.body.message) {
		req.app.client.IPC.send("sendMessage", { guild: "*", message: req.body.message });
		res.sendStatus(200);
	} else {
		res.sendStatus(400);
	}
};

/**
 * Global scan - scan all servers for members and create user documents
 * POST /dashboard/maintainer/global-scan
 */
controllers.globalScan = async (req, res) => {
	try {
		const guilds = req.app.client.guilds.cache;
		console.log(`[GLOBAL SCAN] Starting global scan for ${guilds.size} servers`);

		let totalCreated = 0;
		let totalUpdated = 0;
		let totalSkipped = 0;
		let totalMembers = 0;
		let serversScanned = 0;
		const errors = [];

		for (const [, guild] of guilds) {
			try {
				const members = await guild.members.fetch();
				totalMembers += members.size;

				for (const [memberId, member] of members) {
					if (member.user.bot) {
						totalSkipped++;
						continue;
					}

					let userDocument = await Users.findOne(memberId);
					if (!userDocument) {
						userDocument = Users.new({ _id: memberId });
						userDocument.username = member.user.username;
						await userDocument.save();
						totalCreated++;
					} else if (!userDocument.username || userDocument.username !== member.user.username) {
						userDocument.query.set("username", member.user.username);
						await userDocument.save();
						totalUpdated++;
					} else {
						totalSkipped++;
					}
				}
				serversScanned++;
			} catch (err) {
				console.error(`[GLOBAL SCAN] Error scanning ${guild.name}:`, err.message);
				errors.push({ server: guild.name, error: err.message });
			}
		}

		console.log(`[GLOBAL SCAN] Complete: servers=${serversScanned}, created=${totalCreated}, updated=${totalUpdated}, skipped=${totalSkipped}`);

		res.json({
			success: true,
			serversScanned,
			totalServers: guilds.size,
			totalMembers,
			created: totalCreated,
			updated: totalUpdated,
			skipped: totalSkipped,
			errors: errors.length > 0 ? errors : undefined,
		});
	} catch (err) {
		console.error("[GLOBAL SCAN ERROR]", err);
		res.status(500).json({ error: err.message });
	}
};

controllers.options = {};

controllers.options.premiumExtensionsSales = async (req, { res }) => {
	if (req.level !== 2 && req.level !== 0) return res.redirect("/dashboard/maintainer");

	let premiumDocs = [];
	try {
		premiumDocs = await Gallery.find({ "premium.is_premium": true }).sort({ name: 1 }).exec();
	} catch (err) {
		premiumDocs = [];
	}

	const premiumExtensionsList = (premiumDocs || []).map(doc => ({
		id: doc._id?.toString ? doc._id.toString() : `${doc._id}`,
		name: doc.name,
	}));

	const selectedExtId = typeof req.query.extid === "string" ? req.query.extid : "";
	const limit = req.query?.limit ? parseInt(req.query.limit, 10) : 100;
	const wantsJson = req.query?.json === "1" || req.query?.json === "true" || (typeof req.headers?.accept === "string" && req.headers.accept.includes("application/json"));

	let salesData = null;
	if (selectedExtId) {
		try {
			salesData = await PremiumExtensionsManager.getExtensionSalesAdmin(selectedExtId, limit);
		} catch (err) {
			salesData = null;
		}
	}

	if (wantsJson && salesData) return res.json(salesData);
	if (wantsJson && selectedExtId && !salesData) return res.status(404).json({ error: "Extension not found" });

	res.setConfigData({
		premium_extensions_list: premiumExtensionsList,
		salesData,
	}).setPageData({
		selectedExtId,
		limit: typeof limit === "number" && !Number.isNaN(limit) ? limit : 100,
		page: "maintainer-premium-extensions-sales.ejs",
	}).render();
};

controllers.options.premiumExtensions = async (req, { res }) => {
	if (req.level !== 2 && req.level !== 0) return res.redirect("/dashboard/maintainer");

	const siteSettings = await getSiteSettingsForRead();
	const premiumSettings = siteSettings?.premium_extensions || {};
	const fetchOwnerName = async ownerId => {
		let ownerName = "invalid-user";
		try {
			const usr = await req.app.client.users.fetch(ownerId, true);
			if (usr && usr.username) ownerName = usr.username;
		} catch (_) {
			ownerName = "invalid-user";
		}
		return ownerName;
	};

	let stats = {
		totalPurchases: 0,
		totalCreatorRevenue: 0,
		topExtensionsByPurchases: [],
		topExtensionsByRevenue: [],
		topCreatorsByRevenue: [],
	};
	try {
		stats = await PremiumExtensionsManager.getMarketplaceStats();
	} catch (err) {
		stats = {
			totalPurchases: 0,
			totalCreatorRevenue: 0,
			topExtensionsByPurchases: [],
			topExtensionsByRevenue: [],
			topCreatorsByRevenue: [],
		};
	}

	const topExtensionsByPurchases = Array.isArray(stats.topExtensionsByPurchases) ? stats.topExtensionsByPurchases : [];
	const topExtensionsByRevenue = Array.isArray(stats.topExtensionsByRevenue) ? stats.topExtensionsByRevenue : [];
	const topCreatorsByRevenue = Array.isArray(stats.topCreatorsByRevenue) ? stats.topCreatorsByRevenue : [];
	stats.topExtensionsByPurchases = await Promise.all(topExtensionsByPurchases.map(async ext => ({
		...ext,
		owner_name: await fetchOwnerName(ext.owner_id),
	})));
	stats.topExtensionsByRevenue = await Promise.all(topExtensionsByRevenue.map(async ext => ({
		...ext,
		owner_name: await fetchOwnerName(ext.owner_id),
	})));
	stats.topCreatorsByRevenue = await Promise.all(topCreatorsByRevenue.map(async creator => ({
		...creator,
		owner_name: await fetchOwnerName(creator.owner_id),
	})));

	let premiumDocs = [];
	try {
		premiumDocs = await Gallery.find({ "premium.is_premium": true }).exec();
	} catch (err) {
		premiumDocs = [];
	}
	const pendingDocs = (premiumDocs || []).filter(doc => !(doc && doc.premium && doc.premium.approved === true));

	const pending = await Promise.all(pendingDocs.map(async doc => {
		const ownerName = await fetchOwnerName(doc.owner_id);
		return {
			id: doc._id.toString(),
			name: doc.name,
			owner_id: doc.owner_id,
			owner_name: ownerName,
			price_points: doc.premium?.price_points || 0,
			purchases: doc.premium?.purchases || 0,
			developer_earnings: doc.premium?.developer_earnings || 0,
			lifetime_revenue: doc.premium?.lifetime_revenue || 0,
		};
	}));

	res.setConfigData({
		premium_extensions: {
			isEnabled: premiumSettings.isEnabled === true,
			default_revenue_share: typeof premiumSettings.default_revenue_share === "number" ? premiumSettings.default_revenue_share : 70,
			min_price_points: typeof premiumSettings.min_price_points === "number" ? premiumSettings.min_price_points : 100,
			max_price_points: typeof premiumSettings.max_price_points === "number" ? premiumSettings.max_price_points : 100000,
			approval_required: premiumSettings.approval_required !== false,
		},
		premium_pending: pending,
		premium_stats: stats,
	}).setPageData({
		page: "maintainer-premium-extensions.ejs",
	}).render();
};

controllers.options.premiumExtensions.post = async (req, res) => {
	if (req.level !== 2 && req.level !== 0) return res.sendStatus(403);

	const siteSettings = await getSiteSettingsForWrite();

	if (req.body && req.body.pe_action && req.body.pe_extid) {
		let extId;
		try {
			extId = new ObjectId(req.body.pe_extid);
		} catch (err) {
			return res.redirect(req.originalUrl);
		}
		const galleryDoc = await Gallery.findOne(extId);
		if (!galleryDoc) return res.redirect(req.originalUrl);

		if (req.body.pe_action === "approve") {
			const premiumSettings2 = siteSettings?.premium_extensions || {};
			const minPrice = typeof premiumSettings2.min_price_points === "number" ? premiumSettings2.min_price_points : 100;
			const maxPrice = typeof premiumSettings2.max_price_points === "number" ? premiumSettings2.max_price_points : 100000;
			const pricePoints = galleryDoc.premium?.price_points || 0;
			if (pricePoints <= 0) {
				renderError(res, "Extension price must be greater than 0 before approval.");
				return;
			}
			if (typeof minPrice === "number" && pricePoints < minPrice) {
				renderError(res, `Extension price is below the minimum (${minPrice} points).`);
				return;
			}
			if (typeof maxPrice === "number" && pricePoints > maxPrice) {
				renderError(res, `Extension price is above the maximum (${maxPrice} points).`);
				return;
			}
			galleryDoc.query.set("premium.is_premium", true);
			galleryDoc.query.set("premium.approved", true);
			await galleryDoc.save().catch(() => null);
			return res.redirect(req.originalUrl);
		}
		if (req.body.pe_action === "reject") {
			galleryDoc.query.set("premium.is_premium", true);
			galleryDoc.query.set("premium.approved", false);
			await galleryDoc.save().catch(() => null);
			return res.redirect(req.originalUrl);
		}
		if (req.body.pe_action === "adjust") {
			const pricePoints = parseInt(req.body.pe_price_points, 10) || 0;
			const premiumSettings2 = siteSettings?.premium_extensions || {};
			const minPrice = typeof premiumSettings2.min_price_points === "number" ? premiumSettings2.min_price_points : 100;
			const maxPrice = typeof premiumSettings2.max_price_points === "number" ? premiumSettings2.max_price_points : 100000;
			if (pricePoints <= 0) {
				renderError(res, "Price must be greater than 0.");
				return;
			}
			if (typeof minPrice === "number" && pricePoints < minPrice) {
				renderError(res, `Minimum price is ${minPrice} points.`);
				return;
			}
			if (typeof maxPrice === "number" && pricePoints > maxPrice) {
				renderError(res, `Maximum price is ${maxPrice} points.`);
				return;
			}
			galleryDoc.query.set("premium.is_premium", true);
			galleryDoc.query.set("premium.price_points", pricePoints);
			galleryDoc.query.set("premium.approved", true);
			await galleryDoc.save().catch(() => null);
			return res.redirect(req.originalUrl);
		}
		return res.redirect(req.originalUrl);
	}

	siteSettings.query.set("premium_extensions.isEnabled", req.body.premium_enabled === "on");
	siteSettings.query.set("premium_extensions.default_revenue_share", parseInt(req.body.default_revenue_share, 10) || 70);
	siteSettings.query.set("premium_extensions.min_price_points", parseInt(req.body.min_price_points, 10) || 100);
	siteSettings.query.set("premium_extensions.max_price_points", parseInt(req.body.max_price_points, 10) || 100000);
	siteSettings.query.set("premium_extensions.approval_required", req.body.approval_required === "on");

	try {
		await siteSettings.save();
		res.redirect(req.originalUrl);
	} catch (err) {
		logger.error("Failed to save premium extensions settings", {}, err);
		renderError(res, "Failed to save premium extensions settings.");
	}
};

controllers.options.blocklist = async (req, { res }) => {
	res.setConfigData({
		global_blocklist: await Promise.all(configJSON.userBlocklist.map(async a => {
			const usr = await req.app.client.users.fetch(a, true) || {};
			return {
				name: usr.username,
				id: usr.id,
				avatar: req.app.client.getAvatarURL(usr.id, usr.avatar) || "/static/img/discord-icon.png",
			};
		})),
	}).setPageData("page", "maintainer-blocklist.ejs").render();
};
controllers.options.blocklist.post = async (req, res) => {
	if (req.body["new-user"]) {
		let usr = await Users.findOne({ username: req.body["new-user"] });
		if (!usr) usr = await req.app.client.users.fetch(req.body["new-user"], true);

		if (usr && !configJSON.userBlocklist.includes(usr.id ? usr.id : usr._id) && !configJSON.maintainers.includes(usr.id ? usr.id : usr._id)) {
			configJSON.userBlocklist.push(usr.id ? usr.id : usr._id);
		}
	} else {
		configJSON.userBlocklist.forEach(usrid => {
			if (req.body[`block-${usrid}-removed`] !== undefined) {
				configJSON.userBlocklist.splice(configJSON.userBlocklist.indexOf(usrid), 1);
			}
		});
	}

	save(req, res);
};

controllers.options.bot = async (req, { res }) => {
	res.setConfigData({
		status: configJSON.status,
		type: configJSON.activity.type,
		game: configJSON.activity.name,
		game_default: configJSON.activity.name === "default",
		twitchURL: configJSON.activity.twitchURL,
		avatar: req.app.client.user.avatarURL({ type: "png", size: 512 }),
	}).setPageData("page", "maintainer-bot-user.ejs").render();
};
controllers.options.bot.post = async (req, res) => {
	req.app.client.IPC.send("updateBotUser", {
		avatar: req.body.avatar,
		username: req.body.username,
		game: req.body.game,
		status: req.body.status,
		type: req.body.type,
		twitchURL: req.body.twitch,
	});
	configJSON.activity.name = req.body.game;
	configJSON.activity.type = req.body.type;
	configJSON.activity.twitchURL = req.body.twitch;
	if (req.body.game === "skynetbot.com") {
		configJSON.activity.name = "default";
	}
	if (req.body.status) configJSON.status = req.body.status;
	save(req, res, true);
};

controllers.options.homepage = async (req, { res }) => {
	res.setConfigData({
		headerImage: configJSON.headerImage,
		homepageMessageHTML: configJSON.homepageMessageHTML,
	}).setPageData({
		dirname: path.join(__dirname, "../public/img/"),
		page: "maintainer-homepage.ejs",
	}).render();
};
controllers.options.homepage.post = async (req, res) => {
	configJSON.homepageMessageHTML = req.body.homepageMessageHTML;
	configJSON.headerImage = req.body.header_image;

	save(req, res, true);
};

controllers.options.contributors = async (req, { res }) => {
	res.setConfigData({
		wiki_contributors: await Promise.all(configJSON.maintainers.map(async a => {
			const usr = await req.app.client.users.fetch(a, true) || {
				id: "invalid-user",
				username: "invalid-user",
			};
			return {
				name: usr.username,
				id: usr.id,
				avatar: usr.avatarURL ? usr.displayAvatarURL() || "/static/img/discord-icon.png" : "/static/img/discord-icon.png",
				isMaintainer: true,
				isSudoMaintainer: configJSON.sudoMaintainers.includes(usr.id),
			};
		}).concat(configJSON.wikiContributors.map(async a => {
			const usr = await req.app.client.users.fetch(a, true) || {
				id: "invalid-user",
				username: "invalid-user",
			};
			return {
				name: usr.username,
				id: usr.id,
				avatar: usr.avatarURL ? usr.displayAvatarURL() || "/static/img/discord-icon.png" : "/static/img/discord-icon.png",
			};
		}))),
	}).setPageData({
		showRemove: configJSON.maintainers.includes(req.user.id),
		page: "maintainer-wiki-contributors.ejs",
	}).render();
};
controllers.options.contributors.post = async (req, res) => {
	if (req.body["new-user"]) {
		let usr = await Users.findOne({ username: req.body["new-user"] });
		if (!usr) usr = await req.app.client.users.fetch(req.body["new-user"], true);
		if (!usr.id) usr.id = usr._id;
		if (usr && !configJSON.wikiContributors.includes(usr.id)) {
			configJSON.wikiContributors.push(usr.id);
		}
	} else {
		const i = configJSON.wikiContributors.indexOf(req.body["contributor-removed"]);
		configJSON.wikiContributors.splice(i, 1);
	}

	save(req, res);
};

controllers.options.donations = async (req, { res }) => {
	if (req.level !== 2 && req.level !== 0) return res.redirect("/dashboard/maintainer");

	// READ operation - never create/save, use defaults if not found
	const siteSettings = await getSiteSettingsForRead();

	res.setConfigData({
		donateSubtitle: siteSettings?.donateSubtitle || configJS.donateSubtitle || "",
		charities: siteSettings?.charities || [],
	}).setPageData({
		page: "maintainer-donations.ejs",
	}).render();
};
controllers.options.donations.post = async (req, res) => {
	if (req.level !== 2 && req.level !== 0) return res.sendStatus(403);

	// WRITE operation - create if needed (will be saved below with actual data)
	const siteSettings = await getSiteSettingsForWrite();

	siteSettings.query.set("donateSubtitle", req.body.donateSubtitle || "");

	const names = req.body.name ? Array.isArray(req.body.name) ? req.body.name : [req.body.name] : [];
	const countries = req.body.country ? Array.isArray(req.body.country) ? req.body.country : [req.body.country] : [];
	const donateUrls = req.body.donate_url ? Array.isArray(req.body.donate_url) ? req.body.donate_url : [req.body.donate_url] : [];
	const iconUrls = req.body.icon_url ? Array.isArray(req.body.icon_url) ? req.body.icon_url : [req.body.icon_url] : [];

	const charities = [];
	for (let i = 0; i < names.length; i++) {
		if (names[i] && donateUrls[i] && iconUrls[i]) {
			charities.push({
				name: names[i],
				country: countries[i] || "",
				donate_url: donateUrls[i],
				icon_url: iconUrls[i],
			});
		}
	}
	siteSettings.query.set("charities", charities);

	try {
		await siteSettings.save();
		res.redirect(req.originalUrl);
	} catch (err) {
		logger.error("Failed to save donation settings", {}, err);
		renderError(res, "Failed to save donation settings.");
	}
};

controllers.options.voteSites = async (req, { res }) => {
	// READ operation - never create/save, use defaults if not found
	if (req.level !== 2 && req.level !== 0) return res.redirect("/dashboard/maintainer");

	const siteSettings = await getSiteSettingsForRead();

	const voteSites = (siteSettings?.vote_sites?.length ? siteSettings.vote_sites : configJS.voteSites || [])
		.map(site => ({
			name: site.name,
			url: site.url,
			icon_url: site.icon_url || "",
		}));

	res.setConfigData({
		voteSites,
	}).setPageData({
		page: "maintainer-vote-sites.ejs",
	}).render();
};

controllers.options.voteSites.post = async (req, res) => {
	if (req.level !== 2 && req.level !== 0) return res.sendStatus(403);

	// WRITE operation - create if needed (will be saved below with actual data)
	const siteSettings = await getSiteSettingsForWrite();

	const names = req.body.name ? Array.isArray(req.body.name) ? req.body.name : [req.body.name] : [];
	const urls = req.body.url ? Array.isArray(req.body.url) ? req.body.url : [req.body.url] : [];
	const iconUrls = req.body.icon_url ? Array.isArray(req.body.icon_url) ? req.body.icon_url : [req.body.icon_url] : [];

	const voteSites = [];
	for (let i = 0; i < names.length; i++) {
		if (names[i] && urls[i]) {
			voteSites.push({
				name: names[i],
				url: urls[i],
				icon_url: iconUrls[i] || "",
			});
		}
	}

	siteSettings.query.set("vote_sites", voteSites);

	try {
		await siteSettings.save();
		res.redirect(req.originalUrl);
	} catch (err) {
		logger.error("Failed to save vote site settings", {}, err);
		renderError(res, "Failed to save vote site settings.");
	}
};

// Bot List Integrations (API tokens, webhooks, stats posting)
controllers.options.botLists = async (req, { res }) => {
	if (req.level !== 2 && req.level !== 0) return res.redirect("/dashboard/maintainer");

	// READ operation - never create/save, use defaults if not found
	const siteSettings = await getSiteSettingsForRead();

	// Get recent votes from BotLists module
	const botLists = req.app.get("botLists");
	const recentVotes = botLists ? await botLists.getRecentVotes(20) : [];
	const voteStats = botLists ? await botLists.getVoteStats() : { topgg: 0, discordbotlist: 0, total: 0 };

	res.setConfigData({
		bot_lists: siteSettings?.bot_lists || {},
		vote_rewards: siteSettings?.vote_rewards || {},
		tiers: siteSettings?.tiers || [],
		recentVotes,
		voteStats,
		hostingURL: configJS.hostingURL,
	}).setPageData({
		page: "maintainer-bot-lists.ejs",
	}).render();
};

controllers.options.botLists.post = async (req, res) => {
	if (req.level !== 2 && req.level !== 0) return res.sendStatus(403);

	// WRITE operation - create if needed (will be saved below with actual data)
	const siteSettings = await getSiteSettingsForWrite();

	// Ensure nested objects exist for bot_lists
	if (!siteSettings.bot_lists) siteSettings.bot_lists = {};
	if (!siteSettings.bot_lists.topgg) siteSettings.bot_lists.topgg = {};
	if (!siteSettings.bot_lists.discordbotlist) siteSettings.bot_lists.discordbotlist = {};

	// Update top.gg settings
	siteSettings.query.set("bot_lists.topgg.isEnabled", req.body.topgg_enabled === "on");
	siteSettings.query.set("bot_lists.topgg.api_token", req.body.topgg_api_token || "");
	siteSettings.query.set("bot_lists.topgg.webhook_secret", req.body.topgg_webhook_secret || "");
	siteSettings.query.set("bot_lists.topgg.auto_post_stats", req.body.topgg_auto_post !== "off");

	// Update discordbotlist settings
	siteSettings.query.set("bot_lists.discordbotlist.isEnabled", req.body.dbl_enabled === "on");
	siteSettings.query.set("bot_lists.discordbotlist.api_token", req.body.dbl_api_token || "");
	siteSettings.query.set("bot_lists.discordbotlist.webhook_secret", req.body.dbl_webhook_secret || "");
	siteSettings.query.set("bot_lists.discordbotlist.auto_post_stats", req.body.dbl_auto_post !== "off");
	siteSettings.query.set("bot_lists.discordbotlist.sync_commands", Boolean(req.body.dbl_sync_commands === "on"));

	// Update vote rewards settings
	siteSettings.query.set("vote_rewards.isEnabled", req.body.rewards_enabled === "on");
	siteSettings.query.set("vote_rewards.points_per_vote", parseInt(req.body.points_per_vote) || 100);
	siteSettings.query.set("vote_rewards.weekend_multiplier", parseInt(req.body.weekend_multiplier) || 2);
	siteSettings.query.set("vote_rewards.notification_channel_id", req.body.notification_channel_id || "");

	// Update redemption settings
	siteSettings.query.set("vote_rewards.redemption.isEnabled", req.body.redemption_enabled === "on");
	siteSettings.query.set("vote_rewards.redemption.points_per_dollar", parseInt(req.body.points_per_dollar) || 1000);
	siteSettings.query.set("vote_rewards.redemption.redeemable_tier_id", req.body.redeemable_tier_id || "");
	siteSettings.query.set("vote_rewards.redemption.min_redemption_days", parseInt(req.body.min_redemption_days) || 7);
	siteSettings.query.set("vote_rewards.redemption.max_redemption_days", parseInt(req.body.max_redemption_days) || 365);

	try {
		await siteSettings.save();
		res.redirect(req.originalUrl);
	} catch (err) {
		logger.error("Failed to save bot list settings", {}, err);
		renderError(res, "Failed to save bot list settings.");
	}
};

controllers.options.botLists.syncCommands = async (req, res) => {
	if (req.level !== 2 && req.level !== 0) return res.status(403).json({ error: "Forbidden" });

	try {
		const botLists = req.app.get("botLists");
		if (!botLists) {
			return res.status(500).json({ error: "BotLists module not initialized" });
		}

		const result = await botLists.postCommandsToDiscordBotList();
		if (result.success) {
			res.json({ success: true, count: result.count, message: `Synced ${result.count} commands to discordbotlist.com` });
		} else {
			res.status(400).json({ success: false, error: result.error });
		}
	} catch (err) {
		logger.error("Failed to sync commands to discordbotlist.com", {}, err);
		res.status(500).json({ error: "Failed to sync commands" });
	}
};

// ============================================
// MEMBERSHIP SYSTEM CONTROLLERS
// ============================================

controllers.membership = {};

// Feature Registry
controllers.membership.features = async (req, { res }) => {
	if (req.level !== 2 && req.level !== 0) return res.redirect("/dashboard/maintainer");

	// READ operation - never create/save, use defaults if not found
	const siteSettings = await getSiteSettingsForRead();

	res.setConfigData({
		features: siteSettings?.features || [],
	}).setPageData({
		page: "maintainer-features.ejs",
	}).render();
};

controllers.membership.features.post = async (req, res) => {
	if (req.level !== 2 && req.level !== 0) return res.sendStatus(403);

	// WRITE operation - create if needed (will be saved below with actual data)
	const siteSettings = await getSiteSettingsForWrite();

	// Helper to ensure array
	const toArray = val => val ? Array.isArray(val) ? val : [val] : [];

	// Process predefined features from toggles
	const ids = toArray(req.body.feature_id);
	const names = toArray(req.body.feature_name);
	const descriptions = toArray(req.body.feature_description);
	const categories = toArray(req.body.feature_category);
	const enabledList = toArray(req.body.feature_enabled);

	const features = [];
	for (let i = 0; i < ids.length; i++) {
		if (ids[i] && names[i]) {
			features.push({
				_id: ids[i].toLowerCase().replace(/[^a-z0-9_]/g, "_"),
				name: names[i],
				description: descriptions[i] || "",
				category: categories[i] || "general",
				isEnabled: enabledList.includes(ids[i]),
			});
		}
	}

	// Process custom features
	const customIds = toArray(req.body.custom_id);
	const customNames = toArray(req.body.custom_name);
	const customDescs = toArray(req.body.custom_desc);
	const customEnabled = toArray(req.body.custom_enabled);

	for (let i = 0; i < customIds.length; i++) {
		if (customIds[i] && customNames[i]) {
			const customId = customIds[i].toLowerCase().replace(/[^a-z0-9_]/g, "_");
			features.push({
				_id: customId,
				name: customNames[i],
				description: customDescs[i] || "",
				category: "general",
				isEnabled: customEnabled.includes(customIds[i]) || customEnabled.includes("new"),
			});
		}
	}

	siteSettings.query.set("features", features);

	try {
		await siteSettings.save();
		const TierManager = require("../../Modules/TierManager");
		TierManager.invalidateCache();
		res.redirect(req.originalUrl);
	} catch (err) {
		logger.error("Failed to save features", {}, err);
		renderError(res, "Failed to save features.");
	}
};

// Tiers Configuration
controllers.membership.tiers = async (req, { res }) => {
	if (req.level !== 2 && req.level !== 0) return res.redirect("/dashboard/maintainer");

	// READ operation - never create/save, use defaults if not found
	const siteSettings = await getSiteSettingsForRead();

	res.setConfigData({
		tiers: siteSettings?.tiers || [],
		features: siteSettings?.features || [],
	}).setPageData({
		page: "maintainer-tiers.ejs",
	}).render();
};

controllers.membership.tiers.post = async (req, res) => {
	if (req.level !== 2 && req.level !== 0) return res.sendStatus(403);

	// WRITE operation - create if needed (will be saved below with actual data)
	const siteSettings = await getSiteSettingsForWrite();

	const ids = req.body.tier_id ? Array.isArray(req.body.tier_id) ? req.body.tier_id : [req.body.tier_id] : [];
	const names = req.body.tier_name ? Array.isArray(req.body.tier_name) ? req.body.tier_name : [req.body.tier_name] : [];
	const levels = req.body.tier_level ? Array.isArray(req.body.tier_level) ? req.body.tier_level : [req.body.tier_level] : [];
	const descriptions = req.body.tier_description ? Array.isArray(req.body.tier_description) ? req.body.tier_description : [req.body.tier_description] : [];
	const colors = req.body.tier_color ? Array.isArray(req.body.tier_color) ? req.body.tier_color : [req.body.tier_color] : [];
	const badges = req.body.tier_badge ? Array.isArray(req.body.tier_badge) ? req.body.tier_badge : [req.body.tier_badge] : [];
	const pricesMonthly = req.body.tier_price_monthly ? Array.isArray(req.body.tier_price_monthly) ? req.body.tier_price_monthly : [req.body.tier_price_monthly] : [];
	const discountsYearly = req.body.tier_yearly_discount ? Array.isArray(req.body.tier_yearly_discount) ? req.body.tier_yearly_discount : [req.body.tier_yearly_discount] : [];
	const featuresList = req.body.tier_features ? Array.isArray(req.body.tier_features) ? req.body.tier_features : [req.body.tier_features] : [];
	const purchasableList = req.body.tier_purchasable ? Array.isArray(req.body.tier_purchasable) ? req.body.tier_purchasable : [req.body.tier_purchasable] : [];
	const defaultTier = req.body.tier_default || "";

	const tiers = [];
	for (let i = 0; i < ids.length; i++) {
		if (ids[i] && names[i]) {
			const tierId = ids[i].toLowerCase().replace(/[^a-z0-9_]/g, "_");
			tiers.push({
				_id: tierId,
				name: names[i],
				level: parseInt(levels[i]) || 0,
				description: descriptions[i] || "",
				color: colors[i] || "#3273dc",
				badge_icon: badges[i] || "",
				price_monthly: parseInt(pricesMonthly[i]) || 0,
				yearly_discount: parseInt(discountsYearly[i]) || 0,
				features: featuresList[i] ? featuresList[i].split(",").filter(f => f) : [],
				is_purchasable: purchasableList.includes(ids[i]) || purchasableList.includes(`new_${i}`),
				is_default: defaultTier === ids[i] || defaultTier === `new_${i}`,
			});
		}
	}
	siteSettings.query.set("tiers", tiers);

	try {
		await siteSettings.save();
		const TierManager = require("../../Modules/TierManager");
		TierManager.invalidateCache();
		res.redirect(req.originalUrl);
	} catch (err) {
		logger.error("Failed to save tiers", {}, err);
		renderError(res, "Failed to save tiers.");
	}
};

// OAuth Providers
controllers.membership.oauth = async (req, { res }) => {
	if (req.level !== 2 && req.level !== 0) return res.redirect("/dashboard/maintainer");

	// READ operation - never create/save, use defaults if not found
	const siteSettings = await getSiteSettingsForRead();

	res.setConfigData({
		oauth_providers: siteSettings?.oauth_providers || {},
		tiers: siteSettings?.tiers || [],
		hostingURL: configJS.hostingURL,
	}).setPageData({
		page: "maintainer-oauth.ejs",
	}).render();
};

controllers.membership.oauth.post = async (req, res) => {
	if (req.level !== 2 && req.level !== 0) return res.sendStatus(403);

	// WRITE operation - create if needed (will be saved below with actual data)
	const siteSettings = await getSiteSettingsForWrite();

	// Update OAuth provider enabled states
	siteSettings.query.set("oauth_providers.google.isEnabled", req.body.google_enabled === "on");
	siteSettings.query.set("oauth_providers.github.isEnabled", req.body.github_enabled === "on");
	siteSettings.query.set("oauth_providers.twitch.isEnabled", req.body.twitch_enabled === "on");
	siteSettings.query.set("oauth_providers.patreon.isEnabled", req.body.patreon_enabled === "on");

	// Patreon tier mapping
	const patreonTierIds = req.body.patreon_tier_id ? Array.isArray(req.body.patreon_tier_id) ? req.body.patreon_tier_id : [req.body.patreon_tier_id] : [];
	const patreonLocalTiers = req.body.patreon_local_tier ? Array.isArray(req.body.patreon_local_tier) ? req.body.patreon_local_tier : [req.body.patreon_local_tier] : [];

	const patreonMapping = [];
	for (let i = 0; i < patreonTierIds.length; i++) {
		if (patreonTierIds[i] && patreonLocalTiers[i]) {
			patreonMapping.push({
				_id: patreonTierIds[i],
				local_tier_id: patreonLocalTiers[i],
			});
		}
	}
	siteSettings.query.set("oauth_providers.patreon.tier_mapping", patreonMapping);

	try {
		await siteSettings.save();
		const TierManager = require("../../Modules/TierManager");
		TierManager.invalidateCache();
		res.redirect(req.originalUrl);
	} catch (err) {
		logger.error("Failed to save OAuth settings", {}, err);
		renderError(res, "Failed to save OAuth settings.");
	}
};

// Payment Providers
controllers.membership.payments = async (req, { res }) => {
	if (req.level !== 2 && req.level !== 0) return res.redirect("/dashboard/maintainer");

	// READ operation - never create/save, use defaults if not found
	const siteSettings = await getSiteSettingsForRead();

	res.setConfigData({
		payment_providers: siteSettings?.payment_providers || {},
		tiers: siteSettings?.tiers || [],
		hostingURL: configJS.hostingURL,
	}).setPageData({
		page: "maintainer-payments.ejs",
	}).render();
};

controllers.membership.payments.post = async (req, res) => {
	if (req.level !== 2 && req.level !== 0) return res.sendStatus(403);

	// WRITE operation - create if needed (will be saved below with actual data)
	const siteSettings = await getSiteSettingsForWrite();

	// Update payment provider enabled states
	siteSettings.query.set("payment_providers.stripe.isEnabled", req.body.stripe_enabled === "on");
	siteSettings.query.set("payment_providers.paypal.isEnabled", req.body.paypal_enabled === "on");
	siteSettings.query.set("payment_providers.btcpay.isEnabled", req.body.btcpay_enabled === "on");

	// Stripe product mapping
	const stripeProductIds = req.body.stripe_product_id ? Array.isArray(req.body.stripe_product_id) ? req.body.stripe_product_id : [req.body.stripe_product_id] : [];
	const stripePriceIds = req.body.stripe_price_id ? Array.isArray(req.body.stripe_price_id) ? req.body.stripe_price_id : [req.body.stripe_price_id] : [];
	const stripeTierIds = req.body.stripe_tier_id ? Array.isArray(req.body.stripe_tier_id) ? req.body.stripe_tier_id : [req.body.stripe_tier_id] : [];

	const stripeMapping = [];
	for (let i = 0; i < stripeProductIds.length; i++) {
		if (stripeProductIds[i] && stripePriceIds[i] && stripeTierIds[i]) {
			stripeMapping.push({
				_id: stripeProductIds[i],
				stripe_price_id: stripePriceIds[i],
				tier_id: stripeTierIds[i],
			});
		}
	}
	siteSettings.query.set("payment_providers.stripe.product_mapping", stripeMapping);

	// PayPal plan mapping
	const paypalPlanIds = req.body.paypal_plan_id ? Array.isArray(req.body.paypal_plan_id) ? req.body.paypal_plan_id : [req.body.paypal_plan_id] : [];
	const paypalTierIds = req.body.paypal_tier_id ? Array.isArray(req.body.paypal_tier_id) ? req.body.paypal_tier_id : [req.body.paypal_tier_id] : [];

	const paypalMapping = [];
	for (let i = 0; i < paypalPlanIds.length; i++) {
		if (paypalPlanIds[i] && paypalTierIds[i]) {
			paypalMapping.push({
				_id: paypalPlanIds[i],
				tier_id: paypalTierIds[i],
			});
		}
	}
	siteSettings.query.set("payment_providers.paypal.plan_mapping", paypalMapping);

	try {
		await siteSettings.save();
		const TierManager = require("../../Modules/TierManager");
		TierManager.invalidateCache();
		res.redirect(req.originalUrl);
	} catch (err) {
		logger.error("Failed to save payment settings", {}, err);
		renderError(res, "Failed to save payment settings.");
	}
};

// Server Management (Premium subscriptions are per-server)
controllers.membership.servers = async (req, { res }) => {
	if (req.level !== 2 && req.level !== 0) return res.redirect("/dashboard/maintainer");

	// READ operation - never create/save, use defaults if not found
	const siteSettings = await getSiteSettingsForRead();

	const searchResults = [];
	const query = req.query.q;

	if (query) {
		// Search by server ID first (exact match)
		const directServer = await Servers.findOne(query);
		if (directServer) {
			const discordGuild = await req.app.client.guilds.fetch(query).catch(() => null);
			searchResults.push({
				...directServer,
				name: discordGuild?.name || "Unknown Server",
				icon: discordGuild?.iconURL() || null,
				memberCount: discordGuild?.memberCount || 0,
			});
		} else {
			// If not found by ID, search through bot's cached guilds by name
			const matchingGuilds = req.app.client.guilds.cache
				.filter(g => g.name.toLowerCase().includes(query.toLowerCase()))
				.first(10);

			for (const guild of matchingGuilds) {
				const serverDoc = await Servers.findOne(guild.id);
				searchResults.push({
					_id: guild.id,
					subscription: serverDoc?.subscription || null,
					name: guild.name,
					icon: guild.iconURL() || null,
					memberCount: guild.memberCount || 0,
				});
			}
		}
	}

	// Get recent subscription changes - query servers that have subscription data
	let recentSubscriptions = [];
	try {
		// For MariaDB, check if subscription JSON field is not null
		recentSubscriptions = await Servers.find({ subscription: { $ne: null } })
			.limit(20)
			.exec() || [];

		// Filter to only those with started_at and sort
		recentSubscriptions = recentSubscriptions
			.filter(s => s.subscription?.started_at)
			.sort((a, b) => new Date(b.subscription.started_at) - new Date(a.subscription.started_at))
			.slice(0, 20);
	} catch {
		// Fallback if query fails
		recentSubscriptions = [];
	}

	for (const sub of recentSubscriptions) {
		const discordGuild = await req.app.client.guilds.fetch(sub._id).catch(() => null);
		sub.name = discordGuild?.name || "Unknown Server";
		sub.icon = discordGuild?.iconURL() || null;
	}

	res.setConfigData({
		tiers: siteSettings?.tiers || [],
		features: siteSettings?.features || [],
	}).setPageData({
		query,
		searchResults,
		recentSubscriptions,
		page: "maintainer-servers.ejs",
	}).render();
};

controllers.membership.servers.post = async (req, res) => {
	if (req.level !== 2 && req.level !== 0) return res.sendStatus(403);

	const { server_id: serverId, tier_id: tierId, expires_at: expiresAt, reason } = req.body;
	const grantFeatures = req.body["grant_features[]"] || [];

	if (!serverId) {
		return res.status(400).json({ error: "Server ID required" });
	}

	try {
		const TierManager = require("../../Modules/TierManager");

		// Set server tier
		if (tierId) {
			const expiration = expiresAt ? new Date(expiresAt) : null;
			await TierManager.setServerTier(serverId, tierId, "manual", expiration, reason || "admin_assigned");
		}

		// Grant individual features
		const features = Array.isArray(grantFeatures) ? grantFeatures : [grantFeatures];
		for (const feature of features.filter(f => f)) {
			await TierManager.grantFeature(serverId, feature);
		}

		res.redirect(req.originalUrl);
	} catch (err) {
		logger.error("Failed to update server tier", { serverId }, err);
		renderError(res, "Failed to update server tier.");
	}
};

controllers.membership.servers.cancel = async (req, res) => {
	if (req.level !== 2 && req.level !== 0) return res.sendStatus(403);

	const { server_id: serverId } = req.body;
	if (!serverId) {
		return res.status(400).json({ error: "Server ID required" });
	}

	try {
		const TierManager = require("../../Modules/TierManager");
		await TierManager.cancelSubscription(serverId, "admin_canceled");
		res.json({ success: true });
	} catch (err) {
		logger.error("Failed to cancel subscription", { serverId }, err);
		res.status(500).json({ error: "Failed to cancel subscription" });
	}
};

controllers.management = {};

controllers.management.maintainers = async (req, { res }) => {
	res.setConfigData({
		maintainers: await Promise.all(configJSON.maintainers.map(async id => {
			const usr = await req.app.client.users.fetch(id, true) || {
				id: "invalid-user",
				username: "invalid-user",
			};
			return {
				name: usr.username,
				id: usr.id,
				avatar: usr.avatarURL ? usr.displayAvatarURL() || "/static/img/discord-icon.png" : "/static/img/discord-icon.png",
				isSudoMaintainer: configJSON.sudoMaintainers.includes(usr.id),
			};
		})),
		perms: configJSON.perms,
	}).setPageData("page", "maintainer-maintainers.ejs").render();
};
controllers.management.maintainers.post = async (req, res) => {
	if (req.level !== 2 && req.level !== 0) return res.sendStatus(403);
	if (req.body["new-user"]) {
		let usr = await Users.findOne({ username: req.body["new-user"] });
		if (!usr) usr = await req.app.client.users.fetch(req.body["new-user"], true);
		if (!usr.id) usr.id = usr._id;

		if (usr && !configJSON.maintainers.includes(usr.id)) {
			configJSON.maintainers.push(usr.id);
		}
		if (usr && req.body.isSudo === "true" && !configJSON.sudoMaintainers.includes(usr.id)) {
			configJSON.sudoMaintainers.push(usr.id);
		}
	} else {
		if (req.body[`maintainer-removed`]) {
			configJSON.maintainers[configJSON.maintainers.indexOf(req.body[`maintainer-removed`])] = null;
			configJSON.sudoMaintainers[configJSON.sudoMaintainers.indexOf(req.body[`maintainer-removed`])] = null;
		}
		if (req.body[`maintainer-sudo`]) {
			if (configJSON.sudoMaintainers.includes(req.body[`maintainer-sudo`])) configJSON.sudoMaintainers[configJSON.sudoMaintainers.indexOf(req.body[`maintainer-sudo`])] = null;
			else configJSON.sudoMaintainers.push(req.body[`maintainer-sudo`]);
		}

		configJSON.maintainers.spliceNullElements();
		configJSON.sudoMaintainers.spliceNullElements();

		const perms = Object.keys(req.body).filter(param => param.startsWith("perm-"));
		perms.forEach(perm => {
			const value = req.body[perm];
			[, perm] = perm.split("-");
			if (configJSON.perms[perm] === 0 && process.env.SKYNET_HOST !== req.user.id) return;
			switch (value) {
				case "sudo":
					configJSON.perms[perm] = 2;
					break;
				case "host":
					configJSON.perms[perm] = 0;
					break;
				default:
					configJSON.perms[perm] = 1;
			}
		});
	}

	if (req.body["additional-perms"]) return save(req, res, true);
	save(req, res);
};

controllers.management.shards = async (req, { res }) => {
	const data = await req.app.client.IPC.send("shardData", {});
	res.setConfigData({
		shardTotal: Number(process.env.SHARD_COUNT),
		data,
	}).setPageData({
		currentShard: req.app.client.shardID,
		page: "maintainer-shards.ejs",
	}).render();
};
controllers.management.shards.post = async (req, res) => {
	const bot = req.app.client;

	if (!canDo("shutdown", req.user.id)) return res.sendStatus(403);

	if (req.body.dismiss) {
		await bot.IPC.send("dismissWarning", { warning: req.body.dismiss });
	}
	if (req.body["freeze-shard"]) {
		await bot.IPC.send("freezeShard", { shard: req.body["freeze-shard"] });
	}
	if (req.body["reset-shard"]) {
		await bot.IPC.send("restartShard", { shard: req.body["reset-shard"], soft: true });
	}
	if (req.body["restart-shard"]) {
		await bot.IPC.send("restartShard", { shard: req.body["restart-shard"], soft: false });
	}
	res.sendStatus(200);

	if (req.body.restart === "master") {
		bot.IPC.send("shutdown", { err: false, soft: true });
	}
	if (req.body.shutdown === "master") {
		bot.IPC.send("shutdown", { err: false });
	}
};

controllers.management.injection = async (req, { res }) => {
	const settings = await SiteSettings.findOne("main");
	const injection = settings?.injection || { headScript: "", footerHTML: "" };

	res.setConfigData({
		injection,
	}).setPageData({
		page: "maintainer-injection.ejs",
	}).render();
};
controllers.management.injection.post = async (req, res) => {
	const siteSettings = await getSiteSettingsForWrite();

	siteSettings.query.set("injection", {
		headScript: req.body.headScript ?? "",
		footerHTML: req.body.footerHTML ?? "",
	});

	await siteSettings.save();

	// Clear the middleware cache so changes take effect immediately
	const { clearInjectionCache } = require("../middleware");
	clearInjectionCache();

	res.sendStatus(200);
};

controllers.management.version = async (req, { res }) => {
	try {
		const version = await req.app.client.central.API("versions").branch(configJSON.branch).get(configJSON.version);
		if (version && version.metadata) version.metadata.changelog = md.makeHtml(version.metadata.changelog);
		const checkData = await version.check();
		if (checkData.current) checkData.current.metadata.changelog = md.makeHtml(checkData.current.metadata.changelog);
		const isDownloaded = checkData && checkData.current && await version.checkDownload(checkData.current.tag);

		res.setPageData({
			disabled: !version.valid,
			latestVersion: checkData.current,
			installedVersion: version,
			utd: checkData.utd,
			isDownloaded,
			page: "maintainer-version.ejs",
		}).setConfigData({
			version: configJSON.version,
			branch: configJSON.branch,
		}).render();
	} catch (err) {
		renderError(res, "Failed to load version data.", null, 500, err);
	}
};
controllers.management.version.post = async (req, res) => {
	res.sendStatus(204);
};
controllers.management.version.socket = async socket => {
	socket.on("disconnect", () => {
		if (socket.isUpdateFinished || !socket.isUpdating) return;
		logger.error("Lost connection to Updater client. Shutting down Skynet in an attempt to resync states (⇀‸↼‶)");
		socket.route.router.app.client.IPC.send("shutdown", { err: true });
	});
	socket.on("download", async data => {
		try {
			if (!data || !data.branch || !data.tag) return socket.emit("err", { error: 400, fatal: false });
			const version = await socket.route.router.app.client.central.API("versions").branch(data.branch).get(data.tag);
			if (!version.valid) return socket.emit("err", { error: 404, fatal: false });

			let pushQueue = 0;
			let finished = false;
			socket.emit("totalChunks", Constants.CODEBASE_TOTAL_CHUNK_SIZE);
			const sendChunkQueue = () => {
				if (finished) return;
				socket.emit("chunk", pushQueue);
				pushQueue = 0;
				setTimeout(sendChunkQueue, Math.floor(Math.random() * 1000));
			};
			sendChunkQueue();
			try {
				await version.download(({ length }) => {
					pushQueue += length;
				});
			} catch (err) {
				finished = true;
				logger.error("Version download failed", { branch: data.branch, tag: data.tag }, err);
				return socket.emit("err", { error: 500, fatal: false });
			}

			finished = true;
			socket.emit("downloadSuccess");
		} catch (err) {
			logger.error("Unhandled error in version download socket", { branch: data && data.branch, tag: data && data.tag }, err);
			socket.emit("err", { error: 500, fatal: false });
		}
	});
	socket.on("install", async data => {
		try {
			const version = await socket.route.router.app.client.central.API("versions").branch(data.branch).get(data.tag);
			if (!await version.checkDownload()) {
				return socket.emit("err", { error: 404, fatal: true, message: "That version has not been downloaded yet." });
			}

			version.on("installLog", log => {
				socket.emit("installLog", log);
			});
			version.on("installFinish", async () => {
				configJSON.version = version.tag;
				configJSON.branch = version.branch;
				socket.request.app = socket.route.router.app;
				await save(socket.request, null, true, true);
				socket.emit("installFinish");
			});

			await version.install();
		} catch (err) {
			logger.error("Unhandled error in version install socket", { branch: data && data.branch, tag: data && data.tag }, err);
			socket.emit("err", { error: 500, fatal: true });
		}
	});
};

controllers.management.eval = async (req, { res }) => {
	res.setConfigData("shardTotal", Number(process.env.SHARD_COUNT))
		.setPageData("page", "maintainer-eval.ejs")
		.render();
};
controllers.management.eval.post = async (req, res) => {
	if (req.body.code && req.body.target) {
		const result = await req.app.client.IPC.send("evaluate", { code: req.body.code, target: req.body.target });
		res.send(JSON.stringify(result));
		logger.info(`Maintainer ${req.user.username} executed JavaScript from the Maintainer Console!`, { maintainer: req.user.id, code: req.body.code, target: req.body.target });
	} else {
		res.sendStatus(400);
	}
};

controllers.management.logs = async (req, { res }) => {
	logger.winstonLogger.transports[2].query({ limit: 10, order: "desc" }, (err, results) => {
		if (err) return renderError(res, "An error occurred while fetching old logs");

		results.reverse();
		const logs = JSON.stringify(results);

		res.setPageData({
			logs,
			page: "maintainer-logs.ejs",
		}).render();
	});
};
controllers.management.logs.socket = async socket => {
	const send = data => {
		data = JSON.parse(data);
		socket.emit("logs", data);
	};

	const tail = new Tail(path.join(__dirname, "../../logs/console.skynetbot.log"), { useWatchFile: process.platform === "win32" });

	tail.on("line", send);
	tail.watch();

	socket.on("disconnect", () => tail.unwatch());
};

// ============================================
// FEEDBACK SYSTEM CONTROLLERS
// ============================================

controllers.feedback = {};

controllers.feedback.list = async (req, { res }) => {
	const category = req.query.category || "";
	const status = req.query.status || "";

	// Build filter
	const filter = {};
	if (category) filter.category = category;
	if (status) filter.status = status;

	// Get feedback items sorted by newest first
	const feedbackItems = await global.Feedback.find(filter)
		.sort({ created_at: -1 })
		.limit(100)
		.exec();

	// Get counts per category and status
	const categoryCounts = await global.Feedback.aggregate([
		{ $group: { _id: "$category", count: { $sum: 1 } } },
	]);
	const statusCounts = await global.Feedback.aggregate([
		{ $group: { _id: "$status", count: { $sum: 1 } } },
	]);

	// Enrich with user data
	for (const item of feedbackItems) {
		try {
			const user = await req.app.client.users.fetch(item.user_id, true).catch(() => null);
			item.user_avatar = user?.displayAvatarURL() || "/static/img/discord-icon.png";
			item.username = item.username || user?.username || "Unknown";
		} catch {
			item.user_avatar = "/static/img/discord-icon.png";
		}
	}

	res.setConfigData({
		feedbackItems,
		categoryCounts: categoryCounts.reduce((acc, c) => { acc[c._id] = c.count; return acc; }, {}),
		statusCounts: statusCounts.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {}),
		categories: ["bug", "feature", "improvement", "question", "other"],
		statuses: ["new", "in_progress", "resolved", "closed"],
	}).setPageData({
		activeCategory: category,
		activeStatus: status,
		page: "maintainer-feedback.ejs",
	}).render();
};

controllers.feedback.update = async (req, res) => {
	const { id, status, admin_notes: adminNotes } = req.body;

	if (!id) {
		return res.status(400).json({ error: "Feedback ID required" });
	}

	try {
		const feedback = await global.Feedback.findOne(id);
		if (!feedback) {
			return res.status(404).json({ error: "Feedback not found" });
		}

		if (status) feedback.query.set("status", status);
		if (adminNotes !== undefined) feedback.query.set("admin_notes", adminNotes);
		feedback.query.set("updated_at", new Date());

		await feedback.save();
		res.json({ success: true });
	} catch (err) {
		logger.error("Failed to update feedback", { id }, err);
		res.status(500).json({ error: "Failed to update feedback" });
	}
};

controllers.feedback.delete = async (req, res) => {
	const { id } = req.body;

	if (!id) {
		return res.status(400).json({ error: "Feedback ID required" });
	}

	try {
		await global.Feedback.delete({ _id: id });
		res.json({ success: true });
	} catch (err) {
		logger.error("Failed to delete feedback", { id }, err);
		res.status(500).json({ error: "Failed to delete feedback" });
	}
};

// Public feedback submission (used by floating widget)
controllers.feedback.submit = async (req, res) => {
	const { category, message, page_url: pageUrl } = req.body;

	if (!message || !category) {
		return res.status(400).json({ error: "Category and message are required" });
	}

	const validCategories = ["bug", "feature", "improvement", "question", "other"];
	if (!validCategories.includes(category)) {
		return res.status(400).json({ error: "Invalid category" });
	}

	try {
		const feedbackId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const userId = req.isAuthenticated() ? req.user.id : "anonymous";
		const username = req.isAuthenticated() ? req.user.username : "Anonymous";

		await global.Feedback.create({
			_id: feedbackId,
			user_id: userId,
			username,
			category,
			message: message.substring(0, 2000), // Limit message length
			page_url: pageUrl || "",
			status: "new",
			created_at: new Date(),
			updated_at: new Date(),
		});

		res.json({ success: true, id: feedbackId });
	} catch (err) {
		logger.error("Failed to submit feedback", {}, err);
		res.status(500).json({ error: "Failed to submit feedback" });
	}
};

// ============================================
// TICKETS SYSTEM CONTROLLERS
// ============================================

controllers.tickets = {};

/**
 * Get next ticket number (auto-increment)
 */
const getNextTicketNumber = async () => {
	// For MongoDB, we use a counter document
	// For SQL, we use the ticket_counters table
	try {
		const result = await global.Tickets.aggregate([
			{ $group: { _id: null, maxNumber: { $max: "$ticket_number" } } },
		]);
		return (result && result[0] && result[0].maxNumber ? result[0].maxNumber : 0) + 1;
	} catch {
		// Fallback: count existing tickets
		const tickets = await global.Tickets.find({}).limit(1).sort({ ticket_number: -1 })
			.exec();
		return tickets && tickets.length > 0 ? (tickets[0].ticket_number || 0) + 1 : 1;
	}
};

controllers.tickets.list = async (req, { res }) => {
	const status = req.query.status || "";
	const priority = req.query.priority || "";
	const category = req.query.category || "";
	const assignedTo = req.query.assigned || "";

	// Build filter
	const filter = {};
	if (status) filter.status = status;
	if (priority) filter.priority = priority;
	if (category) filter.category = category;
	if (assignedTo === "me") filter.assigned_to = req.user.id;
	else if (assignedTo === "unassigned") filter.assigned_to = null;

	// Get tickets sorted by last activity (newest first)
	const tickets = await global.Tickets.find(filter)
		.sort({ last_activity_at: -1 })
		.limit(100)
		.exec();

	// Get counts per status and priority
	const statusCounts = await global.Tickets.aggregate([
		{ $group: { _id: "$status", count: { $sum: 1 } } },
	]);
	const priorityCounts = await global.Tickets.aggregate([
		{ $group: { _id: "$priority", count: { $sum: 1 } } },
	]);
	const categoryCounts = await global.Tickets.aggregate([
		{ $group: { _id: "$category", count: { $sum: 1 } } },
	]);

	// Enrich tickets with user avatars
	for (const ticket of tickets) {
		try {
			const user = await req.app.client.users.fetch(ticket.user_id, true).catch(() => null);
			ticket.user_avatar = user?.displayAvatarURL() || ticket.user_avatar || "/static/img/discord-icon.png";
			ticket.username = ticket.username || user?.username || "Unknown";
		} catch {
			ticket.user_avatar = ticket.user_avatar || "/static/img/discord-icon.png";
		}
	}

	// Get maintainers for assignment dropdown
	const maintainers = await Promise.all(configJSON.maintainers.map(async id => {
		try {
			const user = await req.app.client.users.fetch(id, true).catch(() => null);
			return { id, username: user?.username || "Unknown" };
		} catch {
			return { id, username: "Unknown" };
		}
	}));

	res.setConfigData({
		tickets,
		statusCounts: statusCounts.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {}),
		priorityCounts: priorityCounts.reduce((acc, p) => { acc[p._id] = p.count; return acc; }, {}),
		categoryCounts: categoryCounts.reduce((acc, c) => { acc[c._id] = c.count; return acc; }, {}),
		statuses: ["open", "in_progress", "awaiting_response", "on_hold", "resolved", "closed"],
		priorities: ["low", "normal", "high", "urgent"],
		categories: ["general", "bug", "feature", "billing", "account", "other"],
		maintainers,
	}).setPageData({
		activeStatus: status,
		activePriority: priority,
		activeCategory: category,
		activeAssigned: assignedTo,
		page: "maintainer-tickets.ejs",
	}).render();
};

controllers.tickets.view = async (req, { res }) => {
	const ticketId = req.params.ticketId;

	const ticket = await global.Tickets.findOne(ticketId);
	if (!ticket) {
		return res.redirect("/dashboard/maintainer/tickets");
	}

	// Get messages for this ticket
	const messages = await global.TicketMessages.find({ ticket_id: ticketId })
		.sort({ created_at: 1 })
		.exec();

	// Enrich messages with avatars
	for (const msg of messages) {
		try {
			const user = await req.app.client.users.fetch(msg.author_id, true).catch(() => null);
			msg.author_avatar = user?.displayAvatarURL() || msg.author_avatar || "/static/img/discord-icon.png";
			msg.author_username = msg.author_username || user?.username || "Unknown";
		} catch {
			msg.author_avatar = msg.author_avatar || "/static/img/discord-icon.png";
		}
	}

	// Enrich ticket with user avatar
	try {
		const user = await req.app.client.users.fetch(ticket.user_id, true).catch(() => null);
		ticket.user_avatar = user?.displayAvatarURL() || ticket.user_avatar || "/static/img/discord-icon.png";
		ticket.username = ticket.username || user?.username || "Unknown";
	} catch {
		ticket.user_avatar = ticket.user_avatar || "/static/img/discord-icon.png";
	}

	// Get maintainers for assignment dropdown
	const maintainers = await Promise.all(configJSON.maintainers.map(async id => {
		try {
			const user = await req.app.client.users.fetch(id, true).catch(() => null);
			return { id, username: user?.username || "Unknown" };
		} catch {
			return { id, username: "Unknown" };
		}
	}));

	res.setConfigData({
		ticket,
		messages,
		statuses: ["open", "in_progress", "awaiting_response", "on_hold", "resolved", "closed"],
		priorities: ["low", "normal", "high", "urgent"],
		categories: ["general", "bug", "feature", "billing", "account", "other"],
		maintainers,
	}).setPageData({
		page: "maintainer-ticket-view.ejs",
	}).render();
};

controllers.tickets.update = async (req, res) => {
	const { id, status, priority, category, assigned_to: assignedTo, internal_notes: internalNotes, resolution_notes: resolutionNotes } = req.body;

	if (!id) {
		return res.status(400).json({ error: "Ticket ID required" });
	}

	try {
		const ticket = await global.Tickets.findOne(id);
		if (!ticket) {
			return res.status(404).json({ error: "Ticket not found" });
		}

		const changes = [];

		if (status && status !== ticket.status) {
			ticket.query.set("status", status);
			changes.push(`Status changed to ${status}`);
			if (status === "closed" || status === "resolved") {
				ticket.query.set("closed_at", new Date());
			}
		}
		if (priority && priority !== ticket.priority) {
			ticket.query.set("priority", priority);
			changes.push(`Priority changed to ${priority}`);
		}
		if (category && category !== ticket.category) {
			ticket.query.set("category", category);
			changes.push(`Category changed to ${category}`);
		}
		if (assignedTo !== undefined) {
			if (assignedTo === "" || assignedTo === "unassign") {
				ticket.query.set("assigned_to", null);
				ticket.query.set("assigned_to_username", "");
				changes.push("Ticket unassigned");
			} else if (assignedTo !== ticket.assigned_to) {
				ticket.query.set("assigned_to", assignedTo);
				// Fetch assignee username
				try {
					const user = await req.app.client.users.fetch(assignedTo, true).catch(() => null);
					ticket.query.set("assigned_to_username", user?.username || "");
					changes.push(`Assigned to ${user?.username || assignedTo}`);
				} catch {
					ticket.query.set("assigned_to_username", "");
				}
			}
		}
		if (internalNotes !== undefined) {
			ticket.query.set("internal_notes", internalNotes);
		}
		if (resolutionNotes !== undefined) {
			ticket.query.set("resolution_notes", resolutionNotes);
		}

		ticket.query.set("updated_at", new Date());
		ticket.query.set("last_activity_at", new Date());

		await ticket.save();

		// Add system message for status changes if any
		if (changes.length > 0) {
			const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
			await global.TicketMessages.create({
				_id: messageId,
				ticket_id: id,
				author_id: req.user.id,
				author_username: req.user.username,
				is_staff: true,
				content: changes.join(". "),
				is_system_message: true,
				created_at: new Date(),
			});
		}

		res.json({ success: true });
	} catch (err) {
		logger.error("Failed to update ticket", { id }, err);
		res.status(500).json({ error: "Failed to update ticket" });
	}
};

controllers.tickets.reply = async (req, res) => {
	const { id, content } = req.body;

	if (!id || !content) {
		return res.status(400).json({ error: "Ticket ID and content required" });
	}

	try {
		const ticket = await global.Tickets.findOne(id);
		if (!ticket) {
			return res.status(404).json({ error: "Ticket not found" });
		}

		// Create the message
		const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		await global.TicketMessages.create({
			_id: messageId,
			ticket_id: id,
			author_id: req.user.id,
			author_username: req.user.username,
			author_avatar: req.user.avatar ? `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png` : "",
			is_staff: true,
			content: content.substring(0, 4000),
			is_system_message: false,
			created_at: new Date(),
		});

		// Update ticket
		ticket.query.set("message_count", (ticket.message_count || 0) + 1);
		ticket.query.set("last_message_preview", content.substring(0, 100));
		ticket.query.set("last_activity_at", new Date());
		ticket.query.set("updated_at", new Date());
		if (ticket.status === "awaiting_response") {
			ticket.query.set("status", "in_progress");
		}
		await ticket.save();

		// Send DM to user if we have a channel
		if (ticket.dm_channel_id) {
			try {
				const user = await req.app.client.users.fetch(ticket.user_id);
				if (user) {
					await user.send({
						embeds: [{
							color: 0x3273dc,
							author: {
								name: `Support Reply - Ticket #${ticket.ticket_number}`,
								icon_url: req.app.client.user.displayAvatarURL(),
							},
							description: content.substring(0, 2000),
							footer: { text: "Reply to this message to continue the conversation" },
							timestamp: new Date().toISOString(),
						}],
					}).catch(() => null);
				}
			} catch (dmErr) {
				logger.debug("Could not send DM to ticket user", { userId: ticket.user_id }, dmErr);
			}
		}

		res.json({ success: true, messageId });
	} catch (err) {
		logger.error("Failed to reply to ticket", { id }, err);
		res.status(500).json({ error: "Failed to reply to ticket" });
	}
};

controllers.tickets.close = async (req, res) => {
	const { id, resolution_notes: resolutionNotes } = req.body;

	if (!id) {
		return res.status(400).json({ error: "Ticket ID required" });
	}

	try {
		const ticket = await global.Tickets.findOne(id);
		if (!ticket) {
			return res.status(404).json({ error: "Ticket not found" });
		}

		ticket.query.set("status", "closed");
		ticket.query.set("closed_at", new Date());
		ticket.query.set("updated_at", new Date());
		if (resolutionNotes) {
			ticket.query.set("resolution_notes", resolutionNotes);
		}
		await ticket.save();

		// Add system message
		const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		await global.TicketMessages.create({
			_id: messageId,
			ticket_id: id,
			author_id: req.user.id,
			author_username: req.user.username,
			is_staff: true,
			content: `Ticket closed${resolutionNotes ? `: ${resolutionNotes}` : ""}`,
			is_system_message: true,
			created_at: new Date(),
		});

		// Notify user
		try {
			const user = await req.app.client.users.fetch(ticket.user_id);
			if (user) {
				await user.send({
					embeds: [{
						color: 0x48c774,
						title: `Ticket #${ticket.ticket_number} Closed`,
						description: resolutionNotes || "Your support ticket has been resolved and closed.",
						footer: { text: "Thank you for contacting support!" },
						timestamp: new Date().toISOString(),
					}],
				}).catch(() => null);
			}
		} catch {
			// Ignore DM errors
		}

		res.json({ success: true });
	} catch (err) {
		logger.error("Failed to close ticket", { id }, err);
		res.status(500).json({ error: "Failed to close ticket" });
	}
};

controllers.tickets.delete = async (req, res) => {
	const { id } = req.body;

	if (!id) {
		return res.status(400).json({ error: "Ticket ID required" });
	}

	try {
		// Delete messages first
		await global.TicketMessages.delete({ ticket_id: id });
		// Delete ticket
		await global.Tickets.delete({ _id: id });
		res.json({ success: true });
	} catch (err) {
		logger.error("Failed to delete ticket", { id }, err);
		res.status(500).json({ error: "Failed to delete ticket" });
	}
};

controllers.tickets.transcript = async (req, res) => {
	const ticketId = req.params.ticketId;

	try {
		const ticket = await global.Tickets.findOne(ticketId);
		if (!ticket) {
			return res.status(404).json({ error: "Ticket not found" });
		}

		const messages = await global.TicketMessages.find({ ticket_id: ticketId })
			.sort({ created_at: 1 })
			.exec();

		// Generate text transcript
		let transcript = `=== TICKET #${ticket.ticket_number} TRANSCRIPT ===\n`;
		transcript += `Subject: ${ticket.subject}\n`;
		transcript += `Category: ${ticket.category}\n`;
		transcript += `Status: ${ticket.status}\n`;
		transcript += `Priority: ${ticket.priority}\n`;
		transcript += `User: ${ticket.username} (${ticket.user_id})\n`;
		transcript += `Created: ${new Date(ticket.created_at).toISOString()}\n`;
		if (ticket.assigned_to) transcript += `Assigned to: ${ticket.assigned_to_username}\n`;
		if (ticket.closed_at) transcript += `Closed: ${new Date(ticket.closed_at).toISOString()}\n`;
		transcript += `\n${"=".repeat(50)}\n\n`;

		for (const msg of messages) {
			const date = new Date(msg.created_at).toISOString();
			const author = msg.is_staff ? `[STAFF] ${msg.author_username}` : msg.author_username;
			const prefix = msg.is_system_message ? "[SYSTEM] " : "";
			transcript += `[${date}] ${prefix}${author}:\n${msg.content}\n\n`;
		}

		transcript += `\n${"=".repeat(50)}\n`;
		transcript += `End of transcript - Generated ${new Date().toISOString()}\n`;

		res.setHeader("Content-Type", "text/plain");
		res.setHeader("Content-Disposition", `attachment; filename="ticket-${ticket.ticket_number}-transcript.txt"`);
		res.send(transcript);
	} catch (err) {
		logger.error("Failed to generate transcript", { ticketId }, err);
		res.status(500).json({ error: "Failed to generate transcript" });
	}
};

// Export getNextTicketNumber for use in DM handler
controllers.tickets.getNextTicketNumber = getNextTicketNumber;

// ============================================
// CLOUDFLARE INTEGRATION CONTROLLERS
// ============================================

controllers.cloudflare = require("./cloudflare");
