/**
 * ConfigManager - Centralized configuration management
 *
 * This module replaces the old config.json file-based configuration with
 * database-backed settings. All runtime-configurable settings are stored
 * in the SiteSettings collection.
 *
 * Usage:
 *   const ConfigManager = require('./Modules/ConfigManager');
 *   const settings = await ConfigManager.get();
 *   settings.maintainers // ['userId1', 'userId2']
 *
 *   // Update settings
 *   await ConfigManager.update({ pmForward: true });
 *
 *   // Check permissions
 *   const canEval = await ConfigManager.canDo('eval', userId);
 */

// Cache for settings to avoid repeated DB queries
let settingsCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30000; // 30 seconds

// Default settings (used when DB has no record)
const DEFAULTS = {
	sudoMaintainers: [],
	maintainers: [],
	wikiContributors: [],
	userBlocklist: [],
	guildBlocklist: [],
	activityBlocklist: [],
	botStatus: "online",
	botActivity: {
		name: "default",
		type: "PLAYING",
		twitchURL: "",
	},
	perms: {
		eval: 0,
		sudo: 2,
		management: 2,
		administration: 1,
		shutdown: 2,
	},
	pmForward: false,
	homepageMessageHTML: "",
	headerImage: "header-bg.jpg",
	injection: {
		headScript: "",
		footerHTML: "",
	},
};

/**
 * Get current settings from database (with caching)
 * @param {boolean} forceRefresh - Force refresh from database
 * @returns {Object} Settings object with all configuration values
 */
const get = async (forceRefresh = false) => {
	const now = Date.now();

	// Return cached settings if still valid
	if (!forceRefresh && settingsCache && (now - cacheTimestamp) < CACHE_TTL) {
		return settingsCache;
	}

	try {
		// SiteSettings is a global model initialized by Driver.js
		if (typeof SiteSettings === "undefined") {
			// Database not yet initialized, return defaults
			return { ...DEFAULTS };
		}

		const doc = await SiteSettings.findOne("main");

		if (!doc) {
			// No settings document exists yet, return defaults
			settingsCache = { ...DEFAULTS };
			cacheTimestamp = now;
			return settingsCache;
		}

		// Merge with defaults to ensure all fields exist
		settingsCache = {
			...DEFAULTS,
			sudoMaintainers: doc.sudoMaintainers || DEFAULTS.sudoMaintainers,
			maintainers: doc.maintainers || DEFAULTS.maintainers,
			wikiContributors: doc.wikiContributors || DEFAULTS.wikiContributors,
			userBlocklist: doc.userBlocklist || DEFAULTS.userBlocklist,
			guildBlocklist: doc.guildBlocklist || DEFAULTS.guildBlocklist,
			activityBlocklist: doc.activityBlocklist || DEFAULTS.activityBlocklist,
			botStatus: doc.botStatus || DEFAULTS.botStatus,
			botActivity: {
				name: doc.botActivity?.name || DEFAULTS.botActivity.name,
				type: doc.botActivity?.type || DEFAULTS.botActivity.type,
				twitchURL: doc.botActivity?.twitchURL || DEFAULTS.botActivity.twitchURL,
			},
			perms: {
				eval: doc.perms?.eval ?? DEFAULTS.perms.eval,
				sudo: doc.perms?.sudo ?? DEFAULTS.perms.sudo,
				management: doc.perms?.management ?? DEFAULTS.perms.management,
				administration: doc.perms?.administration ?? DEFAULTS.perms.administration,
				shutdown: doc.perms?.shutdown ?? DEFAULTS.perms.shutdown,
			},
			pmForward: doc.pmForward ?? DEFAULTS.pmForward,
			homepageMessageHTML: doc.homepageMessageHTML || DEFAULTS.homepageMessageHTML,
			headerImage: doc.headerImage || DEFAULTS.headerImage,
			injection: {
				headScript: doc.injection?.headScript || DEFAULTS.injection.headScript,
				footerHTML: doc.injection?.footerHTML || DEFAULTS.injection.footerHTML,
			},
			// Include other siteSettings fields that exist
			_raw: doc,
		};

		cacheTimestamp = now;
		return settingsCache;
	} catch (err) {
		if (typeof logger !== "undefined") {
			logger.error("ConfigManager: Failed to load settings from database", {}, err);
		}
		// Return cached or defaults on error
		return settingsCache || { ...DEFAULTS };
	}
};

