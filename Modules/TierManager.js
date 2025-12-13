/**
 * TierManager - Handles tier-based feature gating and subscription management
 *
 * IMPORTANT: Premium features are per-SERVER, not per-user.
 * All access checks should use serverId, not userId.
 *
 * This module provides utilities for:
 * - Checking if a server can access a specific feature
 * - Getting server's effective features (tier features + granted - revoked)
 * - Managing server tier assignments and subscription history
 * - Caching tier/feature configurations for performance
 */

// Lazy-load Redis to prevent startup crash if ioredis is not installed
let Redis = null;
try {
	Redis = require("../Database/Redis");
} catch (err) {
	// Redis module not available - will use in-memory cache only
}

// Cache for site settings (tiers/features)
let settingsCache = null;
let settingsCacheTime = 0;
// 1 minute cache TTL
const CACHE_TTL = 60000;
const REDIS_CACHE_KEY = "cache:site_settings";

/**
 * Get site settings with caching (Redis > in-memory > database)
 * @returns {Promise<Object>}
 */
const getSiteSettings = async () => {
	const now = Date.now();

	// Check in-memory cache first
	if (settingsCache && (now - settingsCacheTime) < CACHE_TTL) {
		return settingsCache;
	}

	// Try Redis cache if available
	if (Redis && Redis.isEnabled() && Redis.isReady()) {
		try {
			const client = Redis.getClient();
			const cached = await client.get(REDIS_CACHE_KEY);
			if (cached) {
				settingsCache = JSON.parse(cached);
				settingsCacheTime = now;
				return settingsCache;
			}
		} catch (err) {
			logger.warn("Redis getSiteSettings cache read failed", {}, err);
		}
	}

	// Fetch from database
	settingsCache = await SiteSettings.findOne("main");
	if (!settingsCache) {
		// Create default settings if none exist
		settingsCache = SiteSettings.new({ _id: "main" });
		await settingsCache.save();
		settingsCache = await SiteSettings.findOne("main");
	}
	settingsCacheTime = now;

	// Store in Redis cache if available
	if (Redis && Redis.isEnabled() && Redis.isReady() && settingsCache) {
		try {
			const client = Redis.getClient();
			// Cache for 60 seconds
			await client.setex(REDIS_CACHE_KEY, 60, JSON.stringify(settingsCache));
		} catch (err) {
			logger.warn("Redis getSiteSettings cache write failed", {}, err);
		}
	}

	return settingsCache;
};

/**
 * Invalidate the settings cache (call after updates)
 */
