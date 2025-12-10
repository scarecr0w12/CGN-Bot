const { parseAuthUser, fetchMaintainerPrivileges } = require("../helpers");

class SkynetResponse {
	constructor (req, res, page) {
		// SEO: Build canonical path (without query strings)
		const currentPath = `${req.baseUrl}${req.path}`.replace(/\/$/, "") || "/";

		this.template = {
			authUser: req.isAuthenticated() ? parseAuthUser(req.user) : null,
			currentPage: `${req.baseUrl}${req.path}`,
			currentPath: currentPath,
			hostingURL: req.app.client.configJS.hostingURL,
			officialMode: req.app.client.officialMode ? true : undefined,
			adsense: {
				isEnabled: req.cookies.adsPreference !== "false",
				ID: req.app.client.officialMode ? configJS.adsenseID : undefined,
			},
			injection: configJSON.injection,
		};

		this.serverData = {
			name: req.app.client.user.username,
			id: req.app.client.user.id,
			icon: req.app.client.user.displayAvatarURL() || "/static/img/discord-icon.png",
		};
		this.configData = {};
		this.pageData = {};

		if (req.perm && req.user) {
			Object.assign(this.template, {
				isContributor: true,
				isMaintainer: true,
				isSudoMaintainer: req.level === 2 || req.level === 0,
				isHost: req.level === 0,
				accessPrivileges: fetchMaintainerPrivileges(req.user.id),
			});
			this.serverData.isMaintainer = true;
		} else if (req.user) {
			Object.assign(this.template, {
				isContributor: req.isAuthenticated() ? configJSON.wikiContributors.includes(req.user.id) || configJSON.maintainers.includes(req.user.id) : false,
				isMaintainer: req.isAuthenticated() ? configJSON.maintainers.includes(parseAuthUser(req.user).id) : false,
				isSudoMaintainer: req.isAuthenticated() ? configJSON.sudoMaintainers.includes(parseAuthUser(req.user).id) : false,
			});
		} else {
			Object.assign(this.template, {
				isContributor: false,
				isMaintainer: false,
				isSudoMaintainer: false,
			});
		}

		this._client = req.app.client;
		this._page = page;
		this.sendStatus = res.sendStatus.bind(res);
		this.status = res.status.bind(res);
		this.redirect = res.redirect.bind(res);
		this.json = res.json.bind(res);
		this._render = res.render.bind(res);
	}

	setConfigData (key, data) {
		if (!data && typeof key === "object") {
			this.configData = key;
		} else {
			this.configData[key] = data;
		}
		return this;
	}

	setPageData (key, data) {
		if (!data && typeof key === "object") {
			this.pageData = key;
		} else {
			this.pageData[key] = data;
		}
		return this;
	}

	setServerData (key, data) {
		if (!data && typeof key === "object") {
			this.serverData = key;
		} else {
			this.serverData[key] = data;
		}
		return this;
	}

	async render (page, template) {
		if (!page && !this.pageData.page) return this.sendStatus(500);
		if (!page) page = `pages/${this.pageData.page}`;
		this._render(page, template || {
			...this.template,
			serverData: this.serverData,
			configData: this.configData,
			pageData: this.pageData,
		});
		return this;
	}

	populateDashboard (req) {
		if (!req.svr.members[req.svr.ownerId]) req.svr.members[req.svr.ownerId] = { user: { username: "invalid-user", id: "invalid-user" } };
		this.serverData = {
			name: req.svr.name,
			id: req.svr.id,
			icon: req.app.client.getAvatarURL(req.svr.id, req.svr.icon, "icons") || "/static/img/discord-icon.png",
			isMaintainer: false,
			owner: {
				username: req.svr.members[req.svr.ownerId].user.username,
				id: req.svr.members[req.svr.ownerId].user.id,
				avatar: req.app.client.getAvatarURL(req.svr.members[req.svr.ownerId].user.id, req.svr.members[req.svr.ownerId].user.avatar) || "/static/img/discord-icon.png",
			},
		};
		this.template.sudo = req.isSudo;
	}
}

const middleware = module.exports;

middleware.populateRequest = route => (req, res, next) => {
	// Request information
	req.isAPI = route.isAPI;
	req.isStatic = route.isStatic;
	req.perm = route.perm;
	req.isBusy = req.app.toobusy();
	req.debugMode = req.app.get("debug mode");

	// Real client IP (prefer Cloudflare's extracted IP, fallback to Express)
	req.clientIP = req.realIP || req.ip;

	// Response object
	if (route.advanced) res.res = new SkynetResponse(req, res);
	next();
};

