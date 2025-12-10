/**
 * FeatureFlags - Manages early access and experimental features
 *
 * Premium users with the `early_access` feature can opt-in to
 * beta features before they're released to everyone.
 */

const TierManager = require("../TierManager");

// Feature flag definitions
const FLAGS = {
	// Beta features
	NEW_AI_MODELS: {
		id: "new_ai_models",
		name: "New AI Models",
		description: "Access to latest AI models before general release",
		stage: "beta",
		requiresEarlyAccess: true,
	},
	ADVANCED_ANALYTICS_V2: {
		id: "advanced_analytics_v2",
		name: "Analytics Dashboard V2",
		description: "Redesigned analytics dashboard with more insights",
		stage: "beta",
		requiresEarlyAccess: true,
	},
	VOICE_TRANSCRIPTION: {
		id: "voice_transcription",
		name: "Voice Transcription",
		description: "Automatic transcription of voice messages",
		stage: "alpha",
		requiresEarlyAccess: true,
	},
	SCHEDULED_COMMANDS: {
		id: "scheduled_commands",
		name: "Scheduled Commands",
		description: "Schedule commands to run at specific times",
		stage: "beta",
		requiresEarlyAccess: true,
	},
	CUSTOM_EMBEDS_BUILDER: {
		id: "custom_embeds_builder",
		name: "Custom Embeds Builder",
		description: "Visual builder for custom embed messages",
		stage: "beta",
		requiresEarlyAccess: true,
	},

	// Stable features (available to all)
	LEGACY_COMMANDS: {
		id: "legacy_commands",
		name: "Legacy Command Support",
		description: "Support for legacy command format",
		stage: "stable",
		requiresEarlyAccess: false,
	},
};

// Feature stages
const STAGES = {
	ALPHA: "alpha",
	BETA: "beta",
	STABLE: "stable",
	DEPRECATED: "deprecated",
};

/**
 * Check if a user has early access feature
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>}
 */
const hasEarlyAccess = async userId => TierManager.canAccess(userId, "early_access");

/**
 * Check if a feature flag is enabled for a user
 * @param {string} userId - The user ID
 * @param {string} flagId - The feature flag ID
 * @param {Object} serverDocument - Optional server document for server-level overrides
 * @returns {Promise<boolean>}
 */
const isFeatureEnabled = async (userId, flagId, serverDocument = null) => {
	const flag = Object.values(FLAGS).find(f => f.id === flagId);
	if (!flag) return false;

	// Stable features are always available
	if (flag.stage === STAGES.STABLE) return true;

	// Deprecated features are never available
	if (flag.stage === STAGES.DEPRECATED) return false;

	// Check server-level override first
	if (serverDocument?.config?.feature_flags?.[flagId] === false) {
		return false;
	}

	// Check if feature requires early access
	if (flag.requiresEarlyAccess) {
		const hasAccess = await hasEarlyAccess(userId);
		if (!hasAccess) return false;
	}

	// Check if user has opted into this feature
	const userDocument = await Users.findOne(userId);
	const optedIn = userDocument?.feature_flags?.[flagId] !== false;

	return optedIn;
};

/**
 * Get all available features for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Object[]>} Array of features with availability status
 */
const getAvailableFeatures = async userId => {
	const earlyAccess = await hasEarlyAccess(userId);

	return Object.values(FLAGS).map(flag => ({
		...flag,
		available: flag.stage === STAGES.STABLE ||
			(flag.requiresEarlyAccess && earlyAccess) ||
			!flag.requiresEarlyAccess,
		enabled: flag.stage !== STAGES.DEPRECATED,
	}));
};

/**
 * Get beta/alpha features only
 * @param {string} userId - The user ID
 * @returns {Promise<Object[]>} Array of beta features
 */
const getBetaFeatures = async userId => {
	const allFeatures = await getAvailableFeatures(userId);
	return allFeatures.filter(f => f.stage === STAGES.ALPHA || f.stage === STAGES.BETA);
};

/**
 * Opt user into a feature
 * @param {string} userId - The user ID
 * @param {string} flagId - The feature flag ID
 * @returns {Promise<boolean>} Success status
 */
const optIntoFeature = async (userId, flagId) => {
	const flag = Object.values(FLAGS).find(f => f.id === flagId);
	if (!flag) return false;

	// Check access
	if (flag.requiresEarlyAccess) {
		const hasAccess = await hasEarlyAccess(userId);
		if (!hasAccess) return false;
	}

	const userDocument = await Users.findOne(userId);
	if (userDocument) {
		userDocument.query.set(`feature_flags.${flagId}`, true);
		await userDocument.save();
	}

	return true;
};

/**
 * Opt user out of a feature
 * @param {string} userId - The user ID
 * @param {string} flagId - The feature flag ID
 * @returns {Promise<boolean>} Success status
 */
const optOutOfFeature = async (userId, flagId) => {
	const userDocument = await Users.findOne(userId);
	if (userDocument) {
		userDocument.query.set(`feature_flags.${flagId}`, false);
		await userDocument.save();
	}

	return true;
};

/**
 * Decorator/wrapper for feature-flagged functionality
 * @param {string} flagId - The feature flag ID
 * @param {Function} fn - The function to wrap
 * @param {Function} fallback - Optional fallback function
 * @returns {Function} Wrapped function
 */
const withFeatureFlag = (flagId, fn, fallback = null) => async (...args) => {
	// Try to extract userId from args (assumes first arg has userId or author.id)
	const firstArg = args[0];
	const userId = firstArg?.author?.id || firstArg?.user?.id || firstArg?.userId || firstArg;

	if (typeof userId === "string") {
		const enabled = await isFeatureEnabled(userId, flagId);
		if (enabled) {
			return fn(...args);
		}
	}

	if (fallback) {
		return fallback(...args);
	}

	return null;
};

module.exports = {
	FLAGS,
	STAGES,
	hasEarlyAccess,
	isFeatureEnabled,
	getAvailableFeatures,
	getBetaFeatures,
	optIntoFeature,
	optOutOfFeature,
	withFeatureFlag,
};