/**
 * Update settings in the database
 * @param {Object} updates - Object containing fields to update
 * @returns {Object} Updated settings
 */
const update = async (updates) => {
	try {
		if (typeof SiteSettings === "undefined") {
			throw new Error("Database not initialized");
		}

		let doc = await SiteSettings.findOne("main");

		if (!doc) {
			// Create new settings document
			doc = SiteSettings.new({ _id: "main" });
		}

		// Apply updates using query interface
		Object.keys(updates).forEach(key => {
			if (key === "_raw" || key === "_id") return;
			doc.query.set(key, updates[key]);
		});

		await doc.save();

		// Invalidate cache
		invalidateCache();

		return get(true);
	} catch (err) {
		if (typeof logger !== "undefined") {
			logger.error("ConfigManager: Failed to update settings", {}, err);
		}
		throw err;
	}
};

/**
 * Invalidate the settings cache
 */
const invalidateCache = () => {
	settingsCache = null;
	cacheTimestamp = 0;
};

/**
 * Check if a user is a maintainer (any level)
 * @param {string} userId - Discord user ID
 * @returns {boolean}
 */
const isMaintainer = async (userId) => {
	const settings = await get();
	return settings.maintainers.includes(userId) || settings.sudoMaintainers.includes(userId);
};

/**
 * Check if a user is a sudo maintainer
 * @param {string} userId - Discord user ID
 * @returns {boolean}
 */
const isSudoMaintainer = async (userId) => {
	const settings = await get();
	return settings.sudoMaintainers.includes(userId);
};

/**
 * Check if a user is blocked globally
 * @param {string} userId - Discord user ID
 * @returns {boolean}
 */
const isUserBlocked = async (userId) => {
	const settings = await get();
	return settings.userBlocklist.includes(userId);
};

/**
 * Check if a guild is blocked
 * @param {string} guildId - Discord guild ID
 * @returns {boolean}
 */
const isGuildBlocked = async (guildId) => {
	const settings = await get();
	return settings.guildBlocklist.includes(guildId);
};

/**
 * Check if a user can perform a specific action based on permission levels
 * @param {string} action - Action name (eval, sudo, management, administration, shutdown)
 * @param {string} userId - Discord user ID
 * @returns {boolean}
 */
const canDo = async (action, userId) => {
	const settings = await get();
	const permLevel = settings.perms[action];

	if (permLevel === undefined) return false;

	// Level 0 = Host only
	if (permLevel === 0) {
		return process.env.SKYNET_HOST === userId;
	}

	// Level 1 = All maintainers
	if (permLevel === 1) {
		return settings.maintainers.includes(userId) || settings.sudoMaintainers.includes(userId);
	}

	// Level 2 = Sudo maintainers only
	if (permLevel === 2) {
		return settings.sudoMaintainers.includes(userId);
	}

	return false;
};

/**
 * Get the permission level for a user
 * @param {string} userId - Discord user ID
 * @returns {number} 0 = Host, 1 = Maintainer, 2 = Sudo Maintainer, -1 = None
 */
const getUserLevel = async (userId) => {
	if (process.env.SKYNET_HOST === userId) return 0;

	const settings = await get();
	if (settings.sudoMaintainers.includes(userId)) return 2;
	if (settings.maintainers.includes(userId)) return 1;

	return -1;
};

/**
 * Check sudo mode access (compatible with old configJSON.perms.sudo check)
 * @param {string} userId - Discord user ID
 * @returns {boolean}
 */
const checkSudoMode = async (userId) => {
	const settings = await get();
	const sudoLevel = settings.perms.sudo;

	if (sudoLevel === 0) return process.env.SKYNET_HOST === userId;
	if (sudoLevel === 2) return settings.sudoMaintainers.includes(userId);
	return settings.maintainers.includes(userId);
};

