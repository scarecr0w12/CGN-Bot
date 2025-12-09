/**
 * TierManager - Handles tier-based feature gating and subscription management
 *
 * This module provides utilities for:
 * - Checking if a user can access a specific feature
 * - Getting user's effective features (tier features + granted - revoked)
 * - Managing tier assignments and subscription history
 * - Caching tier/feature configurations for performance
 */

// Cache for site settings (tiers/features)
let settingsCache = null;
let settingsCacheTime = 0;
// 1 minute cache TTL
const CACHE_TTL = 60000;

/**
 * Get site settings with caching
 * @returns {Promise<Object>}
 */
const getSiteSettings = async () => {
	const now = Date.now();
	if (settingsCache && (now - settingsCacheTime) < CACHE_TTL) {
		return settingsCache;
	}

	settingsCache = await SiteSettings.findOne("main");
	if (!settingsCache) {
		// Create default settings if none exist
		settingsCache = SiteSettings.new({ _id: "main" });
		await settingsCache.save();
		settingsCache = await SiteSettings.findOne("main");
	}
	settingsCacheTime = now;
	return settingsCache;
};

/**
 * Invalidate the settings cache (call after updates)
 */
const invalidateCache = () => {
	settingsCache = null;
	settingsCacheTime = 0;
};

/**
 * Get all configured tiers
 * @returns {Promise<Array>}
 */
const getTiers = async () => {
	const settings = await getSiteSettings();
	return settings?.tiers || [];
};

/**
 * Get a specific tier by ID
 * @param {string} tierId
 * @returns {Promise<Object|null>}
 */
const getTier = async tierId => {
	const tiers = await getTiers();
	return tiers.find(t => t._id === tierId) || null;
};

/**
 * Get the default tier (usually "free")
 * @returns {Promise<Object|null>}
 */
const getDefaultTier = async () => {
	const tiers = await getTiers();
	return tiers.find(t => t.is_default) || tiers.find(t => t._id === "free") || null;
};

/**
 * Get all configured features
 * @returns {Promise<Array>}
 */
const getFeatures = async () => {
	const settings = await getSiteSettings();
	return settings?.features || [];
};

/**
 * Get a specific feature by ID
 * @param {string} featureId
 * @returns {Promise<Object|null>}
 */
const getFeature = async featureId => {
	const features = await getFeatures();
	return features.find(f => f._id === featureId) || null;
};

/**
 * Get user's subscription data
 * @param {string} userId - Discord user ID
 * @returns {Promise<Object|null>}
 */
const getUserSubscription = async userId => {
	const user = await Users.findOne(userId);
	return user?.subscription || null;
};

/**
 * Get user's current tier
 * @param {string} userId - Discord user ID
 * @returns {Promise<Object>}
 */
const getUserTier = async userId => {
	const subscription = await getUserSubscription(userId);
	const tierId = subscription?.tier_id || "free";

	// Check if subscription is expired
	if (subscription?.expires_at && new Date(subscription.expires_at) < new Date()) {
		return getDefaultTier();
	}

	// Check if subscription is active
	if (subscription && !subscription.is_active) {
		return getDefaultTier();
	}

	const tier = await getTier(tierId);
	if (tier) return tier;
	return getDefaultTier();
};

/**
 * Get user's effective features (tier features + granted - revoked)
 * @param {string} userId - Discord user ID
 * @returns {Promise<Set<string>>}
 */
const getUserFeatures = async userId => {
	const user = await Users.findOne(userId);
	const subscription = user?.subscription || {};
	const tier = await getUserTier(userId);

	// Start with tier features
	const features = new Set(tier?.features || []);

	// Add granted features
	if (subscription.granted_features) {
		subscription.granted_features.forEach(f => features.add(f));
	}

	// Remove revoked features
	if (subscription.revoked_features) {
		subscription.revoked_features.forEach(f => features.delete(f));
	}

	return features;
};

/**
 * Check if user can access a specific feature
 * @param {string} userId - Discord user ID
 * @param {string} featureKey - Feature ID to check
 * @returns {Promise<boolean>}
 */
