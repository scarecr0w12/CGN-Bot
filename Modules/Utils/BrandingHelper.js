/**
 * BrandingHelper - Manages bot branding based on tier features
 *
 * Premium servers with the custom_branding feature can remove default
 * bot branding from embeds and messages.
 */

const TierManager = require("../TierManager");

// Default branding configuration
const DEFAULT_BRANDING = {
	footerText: "Powered by Skynet",
	footerIcon: null,
};

/**
 * Check if a server has custom branding enabled
 * @param {string} serverId - The server ID to check
 * @returns {Promise<boolean>}
 */
const hasCustomBranding = async serverId => TierManager.canAccess(serverId, "custom_branding");

/**
 * Get the appropriate footer for an embed based on branding settings
 * @param {Object} serverDocument - The server document
 * @param {string} serverId - The server ID to check for branding feature
 * @param {string} customText - Optional custom footer text
 * @returns {Promise<Object|null>} Footer object or null if branding disabled
 */
const getEmbedFooter = async (serverDocument, serverId, customText = null) => {
	// Check if server has custom branding feature
	const hasBranding = await hasCustomBranding(serverId);

	if (hasBranding) {
		// Check server-level branding settings
		const brandingConfig = serverDocument?.config?.branding || {};

		if (brandingConfig.hideFooter) {
			return null;
		}

		if (brandingConfig.customFooter) {
			return { text: brandingConfig.customFooter };
		}

		// If custom branding enabled but no custom footer, return custom text only
		if (customText) {
			return { text: customText };
		}

		return null;
	}

	// Default branding for non-premium users
	if (customText) {
		return { text: `${customText} • ${DEFAULT_BRANDING.footerText}` };
	}

	return { text: DEFAULT_BRANDING.footerText };
};

/**
 * Apply branding to an embed object
 * @param {Object} embed - The embed object to modify
 * @param {Object} serverDocument - The server document
 * @param {string} serverId - The server ID to check for branding feature
 * @param {string} customText - Optional custom footer text
 * @returns {Promise<Object>} Modified embed object
 */
const applyBranding = async (embed, serverDocument, serverId, customText = null) => {
	const footer = await getEmbedFooter(serverDocument, serverId, customText);

	if (footer) {
		embed.footer = footer;
	} else if (embed.footer && !customText) {
		// Remove footer if branding disabled and no custom text
		delete embed.footer;
	}

	return embed;
};

/**
 * Build a branded embed with proper footer
 * @param {Object} options - Embed options
 * @param {Object} serverDocument - The server document
 * @param {string} serverId - The server ID for branding check
 * @returns {Promise<Object>} Embed object with branding applied
 */
const buildBrandedEmbed = async (options, serverDocument, serverId) => {
	const embed = { ...options };
	const customFooterText = options.footer?.text || null;

	return applyBranding(embed, serverDocument, serverId, customFooterText);
};

module.exports = {
	hasCustomBranding,
	getEmbedFooter,
	applyBranding,
	buildBrandedEmbed,
	DEFAULT_BRANDING,
};