const invalidateCache = async () => {
	settingsCache = null;
	settingsCacheTime = 0;

	// Also invalidate Redis cache
	if (Redis && Redis.isEnabled() && Redis.isReady()) {
		try {
			await Redis.getClient().del(REDIS_CACHE_KEY);
		} catch (err) {
			logger.warn("Redis invalidateCache failed", {}, err);
		}
	}
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
 * Get server's subscription data
 * @param {string} serverId - Discord server/guild ID
 * @returns {Promise<Object|null>}
 */
const getServerSubscription = async serverId => {
	const server = await Servers.findOne(serverId);
	return server?.subscription || null;
};

/**
 * @deprecated Use getServerSubscription instead - premium is per-server
 */
const getUserSubscription = async userId => {
	const user = await Users.findOne(userId);
	return user?.subscription || null;
};

/**
 * Get server's current tier
 * @param {string} serverId - Discord server/guild ID
 * @returns {Promise<Object>}
 */
const getServerTier = async serverId => {
	const subscription = await getServerSubscription(serverId);
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
 * @deprecated Use getServerTier instead - premium is per-server
 */
const getUserTier = async userId => {
	const subscription = await getUserSubscription(userId);
	const tierId = subscription?.tier_id || "free";

	if (subscription?.expires_at && new Date(subscription.expires_at) < new Date()) {
		return getDefaultTier();
	}

	if (subscription && !subscription.is_active) {
		return getDefaultTier();
	}

	const tier = await getTier(tierId);
	if (tier) return tier;
	return getDefaultTier();
};

/**
 * Get server's effective features (tier features + granted - revoked)
 * @param {string} serverId - Discord server/guild ID
 * @returns {Promise<Set<string>>}
 */
const getServerFeatures = async serverId => {
	const server = await Servers.findOne(serverId);
	const subscription = server?.subscription || {};
	const tier = await getServerTier(serverId);

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
 * @deprecated Use getServerFeatures instead - premium is per-server
 */
const getUserFeatures = async userId => {
	const user = await Users.findOne(userId);
	const subscription = user?.subscription || {};
	const tier = await getUserTier(userId);

	const features = new Set(tier?.features || []);

	if (subscription.granted_features) {
		subscription.granted_features.forEach(f => features.add(f));
	}

	if (subscription.revoked_features) {
		subscription.revoked_features.forEach(f => features.delete(f));
	}

	return features;
};

/**
 * Check if a server can access a specific feature
 * @param {string} serverId - Discord server/guild ID
 * @param {string} featureKey - Feature ID to check
 * @returns {Promise<boolean>}
 */
const canAccess = async (serverId, featureKey) => {
	// Check if feature exists and is enabled globally
	const feature = await getFeature(featureKey);
	if (!feature || !feature.isEnabled) {
		return false;
	}

	const serverFeatures = await getServerFeatures(serverId);
	return serverFeatures.has(featureKey);
};

/**
 * Check if server has at least a certain tier level
 * @param {string} serverId - Discord server/guild ID
 * @param {number} requiredLevel - Minimum tier level required
 * @returns {Promise<boolean>}
 */
const hasMinimumTierLevel = async (serverId, requiredLevel) => {
	const tier = await getServerTier(serverId);
	return (tier?.level || 0) >= requiredLevel;
};

/**
 * Set server's tier
 * @param {string} serverId - Discord server/guild ID
 * @param {string} tierId - Tier ID to assign
 * @param {string} source - Source of assignment ('manual', 'stripe', etc.)
 * @param {Date|null} expiresAt - Expiration date (null for lifetime)
 * @param {string} reason - Reason for change
 * @param {string|null} purchasedBy - User ID who purchased this subscription
 * @returns {Promise<Object>}
 */
const setServerTier = async (serverId, tierId, source = "manual", expiresAt = null, reason = "assigned", purchasedBy = null) => {
	let server = await Servers.findOne(serverId);
	if (!server) {
		// Create server document if it doesn't exist
		server = Servers.new({ _id: serverId });
		await server.save();
		server = await Servers.findOne(serverId);
		if (!server) {
			logger.error("Failed to create server document for tier assignment", { serverId });
			return null;
		}
	}

	const oldSubscription = server.subscription || {};
	const now = new Date();

	// Build history array
	const history = oldSubscription.history || [];
	if (oldSubscription.tier_id && oldSubscription.tier_id !== tierId) {
		history.push({
			tier_id: oldSubscription.tier_id,
			source: oldSubscription.source,
			purchased_by: oldSubscription.purchased_by,
			started_at: oldSubscription.started_at,
			ended_at: now,
			reason: reason,
		});
	}

	// Build complete subscription object and set it at once
	const newSubscription = {
		tier_id: tierId,
		source: source,
		started_at: now,
		expires_at: expiresAt,
		is_active: true,
		purchased_by: purchasedBy || oldSubscription.purchased_by || null,
		granted_features: oldSubscription.granted_features || [],
		revoked_features: oldSubscription.revoked_features || [],
		history: history,
	};

	// Set entire subscription object at once for MariaDB compatibility
	server.query.set("subscription", newSubscription);

	await server.save();
	return server;
};

/**
 * @deprecated Use setServerTier instead - premium is per-server
 */
const setUserTier = async (userId, tierId, source = "manual", expiresAt = null, reason = "assigned") => {
	let user = await Users.findOne(userId);
	if (!user) {
		user = Users.new({ _id: userId });
	}

	const oldSubscription = user.subscription || {};
	const now = new Date();

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

	user.query.set("subscription.tier_id", tierId);
	user.query.set("subscription.source", source);
	user.query.set("subscription.started_at", now);
	user.query.set("subscription.expires_at", expiresAt);
	user.query.set("subscription.is_active", true);

	await user.save();
	return user;
};

/**
 * Grant a specific feature to a server
 * @param {string} serverId - Discord server/guild ID
 * @param {string} featureKey - Feature ID to grant
 * @returns {Promise<Object>}
 */
const grantFeature = async (serverId, featureKey) => {
	const server = await Servers.findOne(serverId);
	if (!server) {
		return null; // Server must exist
	}

	const oldSubscription = server.subscription || {};
	const granted = [...(oldSubscription.granted_features || [])];
	const revoked = [...(oldSubscription.revoked_features || [])];

	// Add to granted if not present
	if (!granted.includes(featureKey)) {
		granted.push(featureKey);
	}

	// Remove from revoked if present
	const revokedIndex = revoked.indexOf(featureKey);
	if (revokedIndex > -1) {
		revoked.splice(revokedIndex, 1);
	}

	// Set entire subscription object for MariaDB compatibility
	server.query.set("subscription", {
		...oldSubscription,
		granted_features: granted,
		revoked_features: revoked,
	});

	await server.save();
	return server;
};

/**
 * Revoke a specific feature from a server
 * @param {string} serverId - Discord server/guild ID
 * @param {string} featureKey - Feature ID to revoke
 * @returns {Promise<Object>}
 */
const revokeFeature = async (serverId, featureKey) => {
	const server = await Servers.findOne(serverId);
	if (!server) {
		return null; // Server must exist
	}

	const oldSubscription = server.subscription || {};
	const granted = [...(oldSubscription.granted_features || [])];
	const revoked = [...(oldSubscription.revoked_features || [])];

	// Add to revoked if not present
	if (!revoked.includes(featureKey)) {
		revoked.push(featureKey);
	}

	// Remove from granted if present
	const grantedIndex = granted.indexOf(featureKey);
	if (grantedIndex > -1) {
		granted.splice(grantedIndex, 1);
	}

	// Set entire subscription object for MariaDB compatibility
	server.query.set("subscription", {
		...oldSubscription,
		granted_features: granted,
		revoked_features: revoked,
	});

	await server.save();
	return server;
};

/**
 * Check and handle expired subscriptions for a server
 * @param {string} serverId - Discord server/guild ID
 * @returns {Promise<boolean>} - True if subscription was expired
 */
const checkExpiration = async serverId => {
	const server = await Servers.findOne(serverId);
	if (!server?.subscription) return false;

	const { expires_at, is_active } = server.subscription;

	if (is_active && expires_at && new Date(expires_at) < new Date()) {
		const defaultTier = await getDefaultTier();
		await setServerTier(serverId, defaultTier?._id || "free", "system", null, "expired");
		return true;
	}

	return false;
};

/**
 * Cancel server's subscription
 * @param {string} serverId - Discord server/guild ID
 * @param {string} reason - Reason for cancellation
 * @returns {Promise<Object>}
 */
const cancelSubscription = async (serverId, reason = "cancelled") => {
	const defaultTier = await getDefaultTier();
	return setServerTier(serverId, defaultTier?._id || "free", "system", null, reason);
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
 * Link a server's payment customer ID
 * @param {string} serverId - Discord server/guild ID
 * @param {string} provider - Payment provider
 * @param {string} customerId - Customer ID from provider
 * @returns {Promise<Object>}
 */
const linkPaymentCustomer = async (serverId, provider, customerId) => {
	const server = await Servers.findOne(serverId);
	if (!server) {
		return null; // Server must exist
	}

	const fieldMap = {
		stripe: "stripe_customer_id",
		paypal: "paypal_customer_id",
		btcpay: "btcpay_customer_id",
	};

	const field = fieldMap[provider];
	if (field) {
		// Set entire payment_ids object for MariaDB compatibility
		const oldPaymentIds = server.payment_ids || {};
		server.query.set("payment_ids", {
			...oldPaymentIds,
			[field]: customerId,
		});
		await server.save();
	}

	return server;
};

/**
 * Find server by payment customer ID
 * @param {string} provider - Payment provider
 * @param {string} customerId - Customer ID from provider
 * @returns {Promise<Object|null>}
 */
const findServerByPaymentCustomer = async (provider, customerId) => {
	const fieldMap = {
		stripe: "payment_ids.stripe_customer_id",
		paypal: "payment_ids.paypal_customer_id",
		btcpay: "payment_ids.btcpay_customer_id",
	};

	const field = fieldMap[provider];
	if (!field) return null;

	const servers = await Database.servers.find({ [field]: customerId }).exec();
	return servers?.[0] || null;
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

	// Server tier/feature checks (PRIMARY - premium is per-server)
	getServerTier,
	getServerFeatures,
	getServerSubscription,
	canAccess,
	hasMinimumTierLevel,

	// Server tier management
	setServerTier,
	grantFeature,
	revokeFeature,
	checkExpiration,
	cancelSubscription,

	// Provider configuration
	getOAuthProvider,
	getPaymentProvider,
	getTierByPaymentProduct,

	// Payment customer linking (server-level)
	linkPaymentCustomer,
	findServerByPaymentCustomer,

	// @deprecated - User-level functions kept for backward compatibility
	getUserTier,
	getUserFeatures,
	getUserSubscription,
	setUserTier,
};
