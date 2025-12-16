/**
 * CreatorManager - Handles the Featured Creator program
 * Manages creator tiers, badges, and featured status
 */

// Creator tier thresholds
const TIER_THRESHOLDS = {
	bronze: { installs: 0, extensions: 0, rating: 0 },
	silver: { installs: 50, extensions: 2, rating: 3.5 },
	gold: { installs: 200, extensions: 5, rating: 4.0 },
	platinum: { installs: 500, extensions: 10, rating: 4.3 },
	diamond: { installs: 1000, extensions: 15, rating: 4.5 },
};

// Available creator badges
const CREATOR_BADGES = {
	first_extension: {
		id: "first_extension",
		name: "First Steps",
		icon: "fa-rocket",
		description: "Published your first extension",
	},
	popular_10: {
		id: "popular_10",
		name: "Rising Star",
		icon: "fa-star",
		description: "10+ total installs",
	},
	popular_100: {
		id: "popular_100",
		name: "Community Favorite",
		icon: "fa-fire",
		description: "100+ total installs",
	},
	popular_500: {
		id: "popular_500",
		name: "Extension Master",
		icon: "fa-crown",
		description: "500+ total installs",
	},
	highly_rated: {
		id: "highly_rated",
		name: "Quality Creator",
		icon: "fa-gem",
		description: "Average rating of 4.5+",
	},
	prolific: {
		id: "prolific",
		name: "Prolific Developer",
		icon: "fa-code",
		description: "Published 10+ extensions",
	},
	featured: {
		id: "featured",
		name: "Featured Creator",
		icon: "fa-award",
		description: "Recognized as a Featured Creator",
	},
	premium_seller: {
		id: "premium_seller",
		name: "Premium Seller",
		icon: "fa-dollar-sign",
		description: "Sold 10+ premium extensions",
	},
};

const CreatorManager = module.exports;

/**
 * Get creator status for a user
 * @param {string} userId - Discord user ID
 * @returns {Promise<Object>} Creator status
 */
CreatorManager.getCreatorStatus = async userId => {
	const userDocument = await Users.findOne(userId);
	if (!userDocument) {
		return {
			is_featured: false,
			tier: "bronze",
			badges: [],
			total_extensions: 0,
			total_installs: 0,
		};
	}

	return {
		is_featured: userDocument.creator_status?.is_featured || false,
		featured_at: userDocument.creator_status?.featured_at,
		featured_reason: userDocument.creator_status?.featured_reason,
		bonus_revenue_share: userDocument.creator_status?.bonus_revenue_share || 0,
		tier: userDocument.creator_status?.tier || "bronze",
		badges: userDocument.creator_status?.badges || [],
		total_extensions: userDocument.creator_status?.total_extensions || 0,
		total_installs: userDocument.creator_status?.total_installs || 0,
		total_ratings: userDocument.creator_status?.total_ratings || 0,
		average_rating: userDocument.creator_status?.average_rating || 0,
	};
};

/**
 * Set featured creator status
 * @param {string} userId - Target user ID
 * @param {boolean} isFeatured - Whether to feature or unfeature
 * @param {string} maintainerId - ID of maintainer making the change
 * @param {string} reason - Reason for featuring
 * @param {number} bonusShare - Bonus revenue share percentage (0-15)
 * @returns {Promise<Object>} Result
 */
CreatorManager.setFeaturedStatus = async (userId, isFeatured, maintainerId, reason = "", bonusShare = 5) => {
	let userDocument = await Users.findOne(userId);
	if (!userDocument) {
		userDocument = await Users.new({ _id: userId });
	}

	// Initialize creator_status if needed
	if (!userDocument.creator_status) {
		userDocument.query.set("creator_status", {
			is_featured: false,
			tier: "bronze",
			badges: [],
		});
	}

	userDocument.query.set("creator_status.is_featured", isFeatured);

	if (isFeatured) {
		userDocument.query.set("creator_status.featured_at", new Date());
		userDocument.query.set("creator_status.featured_by", maintainerId);
		userDocument.query.set("creator_status.featured_reason", reason);
		userDocument.query.set("creator_status.bonus_revenue_share", Math.min(15, Math.max(0, bonusShare)));

		// Award featured badge if not already earned
		await CreatorManager.awardBadge(userDocument, "featured");
	} else {
		userDocument.query.set("creator_status.bonus_revenue_share", 0);
	}

	await userDocument.save();

	logger.info("Updated featured creator status", {
		userId,
		isFeatured,
		maintainerId,
	});

	return { success: true, isFeatured };
};

/**
 * Update creator stats from their extensions
 * @param {string} userId - User ID to update
 * @returns {Promise<Object>} Updated stats
 */
