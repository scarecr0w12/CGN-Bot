/**
 * ThemeHelper - Manages dashboard themes for premium users
 *
 * Premium users with the premium_dashboard feature can customize
 * their dashboard appearance with different themes.
 */

const TierManager = require("../TierManager");

// Available themes
const THEMES = {
	default: {
		id: "default",
		name: "Default",
		description: "Standard light theme",
		isPremium: false,
		colors: {
			primary: "#3273dc",
			secondary: "#209cee",
			background: "#ffffff",
			surface: "#f5f5f5",
			text: "#363636",
		},
	},
	dark: {
		id: "dark",
		name: "Dark Mode",
		description: "Easy on the eyes dark theme",
		isPremium: true,
		colors: {
			primary: "#7289da",
			secondary: "#99aab5",
			background: "#2c2f33",
			surface: "#23272a",
			text: "#ffffff",
		},
	},
	midnight: {
		id: "midnight",
		name: "Midnight Blue",
		description: "Deep blue premium theme",
		isPremium: true,
		colors: {
			primary: "#5865f2",
			secondary: "#4752c4",
			background: "#1a1a2e",
			surface: "#16213e",
			text: "#eaeaea",
		},
	},
	forest: {
		id: "forest",
		name: "Forest",
		description: "Nature-inspired green theme",
		isPremium: true,
		colors: {
			primary: "#2d6a4f",
			secondary: "#40916c",
			background: "#1b1f1b",
			surface: "#2d312d",
			text: "#d8f3dc",
		},
	},
	sunset: {
		id: "sunset",
		name: "Sunset",
		description: "Warm orange and purple theme",
		isPremium: true,
		colors: {
			primary: "#f72585",
			secondary: "#7209b7",
			background: "#1a1423",
			surface: "#2b1f38",
			text: "#ffecd2",
		},
	},
};

/**
 * Check if user has premium dashboard feature
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>}
 */
const hasPremiumDashboard = async userId => TierManager.canAccess(userId, "premium_dashboard");

/**
 * Get available themes for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Object[]>} Array of available themes
 */
const getAvailableThemes = async userId => {
	const hasPremium = await hasPremiumDashboard(userId);

	return Object.values(THEMES).map(theme => ({
		...theme,
		available: !theme.isPremium || hasPremium,
	}));
};

/**
 * Get user's current theme
 * @param {Object} userDocument - The user document
 * @param {string} userId - The user ID for premium check
 * @returns {Promise<Object>} Theme object
 */
const getUserTheme = async (userDocument, userId) => {
	const hasPremium = await hasPremiumDashboard(userId);
	const themeId = userDocument?.preferences?.theme || "default";

	// If user has a premium theme but no longer has premium, fall back to default
	const theme = THEMES[themeId];
	if (!theme || (theme.isPremium && !hasPremium)) {
		return THEMES.default;
	}

	return theme;
};

/**
 * Set user's theme preference
 * @param {Object} userQueryDocument - The user query document
 * @param {string} themeId - The theme ID
 * @param {string} userId - The user ID for premium check
 * @returns {Promise<boolean>} Success status
 */
const setUserTheme = async (userQueryDocument, themeId, userId) => {
	const theme = THEMES[themeId];
	if (!theme) return false;

	// Check if user can use this theme
	if (theme.isPremium) {
		const hasPremium = await hasPremiumDashboard(userId);
		if (!hasPremium) return false;
	}

	userQueryDocument.set("preferences.theme", themeId);
	return true;
};

/**
 * Generate CSS variables for a theme
 * @param {Object} theme - The theme object
 * @returns {string} CSS custom properties
 */
const generateThemeCSS = theme => {
	if (!theme?.colors) return "";

	return Object.entries(theme.colors)
		.map(([key, value]) => `--theme-${key}: ${value};`)
		.join("\n");
};

module.exports = {
	THEMES,
	hasPremiumDashboard,
	getAvailableThemes,
	getUserTheme,
	setUserTheme,
	generateThemeCSS,
};
