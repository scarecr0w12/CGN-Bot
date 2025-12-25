/**
 * ServerConfigHelper - Quick access to frequently accessed server config fields
 *
 * This module provides optimized getters for "hot" config paths that are accessed
 * frequently throughout the codebase. It reduces nested property access overhead
 * and provides sensible defaults.
 *
 * Usage:
 *   const ServerConfig = require('./Modules/ServerConfigHelper');
 *   const prefix = ServerConfig.getPrefix(serverDocument);
 *   const isModEnabled = ServerConfig.isModEnabled(serverDocument);
 */

// Default values for common config fields
const DEFAULTS = {
	PREFIX: "?",
	LANGUAGE: "en",
	MOD_LOG_ENABLED: false,
	MODERATION_ENABLED: false,
	POINTS_ENABLED: true,
	AFK_ENABLED: true,
	STARBOARD_ENABLED: false,
	STARBOARD_MIN_STARS: 3,
	AUTO_ESCALATION_ENABLED: false,
	SPAM_FILTER_ENABLED: false,
	INVITE_FILTER_ENABLED: false,
	MENTION_FILTER_ENABLED: false,
};

/**
 * Get command prefix for a server
 * @param {Object} serverDocument - Server document
 * @returns {string} Command prefix
 */
const getPrefix = (serverDocument) => serverDocument?.config?.commandPrefix || DEFAULTS.PREFIX;

/**
 * Get server language
 * @param {Object} serverDocument - Server document
 * @returns {string} Language code
 */
const getLanguage = (serverDocument) => serverDocument?.config?.language || DEFAULTS.LANGUAGE;

/**
 * Check if moderation is enabled
 * @param {Object} serverDocument - Server document
 * @returns {boolean}
 */
const isModEnabled = (serverDocument) => serverDocument?.config?.moderation?.isEnabled ?? DEFAULTS.MODERATION_ENABLED;

/**
 * Check if mod log is enabled
 * @param {Object} serverDocument - Server document
 * @returns {boolean}
 */
const isModLogEnabled = (serverDocument) => serverDocument?.config?.modlog?.isEnabled ?? DEFAULTS.MOD_LOG_ENABLED;

/**
 * Get mod log channel ID
 * @param {Object} serverDocument - Server document
 * @returns {string|null} Channel ID or null
 */
const getModLogChannel = (serverDocument) => {
	if (!isModLogEnabled(serverDocument)) return null;
	return serverDocument?.config?.modlog?.channelID || null;
};

/**
 * Check if points system is enabled
 * @param {Object} serverDocument - Server document
 * @returns {boolean}
 */
const isPointsEnabled = (serverDocument) => serverDocument?.config?.commands?.points?.isEnabled ?? DEFAULTS.POINTS_ENABLED;

/**
 * Check if AFK system is enabled
 * @param {Object} serverDocument - Server document
 * @returns {boolean}
 */
const isAfkEnabled = (serverDocument) => serverDocument?.config?.commands?.afk?.isEnabled ?? DEFAULTS.AFK_ENABLED;

/**
 * Check if starboard is enabled
 * @param {Object} serverDocument - Server document
 * @returns {boolean}
 */
const isStarboardEnabled = (serverDocument) => serverDocument?.config?.starboard?.isEnabled ?? DEFAULTS.STARBOARD_ENABLED;

/**
 * Get starboard configuration
 * @param {Object} serverDocument - Server document
 * @returns {Object} Starboard config with defaults
 */
const getStarboardConfig = (serverDocument) => {
	const starboard = serverDocument?.config?.starboard || {};
	return {
		isEnabled: starboard.isEnabled ?? DEFAULTS.STARBOARD_ENABLED,
		channelID: starboard.channelID || null,
		minStars: starboard.minStars ?? DEFAULTS.STARBOARD_MIN_STARS,
		selfStar: starboard.selfStar ?? false,
		ignoredChannels: starboard.ignoredChannels || [],
	};
};

/**
 * Check if auto-escalation is enabled
 * @param {Object} serverDocument - Server document
 * @returns {boolean}
 */
const isAutoEscalationEnabled = (serverDocument) => serverDocument?.config?.moderation?.autoEscalation?.isEnabled ?? DEFAULTS.AUTO_ESCALATION_ENABLED;

/**
 * Get auto-escalation thresholds
 * @param {Object} serverDocument - Server document
 * @returns {Array} Escalation thresholds
 */
const getEscalationThresholds = (serverDocument) => serverDocument?.config?.moderation?.autoEscalation?.thresholds || [];

/**
 * Check if spam filter is enabled
 * @param {Object} serverDocument - Server document
 * @returns {boolean}
 */
const isSpamFilterEnabled = (serverDocument) => {
	const filters = serverDocument?.config?.moderation?.filters || [];
	const spamFilter = filters.find(f => f.type === "spam");
	return spamFilter?.isEnabled ?? DEFAULTS.SPAM_FILTER_ENABLED;
};

/**
 * Check if invite filter is enabled
 * @param {Object} serverDocument - Server document
 * @returns {boolean}
 */