CreatorManager.updateCreatorStats = async userId => {
	const userDocument = await Users.findOne(userId);
	if (!userDocument) {
		return null;
	}

	// Get all extensions by this user
	const extensions = await Gallery.find({
		owner_id: userId,
		state: "gallery",
	}).exec();

	let totalInstalls = 0;
	let totalRatings = 0;
	let ratingSum = 0;

	for (const ext of extensions) {
		// Count servers using this extension
		const installCount = await Servers.count({
			"extensions._id": ext._id.toString(),
		});
		totalInstalls += installCount;
		totalRatings += ext.points || 0;
		if (ext.points > 0) {
			ratingSum += ext.points;
		}
	}

	const averageRating = totalRatings > 0 ? ratingSum / extensions.length : 0;

	// Initialize creator_status if needed
	if (!userDocument.creator_status) {
		userDocument.query.set("creator_status", {
			is_featured: false,
			tier: "bronze",
			badges: [],
		});
	}

	userDocument.query.set("creator_status.total_extensions", extensions.length);
	userDocument.query.set("creator_status.total_installs", totalInstalls);
	userDocument.query.set("creator_status.total_ratings", totalRatings);
	userDocument.query.set("creator_status.average_rating", averageRating);

	// Calculate and update tier
	const newTier = CreatorManager.calculateTier(extensions.length, totalInstalls, averageRating);
	userDocument.query.set("creator_status.tier", newTier);

	// Check and award badges
	await CreatorManager.checkAndAwardBadges(userDocument, extensions.length, totalInstalls, averageRating);

	await userDocument.save();

	return {
		total_extensions: extensions.length,
		total_installs: totalInstalls,
		average_rating: averageRating,
		tier: newTier,
	};
};

/**
 * Calculate creator tier based on stats
 */
CreatorManager.calculateTier = (extensions, installs, rating) => {
	const tiers = ["diamond", "platinum", "gold", "silver", "bronze"];

	for (const tier of tiers) {
		const threshold = TIER_THRESHOLDS[tier];
		if (
			installs >= threshold.installs &&
			extensions >= threshold.extensions &&
			(rating >= threshold.rating || threshold.rating === 0)
		) {
			return tier;
		}
	}

	return "bronze";
};

/**
 * Check and award badges based on stats
 */
CreatorManager.checkAndAwardBadges = async (userDocument, extensions, installs, rating) => {
	const badgesToCheck = [
		{ id: "first_extension", condition: extensions >= 1 },
		{ id: "popular_10", condition: installs >= 10 },
		{ id: "popular_100", condition: installs >= 100 },
		{ id: "popular_500", condition: installs >= 500 },
		{ id: "highly_rated", condition: rating >= 4.5 && extensions >= 3 },
		{ id: "prolific", condition: extensions >= 10 },
	];

	for (const { id, condition } of badgesToCheck) {
		if (condition) {
			await CreatorManager.awardBadge(userDocument, id);
		}
	}
};

/**
 * Award a badge to a user
 */
CreatorManager.awardBadge = async (userDocument, badgeId) => {
	const badge = CREATOR_BADGES[badgeId];
	if (!badge) return false;

	const existingBadges = userDocument.creator_status?.badges || [];
	if (existingBadges.some(b => b._id === badgeId)) {
		return false; // Already has badge
	}

	userDocument.query.push("creator_status.badges", {
		_id: badge.id,
		name: badge.name,
		icon: badge.icon,
		earned_at: new Date(),
	});

	logger.debug("Awarded creator badge", { userId: userDocument._id, badgeId });
	return true;
};

/**
 * Get all featured creators
 * @param {number} limit - Max number to return
 * @returns {Promise<Array>} List of featured creators
 */
CreatorManager.getFeaturedCreators = async (limit = 10) => {
	const users = await Users.find({
		"creator_status.is_featured": true,
	}).limit(limit).exec();

	return users.map(u => ({
		id: u._id,
		username: u.username,
		featured_reason: u.creator_status?.featured_reason,
		tier: u.creator_status?.tier || "bronze",
		badges: u.creator_status?.badges || [],
		total_extensions: u.creator_status?.total_extensions || 0,
		total_installs: u.creator_status?.total_installs || 0,
	}));
};

/**
 * Get effective revenue share for a creator
 * Base is 70%, featured creators get bonus
 */
CreatorManager.getEffectiveRevenueShare = async userId => {
	const userDocument = await Users.findOne(userId);
	const baseShare = 70;
	const bonusShare = userDocument?.creator_status?.bonus_revenue_share || 0;

	return Math.min(85, baseShare + bonusShare);
};

/**
 * Get tier badge info
 */
CreatorManager.getTierInfo = tier => {
	const tierInfo = {
		bronze: { name: "Bronze Creator", color: "#cd7f32", icon: "fa-medal" },
		silver: { name: "Silver Creator", color: "#c0c0c0", icon: "fa-medal" },
		gold: { name: "Gold Creator", color: "#ffd700", icon: "fa-medal" },
		platinum: { name: "Platinum Creator", color: "#e5e4e2", icon: "fa-trophy" },
		diamond: { name: "Diamond Creator", color: "#b9f2ff", icon: "fa-gem" },
	};
	return tierInfo[tier] || tierInfo.bronze;
};

/**
 * Get all available badges info
 */
CreatorManager.getBadgeInfo = () => CREATOR_BADGES;

/**
 * Get tier thresholds
 */
CreatorManager.getTierThresholds = () => TIER_THRESHOLDS;
