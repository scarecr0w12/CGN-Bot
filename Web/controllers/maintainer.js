const path = require("path");
const showdown = require("showdown");
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
	if (result) {
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

controllers.options = {};

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

	let siteSettings = await SiteSettings.findOne("main");
	if (!siteSettings) {
		siteSettings = SiteSettings.new({ _id: "main" });
		await siteSettings.save();
	}

	res.setConfigData({
		donateSubtitle: siteSettings.donateSubtitle || configJS.donateSubtitle || "",
		charities: siteSettings.charities || [],
	}).setPageData({
		page: "maintainer-donations.ejs",
	}).render();
};
controllers.options.donations.post = async (req, res) => {
	if (req.level !== 2 && req.level !== 0) return res.sendStatus(403);

	let siteSettings = await SiteSettings.findOne("main");
	if (!siteSettings) {
		siteSettings = SiteSettings.new({ _id: "main" });
	}

	siteSettings.query.set("donateSubtitle", req.body.donateSubtitle || "");

	const names = req.body.name ? (Array.isArray(req.body.name) ? req.body.name : [req.body.name]) : [];
	const countries = req.body.country ? (Array.isArray(req.body.country) ? req.body.country : [req.body.country]) : [];
	const donateUrls = req.body.donate_url ? (Array.isArray(req.body.donate_url) ? req.body.donate_url : [req.body.donate_url]) : [];
	const iconUrls = req.body.icon_url ? (Array.isArray(req.body.icon_url) ? req.body.icon_url : [req.body.icon_url]) : [];

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

// ============================================
// MEMBERSHIP SYSTEM CONTROLLERS
// ============================================

controllers.membership = {};

// Feature Registry
controllers.membership.features = async (req, { res }) => {
	if (req.level !== 2 && req.level !== 0) return res.redirect("/dashboard/maintainer");

	let siteSettings = await SiteSettings.findOne("main");
	if (!siteSettings) {
		siteSettings = SiteSettings.new({ _id: "main" });
		await siteSettings.save();
		siteSettings = await SiteSettings.findOne("main");
	}

	res.setConfigData({
		features: siteSettings.features || [],
	}).setPageData({
		page: "maintainer-features.ejs",
	}).render();
};

controllers.membership.features.post = async (req, res) => {
	if (req.level !== 2 && req.level !== 0) return res.sendStatus(403);

	let siteSettings = await SiteSettings.findOne("main");
	if (!siteSettings) {
		siteSettings = SiteSettings.new({ _id: "main" });
	}

	const ids = req.body.feature_id ? (Array.isArray(req.body.feature_id) ? req.body.feature_id : [req.body.feature_id]) : [];
	const names = req.body.feature_name ? (Array.isArray(req.body.feature_name) ? req.body.feature_name : [req.body.feature_name]) : [];
	const descriptions = req.body.feature_description ? (Array.isArray(req.body.feature_description) ? req.body.feature_description : [req.body.feature_description]) : [];
	const categories = req.body.feature_category ? (Array.isArray(req.body.feature_category) ? req.body.feature_category : [req.body.feature_category]) : [];
	const enabledList = req.body.feature_enabled ? (Array.isArray(req.body.feature_enabled) ? req.body.feature_enabled : [req.body.feature_enabled]) : [];

	const features = [];
	for (let i = 0; i < ids.length; i++) {
		if (ids[i] && names[i]) {
			features.push({
				_id: ids[i].toLowerCase().replace(/[^a-z0-9_]/g, "_"),
				name: names[i],
				description: descriptions[i] || "",
				category: categories[i] || "general",
				isEnabled: enabledList.includes(ids[i]) || enabledList.includes("new"),
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

	let siteSettings = await SiteSettings.findOne("main");
	if (!siteSettings) {
		siteSettings = SiteSettings.new({ _id: "main" });
		await siteSettings.save();
		siteSettings = await SiteSettings.findOne("main");
	}

	res.setConfigData({
		tiers: siteSettings.tiers || [],
		features: siteSettings.features || [],
	}).setPageData({
		page: "maintainer-tiers.ejs",
	}).render();
};

controllers.membership.tiers.post = async (req, res) => {
	if (req.level !== 2 && req.level !== 0) return res.sendStatus(403);

	let siteSettings = await SiteSettings.findOne("main");
	if (!siteSettings) {
		siteSettings = SiteSettings.new({ _id: "main" });
	}

	const ids = req.body.tier_id ? (Array.isArray(req.body.tier_id) ? req.body.tier_id : [req.body.tier_id]) : [];
	const names = req.body.tier_name ? (Array.isArray(req.body.tier_name) ? req.body.tier_name : [req.body.tier_name]) : [];
	const levels = req.body.tier_level ? (Array.isArray(req.body.tier_level) ? req.body.tier_level : [req.body.tier_level]) : [];
	const descriptions = req.body.tier_description ? (Array.isArray(req.body.tier_description) ? req.body.tier_description : [req.body.tier_description]) : [];
	const colors = req.body.tier_color ? (Array.isArray(req.body.tier_color) ? req.body.tier_color : [req.body.tier_color]) : [];
	const badges = req.body.tier_badge ? (Array.isArray(req.body.tier_badge) ? req.body.tier_badge : [req.body.tier_badge]) : [];
	const pricesMonthly = req.body.tier_price_monthly ? (Array.isArray(req.body.tier_price_monthly) ? req.body.tier_price_monthly : [req.body.tier_price_monthly]) : [];
	const pricesYearly = req.body.tier_price_yearly ? (Array.isArray(req.body.tier_price_yearly) ? req.body.tier_price_yearly : [req.body.tier_price_yearly]) : [];
	const featuresList = req.body.tier_features ? (Array.isArray(req.body.tier_features) ? req.body.tier_features : [req.body.tier_features]) : [];
	const purchasableList = req.body.tier_purchasable ? (Array.isArray(req.body.tier_purchasable) ? req.body.tier_purchasable : [req.body.tier_purchasable]) : [];
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
				price_yearly: parseInt(pricesYearly[i]) || 0,
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

	let siteSettings = await SiteSettings.findOne("main");
	if (!siteSettings) {
		siteSettings = SiteSettings.new({ _id: "main" });
		await siteSettings.save();
		siteSettings = await SiteSettings.findOne("main");
	}

	res.setConfigData({
		oauth_providers: siteSettings.oauth_providers || {},
		tiers: siteSettings.tiers || [],
		hostingURL: configJS.hostingURL,
	}).setPageData({
		page: "maintainer-oauth.ejs",
	}).render();
};

controllers.membership.oauth.post = async (req, res) => {
	if (req.level !== 2 && req.level !== 0) return res.sendStatus(403);

	let siteSettings = await SiteSettings.findOne("main");
	if (!siteSettings) {
		siteSettings = SiteSettings.new({ _id: "main" });
	}

	// Update OAuth provider enabled states
	siteSettings.query.set("oauth_providers.google.isEnabled", req.body.google_enabled === "on");
	siteSettings.query.set("oauth_providers.github.isEnabled", req.body.github_enabled === "on");
	siteSettings.query.set("oauth_providers.twitch.isEnabled", req.body.twitch_enabled === "on");
	siteSettings.query.set("oauth_providers.patreon.isEnabled", req.body.patreon_enabled === "on");

	// Patreon tier mapping
	const patreonTierIds = req.body.patreon_tier_id ? (Array.isArray(req.body.patreon_tier_id) ? req.body.patreon_tier_id : [req.body.patreon_tier_id]) : [];
	const patreonLocalTiers = req.body.patreon_local_tier ? (Array.isArray(req.body.patreon_local_tier) ? req.body.patreon_local_tier : [req.body.patreon_local_tier]) : [];

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

	let siteSettings = await SiteSettings.findOne("main");
	if (!siteSettings) {
		siteSettings = SiteSettings.new({ _id: "main" });
		await siteSettings.save();
		siteSettings = await SiteSettings.findOne("main");
	}

	res.setConfigData({
		payment_providers: siteSettings.payment_providers || {},
		tiers: siteSettings.tiers || [],
		hostingURL: configJS.hostingURL,
	}).setPageData({
		page: "maintainer-payments.ejs",
	}).render();
};

controllers.membership.payments.post = async (req, res) => {
	if (req.level !== 2 && req.level !== 0) return res.sendStatus(403);

	let siteSettings = await SiteSettings.findOne("main");
	if (!siteSettings) {
		siteSettings = SiteSettings.new({ _id: "main" });
	}

	// Update payment provider enabled states
	siteSettings.query.set("payment_providers.stripe.isEnabled", req.body.stripe_enabled === "on");
	siteSettings.query.set("payment_providers.paypal.isEnabled", req.body.paypal_enabled === "on");
	siteSettings.query.set("payment_providers.btcpay.isEnabled", req.body.btcpay_enabled === "on");

	// Stripe product mapping
	const stripeProductIds = req.body.stripe_product_id ? (Array.isArray(req.body.stripe_product_id) ? req.body.stripe_product_id : [req.body.stripe_product_id]) : [];
	const stripePriceIds = req.body.stripe_price_id ? (Array.isArray(req.body.stripe_price_id) ? req.body.stripe_price_id : [req.body.stripe_price_id]) : [];
	const stripeTierIds = req.body.stripe_tier_id ? (Array.isArray(req.body.stripe_tier_id) ? req.body.stripe_tier_id : [req.body.stripe_tier_id]) : [];

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
	const paypalPlanIds = req.body.paypal_plan_id ? (Array.isArray(req.body.paypal_plan_id) ? req.body.paypal_plan_id : [req.body.paypal_plan_id]) : [];
	const paypalTierIds = req.body.paypal_tier_id ? (Array.isArray(req.body.paypal_tier_id) ? req.body.paypal_tier_id : [req.body.paypal_tier_id]) : [];

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
	res.setConfigData({
		injection: configJSON.injection,
	}).setPageData({
		page: "maintainer-injection.ejs",
	}).render();
};
controllers.management.injection.post = async (req, res) => {
	Object.keys(configJSON.injection).forEach(key => {
		if (req.body[key] || req.body[key] === "") configJSON.injection[key] = req.body[key];
	});

	save(req, res, true);
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