/**
 * Fetch maintainer privileges for a user
 * @param {string} userId - Discord user ID
 * @returns {string[]} Array of action names the user can perform
 */
const fetchMaintainerPrivileges = async (userId) => {
	const settings = await get();
	let permLevel;

	if (process.env.SKYNET_HOST === userId) permLevel = 0;
	else if (settings.sudoMaintainers.includes(userId)) permLevel = 2;
	else if (settings.maintainers.includes(userId)) permLevel = 1;
	else return [];

	return Object.keys(settings.perms).filter(key => {
		const actionLevel = settings.perms[key];
		return actionLevel === permLevel || permLevel === 0 || (permLevel === 2 && actionLevel === 1);
	});
};

/**
 * Add a user to maintainers list
 * @param {string} userId - Discord user ID
 * @param {boolean} isSudo - Whether to add as sudo maintainer
 */
const addMaintainer = async (userId, isSudo = false) => {
	const settings = await get();
	const updates = {};

	if (!settings.maintainers.includes(userId)) {
		updates.maintainers = [...settings.maintainers, userId];
	}

	if (isSudo && !settings.sudoMaintainers.includes(userId)) {
		updates.sudoMaintainers = [...settings.sudoMaintainers, userId];
	}

	if (Object.keys(updates).length > 0) {
		await update(updates);
	}
};

/**
 * Remove a user from maintainers list
 * @param {string} userId - Discord user ID
 */
const removeMaintainer = async (userId) => {
	const settings = await get();
	const updates = {};

	if (settings.maintainers.includes(userId)) {
		updates.maintainers = settings.maintainers.filter(id => id !== userId);
	}

	if (settings.sudoMaintainers.includes(userId)) {
		updates.sudoMaintainers = settings.sudoMaintainers.filter(id => id !== userId);
	}

	if (Object.keys(updates).length > 0) {
		await update(updates);
	}
};

/**
 * Add a user to the blocklist
 * @param {string} userId - Discord user ID
 */
const blockUser = async (userId) => {
	const settings = await get();
	if (!settings.userBlocklist.includes(userId)) {
		await update({ userBlocklist: [...settings.userBlocklist, userId] });
	}
};

/**
 * Remove a user from the blocklist
 * @param {string} userId - Discord user ID
 */
const unblockUser = async (userId) => {
	const settings = await get();
	if (settings.userBlocklist.includes(userId)) {
		await update({ userBlocklist: settings.userBlocklist.filter(id => id !== userId) });
	}
};

/**
 * Add a guild to the blocklist
 * @param {string} guildId - Discord guild ID
 */
const blockGuild = async (guildId) => {
	const settings = await get();
	if (!settings.guildBlocklist.includes(guildId)) {
		await update({ guildBlocklist: [...settings.guildBlocklist, guildId] });
	}
};

/**
 * Remove a guild from the blocklist
 * @param {string} guildId - Discord guild ID
 */
const unblockGuild = async (guildId) => {
	const settings = await get();
	if (settings.guildBlocklist.includes(guildId)) {
		await update({ guildBlocklist: settings.guildBlocklist.filter(id => id !== guildId) });
	}
};

/**
 * Get synchronous access to cached settings (may be stale)
 * Use this only when async is not possible and you accept potentially stale data
 * @returns {Object|null} Cached settings or null if not yet loaded
 */
const getCached = () => settingsCache || { ...DEFAULTS };

/**
 * Initialize the config manager by loading settings
 * Call this during bot startup after database connection
 */
const initialize = async () => {
	await get(true);
	if (typeof logger !== "undefined") {
		logger.info("ConfigManager initialized with database settings");
	}
};

module.exports = {
	get,
	update,
	invalidateCache,
	isMaintainer,
	isSudoMaintainer,
	isUserBlocked,
	isGuildBlocked,
	canDo,
	getUserLevel,
	checkSudoMode,
	fetchMaintainerPrivileges,
	addMaintainer,
	removeMaintainer,
	blockUser,
	unblockUser,
	blockGuild,
	unblockGuild,
	getCached,
	initialize,
	DEFAULTS,
};