middleware.registerTraffic = (req, res, next) => {
	if (!req.cookies.trafficID || req.cookies.trafficID !== req.app.client.traffic.TID) {
		const { TID } = req.app.client.traffic;
		res.cookie("trafficID", TID, { httpOnly: true });
	}
	req.app.client.traffic.count(req.cookies.trafficID, req.isAuthenticated());
	next();
};

middleware.checkUnavailable = (req, res, next) => {
	if (global.isUnavailable || req.isBusy) return res.status(503).render("pages/503.ejs", {});
	next();
};

middleware.checkUnavailableAPI = (req, res, next) => {
	if (global.isUnavailable || req.isBusy) return res.sendStatus(503);
	next();
};

middleware.markAsAPI = (req, res, next) => {
	req.isAPI = true;
	next();
};

middleware.enforceProtocol = (req, res, next) => {
	if (!req.secure) {
		return res.redirect(`https://${req.hostname}:${global.configJS.httpsPort}${req.url}`);
	}
	next();
};

middleware.setHeaders = (req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Credentials", true);
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
};

middleware.logRequest = (req, res, next) => {
	// Get real client IP (from Cloudflare middleware or fallback)
	const clientIP = req.realIP || req.ip;

	logger.verbose(`Incoming ${req.protocol} ${req.method} on ${req.path}.`, {
		ip: clientIP,
		params: req.params,
		query: req.query,
		protocol: req.protocol,
		method: req.method,
		path: req.path,
		useragent: req.header("User-Agent"),
		cfRay: req.headers["cf-ray"] || null,
		country: req.headers["cf-ipcountry"] || null,
	});
	next();
};

middleware.getConsoleSection = (req, res, next) => {
	[, req.section] = req.path.split("/");
	next();
};

// Tier-based feature gating middleware
const TierManager = require("../../Modules/TierManager");

/**
 * Middleware to require a specific feature for access
 * Usage: router.get('/path', middleware.requireFeature('feature_key'), controller)
 * @param {string} featureKey - The feature ID to check
 * @returns {Function} Express middleware
 */
middleware.requireFeature = featureKey => async (req, res, next) => {
	if (!req.isAuthenticated()) {
		if (req.isAPI) return res.sendStatus(401);
		return res.redirect("/login");
	}

	const hasAccess = await TierManager.canAccess(req.user.id, featureKey);
	if (!hasAccess) {
		if (req.isAPI) return res.status(403).json({ error: "Feature not available for your tier" });
		return res.status(403).render("pages/error.ejs", {
			error_text: "Feature Locked",
			error_line: "This feature is not available for your current subscription tier.",
		});
	}

	next();
};

/**
 * Middleware to require a minimum tier level for access
 * Usage: router.get('/path', middleware.requireTierLevel(2), controller)
 * @param {number} minLevel - Minimum tier level required
 * @returns {Function} Express middleware
 */
middleware.requireTierLevel = minLevel => async (req, res, next) => {
	if (!req.isAuthenticated()) {
		if (req.isAPI) return res.sendStatus(401);
		return res.redirect("/login");
	}

	const hasLevel = await TierManager.hasMinimumTierLevel(req.user.id, minLevel);
	if (!hasLevel) {
		if (req.isAPI) return res.status(403).json({ error: "Insufficient tier level" });
		return res.status(403).render("pages/error.ejs", {
			error_text: "Upgrade Required",
			error_line: "This feature requires a higher subscription tier.",
		});
	}

	next();
};

/**
 * Middleware to populate user's tier info on the request
 * Usage: router.get('/path', middleware.populateUserTier, controller)
 */
middleware.populateUserTier = async (req, res, next) => {
	if (req.isAuthenticated()) {
		try {
			req.userTier = await TierManager.getUserTier(req.user.id);
			req.userFeatures = await TierManager.getUserFeatures(req.user.id);

			// Also add to response template if it exists
			if (res.res?.template) {
				res.res.template.userTier = req.userTier;
				res.res.template.userFeatures = Array.from(req.userFeatures);
			}
		} catch (err) {
			logger.warn("Failed to populate user tier", {}, err);
		}
	}
	next();
};

/**
 * Middleware to check subscription expiration
 */
middleware.checkSubscriptionExpiration = async (req, res, next) => {
	if (req.isAuthenticated()) {
		try {
			await TierManager.checkExpiration(req.user.id);
		} catch (err) {
			logger.warn("Failed to check subscription expiration", {}, err);
		}
	}
	next();
};

require("./auth")(middleware);