const isInviteFilterEnabled = (serverDocument) => {
	const filters = serverDocument?.config?.moderation?.filters || [];
	const inviteFilter = filters.find(f => f.type === "invites");
	return inviteFilter?.isEnabled ?? DEFAULTS.INVITE_FILTER_ENABLED;
};

/**
 * Check if mention spam filter is enabled
 * @param {Object} serverDocument - Server document
 * @returns {boolean}
 */
const isMentionFilterEnabled = (serverDocument) => {
	const filters = serverDocument?.config?.moderation?.filters || [];
	const mentionFilter = filters.find(f => f.type === "mentions");
	return mentionFilter?.isEnabled ?? DEFAULTS.MENTION_FILTER_ENABLED;
};

/**
 * Get a specific filter configuration
 * @param {Object} serverDocument - Server document
 * @param {string} filterType - Filter type (spam, invites, mentions, etc.)
 * @returns {Object|null} Filter config or null
 */
const getFilter = (serverDocument, filterType) => {
	const filters = serverDocument?.config?.moderation?.filters || [];
	return filters.find(f => f.type === filterType) || null;
};

/**
 * Get all active filters
 * @param {Object} serverDocument - Server document
 * @returns {Array} Active filter configurations
 */
const getActiveFilters = (serverDocument) => {
	const filters = serverDocument?.config?.moderation?.filters || [];
	return filters.filter(f => f.isEnabled);
};

/**
 * Get admin roles for a server
 * @param {Object} serverDocument - Server document
 * @returns {Array} Admin role configurations
 */
const getAdminRoles = (serverDocument) => serverDocument?.config?.admins || [];

/**
 * Get admin level for a specific role
 * @param {Object} serverDocument - Server document
 * @param {string} roleId - Discord role ID
 * @returns {number} Admin level (0 if not found)
 */
const getRoleAdminLevel = (serverDocument, roleId) => {
	const admins = getAdminRoles(serverDocument);
	const adminRole = admins.find(a => a._id === roleId);
	return adminRole?.level || 0;
};

/**
 * Check if a command is enabled
 * @param {Object} serverDocument - Server document
 * @param {string} commandName - Command name
 * @returns {boolean}
 */
const isCommandEnabled = (serverDocument, commandName) => {
	const cmd = serverDocument?.config?.commands?.[commandName];
	// If not configured, default to enabled
	return cmd?.isEnabled ?? true;
};

/**
 * Get command configuration
 * @param {Object} serverDocument - Server document
 * @param {string} commandName - Command name
 * @returns {Object} Command config with defaults
 */
const getCommandConfig = (serverDocument, commandName) => {
	const cmd = serverDocument?.config?.commands?.[commandName] || {};
	return {
		isEnabled: cmd.isEnabled ?? true,
		adminLevel: cmd.adminLevel ?? 0,
		allowedChannels: cmd.allowedChannels || [],
		cooldown: cmd.cooldown ?? 0,
	};
};

/**
 * Get welcome/leave message configuration
 * @param {Object} serverDocument - Server document
 * @param {string} type - 'welcome' or 'leave'
 * @returns {Object} Message config
 */
const getMessageConfig = (serverDocument, type) => {
	const config = serverDocument?.config?.[type] || {};
	return {
		isEnabled: config.isEnabled ?? false,
		channelID: config.channelID || null,
		message: config.message || "",
		dmEnabled: config.dmEnabled ?? false,
		dmMessage: config.dmMessage || "",
	};
};

/**
 * Get all hot config values at once for batch access
 * @param {Object} serverDocument - Server document
 * @returns {Object} All commonly accessed config values
 */
const getHotConfig = (serverDocument) => ({
	prefix: getPrefix(serverDocument),
	language: getLanguage(serverDocument),
	modEnabled: isModEnabled(serverDocument),
	modLogEnabled: isModLogEnabled(serverDocument),
	modLogChannel: getModLogChannel(serverDocument),
	pointsEnabled: isPointsEnabled(serverDocument),
	afkEnabled: isAfkEnabled(serverDocument),
	starboardEnabled: isStarboardEnabled(serverDocument),
	autoEscalation: isAutoEscalationEnabled(serverDocument),
	spamFilter: isSpamFilterEnabled(serverDocument),
	inviteFilter: isInviteFilterEnabled(serverDocument),
	mentionFilter: isMentionFilterEnabled(serverDocument),
});

module.exports = {
	// Defaults
	DEFAULTS,

	// Basic config
	getPrefix,
	getLanguage,

	// Moderation
	isModEnabled,
	isModLogEnabled,
	getModLogChannel,
	isAutoEscalationEnabled,
	getEscalationThresholds,

	// Filters
	isSpamFilterEnabled,
	isInviteFilterEnabled,
	isMentionFilterEnabled,
	getFilter,
	getActiveFilters,

	// Features
	isPointsEnabled,
	isAfkEnabled,
	isStarboardEnabled,
	getStarboardConfig,

	// Admin/Permissions
	getAdminRoles,
	getRoleAdminLevel,

	// Commands
	isCommandEnabled,
	getCommandConfig,

	// Messages
	getMessageConfig,

	// Batch access
	getHotConfig,
};