const canAccess = async (userId, featureKey) => {
	// Check if feature exists and is enabled globally
	const feature = await getFeature(featureKey);
	if (!feature || !feature.isEnabled) {
		return false;
	}

	const userFeatures = await getUserFeatures(userId);
	return userFeatures.has(featureKey);
};

/**
 * Check if user has at least a certain tier level
 * @param {string} userId - Discord user ID
 * @param {number} requiredLevel - Minimum tier level required
 * @returns {Promise<boolean>}
 */
const hasMinimumTierLevel = async (userId, requiredLevel) => {
	const tier = await getUserTier(userId);
	return (tier?.level || 0) >= requiredLevel;
};

/**
 * Set user's tier
 * @param {string} userId - Discord user ID
 * @param {string} tierId - Tier ID to assign
 * @param {string} source - Source of assignment ('manual', 'stripe', etc.)
 * @param {Date|null} expiresAt - Expiration date (null for lifetime)
 * @param {string} reason - Reason for change
 * @returns {Promise<Object>}
 */
const setUserTier = async (userId, tierId, source = "manual", expiresAt = null, reason = "assigned") => {
	let user = await Users.findOne(userId);
	if (!user) {
		user = Users.new({ _id: userId });
	}

	const oldSubscription = user.subscription || {};
	const now = new Date();

	// Add to history if there was a previous tier
	if (oldSubscription.tier_id && oldSubscription.tier_id !== tierId) {
		const historyEntry = {
			tier_id: oldSubscription.tier_id,
			source: oldSubscription.source,
			started_at: oldSubscription.started_at,
			ended_at: now,
			reason: reason,
		};

		const history = oldSubscription.history || [];
		history.push(historyEntry);
		user.query.set("subscription.history", history);
	}

	// Update subscription
	user.query.set("subscription.tier_id", tierId);
	user.query.set("subscription.source", source);
	user.query.set("subscription.started_at", now);
	user.query.set("subscription.expires_at", expiresAt);
	user.query.set("subscription.is_active", true);

	await user.save();
	return user;
};

/**
 * Grant a specific feature to a user
 * @param {string} userId - Discord user ID
 * @param {string} featureKey - Feature ID to grant
 * @returns {Promise<Object>}
 */
const grantFeature = async (userId, featureKey) => {
	let user = await Users.findOne(userId);
	if (!user) {
		user = Users.new({ _id: userId });
	}

	const granted = user.subscription?.granted_features || [];
	if (!granted.includes(featureKey)) {
		granted.push(featureKey);
		user.query.set("subscription.granted_features", granted);
	}

	// Remove from revoked if present
	const revoked = user.subscription?.revoked_features || [];
	const revokedIndex = revoked.indexOf(featureKey);
	if (revokedIndex > -1) {
		revoked.splice(revokedIndex, 1);
		user.query.set("subscription.revoked_features", revoked);
	}

	await user.save();
	return user;
};

/**
 * Revoke a specific feature from a user
 * @param {string} userId - Discord user ID
 * @param {string} featureKey - Feature ID to revoke
 * @returns {Promise<Object>}
 */
const revokeFeature = async (userId, featureKey) => {
	let user = await Users.findOne(userId);
	if (!user) {
		user = Users.new({ _id: userId });
	}

	const revoked = user.subscription?.revoked_features || [];
	if (!revoked.includes(featureKey)) {
		revoked.push(featureKey);
		user.query.set("subscription.revoked_features", revoked);
	}

	// Remove from granted if present
	const granted = user.subscription?.granted_features || [];
	const grantedIndex = granted.indexOf(featureKey);
	if (grantedIndex > -1) {
		granted.splice(grantedIndex, 1);
		user.query.set("subscription.granted_features", granted);
	}

	await user.save();
	return user;
};

/**
 * Check and handle expired subscriptions for a user
 * @param {string} userId - Discord user ID
 * @returns {Promise<boolean>} - True if subscription was expired
 */
