/**
 * BrandingHelper - Manages bot branding based on tier features
 *
 * Premium users with the custom_branding feature can remove default
 * bot branding from embeds and messages.
 */

const TierManager = require("../TierManager");

// Default branding configuration
const DEFAULT_BRANDING = {
	footerText: "Powered by Skynet",
	footerIcon: null,
};

/**
 * Check if a server/user has custom branding enabled
 * @param {string} userId - The user ID to check (server owner or admin)
 * @returns {Promise<boolean>}
 */
const hasCustomBranding = async userId => TierManager.canAccess(userId, "custom_branding");

/**
 * Get the appropriate footer for an embed based on branding settings
 * @param {Object} serverDocument - The server document
 * @param {string} userId - The user ID to check for branding feature
 * @param {string} customText - Optional custom footer text
 * @returns {Promise<Object|null>} Footer object or null if branding disabled
 */
const getEmbedFooter = async (serverDocument, userId, customText = null) => {
	// Check if user has custom branding feature
	const hasBranding = await hasCustomBranding(userId);

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
 * @param {string} userId - The user ID to check for branding feature
 * @param {string} customText - Optional custom footer text
 * @returns {Promise<Object>} Modified embed object
 */
const applyBranding = async (embed, serverDocument, userId, customText = null) => {
	const footer = await getEmbedFooter(serverDocument, userId, customText);

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
 * @param {string} userId - The user ID for branding check
 * @returns {Promise<Object>} Embed object with branding applied
 */
const buildBrandedEmbed = async (options, serverDocument, userId) => {
	const embed = { ...options };
	const customFooterText = options.footer?.text || null;

	return applyBranding(embed, serverDocument, userId, customFooterText);
};

module.exports = {
	hasCustomBranding,
	getEmbedFooter,
	applyBranding,
	buildBrandedEmbed,
	DEFAULT_BRANDING,
};