const checkExpiration = async userId => {
	const user = await Users.findOne(userId);
	if (!user?.subscription) return false;

	const { expires_at, is_active } = user.subscription;

	if (is_active && expires_at && new Date(expires_at) < new Date()) {
		const defaultTier = await getDefaultTier();
		await setUserTier(userId, defaultTier?._id || "free", "system", null, "expired");
		return true;
	}

	return false;
};

/**
 * Cancel user's subscription
 * @param {string} userId - Discord user ID
 * @param {string} reason - Reason for cancellation
 * @returns {Promise<Object>}
 */
const cancelSubscription = async (userId, reason = "cancelled") => {
	const defaultTier = await getDefaultTier();
	return setUserTier(userId, defaultTier?._id || "free", "manual", null, reason);
};

/**
 * Get OAuth provider configuration
 * @param {string} provider - Provider name ('google', 'github', 'twitch', 'patreon')
 * @returns {Promise<Object|null>}
 */
const getOAuthProvider = async provider => {
	const settings = await getSiteSettings();
	return settings?.oauth_providers?.[provider] || null;
};

/**
 * Get payment provider configuration
 * @param {string} provider - Provider name ('stripe', 'paypal', 'btcpay')
 * @returns {Promise<Object|null>}
 */
const getPaymentProvider = async provider => {
	const settings = await getSiteSettings();
	return settings?.payment_providers?.[provider] || null;
};

/**
 * Find tier by payment product/plan ID
 * @param {string} provider - Provider name
 * @param {string} productId - Product or plan ID from provider
 * @returns {Promise<Object|null>}
 */
const getTierByPaymentProduct = async (provider, productId) => {
	const paymentProvider = await getPaymentProvider(provider);
	if (!paymentProvider) return null;

	let mapping;
	if (provider === "stripe") {
		mapping = paymentProvider.product_mapping?.find(m => m._id === productId || m.stripe_price_id === productId);
	} else if (provider === "paypal") {
		mapping = paymentProvider.plan_mapping?.find(m => m._id === productId);
	}

	if (mapping?.tier_id) {
		return getTier(mapping.tier_id);
	}

	return null;
};

/**
 * Link a user's payment customer ID
 * @param {string} userId - Discord user ID
 * @param {string} provider - Payment provider
 * @param {string} customerId - Customer ID from provider
 * @returns {Promise<Object>}
 */
const linkPaymentCustomer = async (userId, provider, customerId) => {
	let user = await Users.findOne(userId);
	if (!user) {
		user = Users.new({ _id: userId });
	}

	const fieldMap = {
		stripe: "stripe_customer_id",
		paypal: "paypal_customer_id",
		btcpay: "btcpay_customer_id",
	};

	const field = fieldMap[provider];
	if (field) {
		user.query.set(`payment_ids.${field}`, customerId);
		await user.save();
	}

	return user;
};

/**
 * Find user by payment customer ID
 * @param {string} provider - Payment provider
 * @param {string} customerId - Customer ID from provider
 * @returns {Promise<Object|null>}
 */
const findUserByPaymentCustomer = async (provider, customerId) => {
	const fieldMap = {
		stripe: "payment_ids.stripe_customer_id",
		paypal: "payment_ids.paypal_customer_id",
		btcpay: "payment_ids.btcpay_customer_id",
	};

	const field = fieldMap[provider];
	if (!field) return null;

	// This would need a custom query implementation
	// For now, we'll need to handle this at the Database level
	const users = await Database.users.find({ [field]: customerId });
	return users?.[0] || null;
};

module.exports = {
	// Cache management
	invalidateCache,

	// Tier/Feature retrieval
	getSiteSettings,
	getTiers,
	getTier,
	getDefaultTier,
	getFeatures,
	getFeature,

	// User tier/feature checks
	getUserTier,
	getUserFeatures,
	getUserSubscription,
	canAccess,
	hasMinimumTierLevel,

	// User tier management
	setUserTier,
	grantFeature,
	revokeFeature,
	checkExpiration,
	cancelSubscription,

	// Provider configuration
	getOAuthProvider,
	getPaymentProvider,
	getTierByPaymentProduct,

	// Payment customer linking
	linkPaymentCustomer,
	findUserByPaymentCustomer,
};
