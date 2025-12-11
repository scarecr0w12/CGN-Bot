/**
 * VoteRewardsManager - Handles vote reward points system
 *
 * This is a SEPARATE system from economy/Skynet points.
 * Vote rewards are earned by voting on bot list sites and can be used to:
 * - Purchase premium tiers for servers
 * - Purchase premium extensions
 * - Can also be purchased directly with money
 */

const TierManager = require("./TierManager");
const crypto = require("crypto");

// Cache for vote rewards settings
let settingsCache = null;
let settingsCacheTime = 0;
const CACHE_TTL = 60000;

/**
 * Generate a unique transaction ID
 */
const generateTransactionId = () => `vrt_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

/**
 * Get vote rewards settings with caching
 */
const getSettings = async () => {
	const now = Date.now();
	if (settingsCache && (now - settingsCacheTime) < CACHE_TTL) {
		return settingsCache;
	}

	const siteSettings = await SiteSettings.findOne("main");
	settingsCache = siteSettings?.vote_rewards || {};
	settingsCacheTime = now;
	return settingsCache;
};

/**
 * Invalidate settings cache
 */
const invalidateCache = () => {
	settingsCache = null;
	settingsCacheTime = 0;
};

/**
 * Get user's vote rewards data
 * @param {string} userId
 * @returns {Promise<Object>}
 */
const getUserVoteRewards = async userId => {
	const user = await Users.findOne(userId);
	return user?.vote_rewards || {
		balance: 0,
		lifetime_earned: 0,
		lifetime_spent: 0,
		total_votes: 0,
		last_vote_at: null,
		site_votes: {},
	};
};

/**
 * Get user's vote rewards balance
 * @param {string} userId
 * @returns {Promise<number>}
 */
const getBalance = async userId => {
	const voteRewards = await getUserVoteRewards(userId);
	return voteRewards.balance || 0;
};

/**
 * Add points to user's vote rewards balance
 * @param {string} userId
 * @param {number} amount - Points to add
 * @param {string} type - Transaction type
 * @param {Object} metadata - Additional transaction metadata
 * @returns {Promise<Object>} Transaction record
 */
const addPoints = async (userId, amount, type, metadata = {}) => {
	if (amount <= 0) {
		throw new Error("Amount must be positive");
	}

	let user = await Users.findOne(userId);
	if (!user) {
		user = Users.new({ _id: userId });
		await user.save();
		user = await Users.findOne(userId);
	}

	const currentVoteRewards = user.vote_rewards || {
		balance: 0,
		lifetime_earned: 0,
		lifetime_spent: 0,
		total_votes: 0,
	};

	const newBalance = (currentVoteRewards.balance || 0) + amount;
	const newLifetimeEarned = (currentVoteRewards.lifetime_earned || 0) + amount;

	// Update user's vote rewards
	user.query.set("vote_rewards", {
		...currentVoteRewards,
		balance: newBalance,
		lifetime_earned: newLifetimeEarned,
	});
	await user.save();

	// Create transaction record
	const transactionId = generateTransactionId();
	const transaction = Database.VoteRewardTransactions.new({
		_id: transactionId,
		user_id: userId,
		type,
		amount,
		balance_after: newBalance,
		timestamp: new Date(),
		metadata,
	});
	await transaction.save();

	return {
		transactionId,
		amount,
		newBalance,
		type,
	};
};

/**
 * Deduct points from user's vote rewards balance
 * @param {string} userId
 * @param {number} amount - Points to deduct
 * @param {string} type - Transaction type
 * @param {Object} metadata - Additional transaction metadata
 * @returns {Promise<Object>} Transaction record
 */
const deductPoints = async (userId, amount, type, metadata = {}) => {
	if (amount <= 0) {
		throw new Error("Amount must be positive");
	}

	const user = await Users.findOne(userId);
	if (!user) {
		throw new Error("User not found");
	}

	const currentVoteRewards = user.vote_rewards || { balance: 0 };
	const currentBalance = currentVoteRewards.balance || 0;

	if (currentBalance < amount) {
		throw new Error("Insufficient vote rewards balance");
	}

	const newBalance = currentBalance - amount;
	const newLifetimeSpent = (currentVoteRewards.lifetime_spent || 0) + amount;

	// Update user's vote rewards
	user.query.set("vote_rewards", {
		...currentVoteRewards,
		balance: newBalance,
		lifetime_spent: newLifetimeSpent,
	});
	await user.save();

	// Create transaction record
	const transactionId = generateTransactionId();
	const transaction = Database.VoteRewardTransactions.new({
		_id: transactionId,
		user_id: userId,
		type,
		amount: -amount,
		balance_after: newBalance,
		timestamp: new Date(),
		metadata,
	});
	await transaction.save();

	return {
		transactionId,
		amount: -amount,
		newBalance,
		type,
	};
};

/**
 * Process a vote and award points
 * @param {string} userId
 * @param {string} site - Vote site (topgg, discordbotlist)
 * @param {boolean} isWeekend - Whether it's a weekend (bonus points)
 * @returns {Promise<Object>}
 */
const processVote = async (userId, site, isWeekend = false) => {
	const settings = await getSettings();

	if (!settings.isEnabled) {
		return { success: false, error: "Vote rewards disabled" };
	}

	// Calculate points
	let pointsToAward = settings.points_per_vote || 100;
	if (isWeekend) {
		pointsToAward *= settings.weekend_multiplier || 2;
	}

	// Update user's vote tracking
	let user = await Users.findOne(userId);
	if (!user) {
		user = Users.new({ _id: userId });
		await user.save();
		user = await Users.findOne(userId);
	}

	const currentVoteRewards = user.vote_rewards || {
		balance: 0,
		lifetime_earned: 0,
		lifetime_spent: 0,
		total_votes: 0,
		site_votes: {},
	};

	const now = new Date();
	const siteVotes = currentVoteRewards.site_votes || {};

	// Update site-specific last vote time
	if (site === "topgg") {
		siteVotes.topgg_last = now;
	} else if (site === "discordbotlist") {
		siteVotes.discordbotlist_last = now;
	}

	// Award points
	const transaction = await addPoints(userId, pointsToAward, "vote", {
		vote_site: site,
		is_weekend: isWeekend,
	});

	// Update vote count and last vote time
	user = await Users.findOne(userId);
	const updatedVoteRewards = user.vote_rewards || {};
	user.query.set("vote_rewards", {
		...updatedVoteRewards,
		total_votes: (updatedVoteRewards.total_votes || 0) + 1,
		last_vote_at: now,
		site_votes: siteVotes,
	});
	await user.save();

	return {
		success: true,
		pointsAwarded: pointsToAward,
		newBalance: transaction.newBalance,
		isWeekend,
		site,
	};
};

/**
 * Redeem points for a premium tier on a server
 * @param {string} userId - User redeeming points
 * @param {string} serverId - Server to apply tier to
 * @param {string} tierId - Tier to purchase
 * @param {number} durationDays - Duration in days
 * @returns {Promise<Object>}
 */
const redeemForTier = async (userId, serverId, tierId, durationDays) => {
	const settings = await getSettings();

	if (!settings.isEnabled || !settings.redemption?.isEnabled) {
		throw new Error("Vote rewards redemption is not enabled");
	}

	const { points_per_dollar, min_redemption_days, max_redemption_days } = settings.redemption;

	// Validate duration
	if (durationDays < (min_redemption_days || 7)) {
		throw new Error(`Minimum redemption is ${min_redemption_days || 7} days`);
	}
	if (durationDays > (max_redemption_days || 365)) {
		throw new Error(`Maximum redemption is ${max_redemption_days || 365} days`);
	}

	// Get tier info to calculate cost
	const tier = await TierManager.getTier(tierId);
	if (!tier) {
		throw new Error("Tier not found");
	}

	if (!tier.price_monthly || tier.price_monthly <= 0) {
		throw new Error("This tier is not available for point redemption");
	}

	// Calculate points cost
	// Monthly price / 30 days * durationDays * points_per_dollar
	const dailyPrice = tier.price_monthly / 30;
	const totalPrice = dailyPrice * durationDays;
	const pointsCost = Math.ceil(totalPrice * (points_per_dollar || 1000));

	// Check balance
	const balance = await getBalance(userId);
	if (balance < pointsCost) {
		throw new Error(`Insufficient balance. Need ${pointsCost} points, have ${balance}`);
	}

	// Deduct points
	const transaction = await deductPoints(userId, pointsCost, "redeem_tier", {
		server_id: serverId,
		tier_id: tierId,
		duration_days: durationDays,
	});

	// Apply tier to server
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + durationDays);

	await TierManager.setServerTier(serverId, tierId, "vote_rewards", expiresAt, "vote_redemption", userId);

	logger.info(`User ${userId} redeemed ${pointsCost} vote points for tier ${tierId} on server ${serverId} (${durationDays} days)`);

	return {
		success: true,
		pointsSpent: pointsCost,
		newBalance: transaction.newBalance,
		tierId,
		serverId,
		durationDays,
		expiresAt,
	};
};

/**
 * Purchase points with money (creates pending transaction, completed by webhook)
 * @param {string} userId
 * @param {number} amount - Dollar amount
 * @returns {Promise<Object>} Points that will be awarded
 */
const calculatePointsForPurchase = async amount => {
	const settings = await getSettings();
	const pointsPerDollar = settings.redemption?.points_per_dollar || 1000;
	return Math.floor(amount * pointsPerDollar);
};

/**
 * Complete a point purchase (called after payment confirmed)
 * @param {string} userId
 * @param {number} pointsAmount
 * @param {string} provider - Payment provider
 * @param {string} paymentId - Payment ID from provider
 * @param {number} amountPaid - Dollar amount paid
 * @param {string} currency - Currency code
 * @returns {Promise<Object>}
 */
const completePurchase = async (userId, pointsAmount, provider, paymentId, amountPaid, currency = "USD") => {
	const transaction = await addPoints(userId, pointsAmount, "purchase", {
		payment_provider: provider,
		payment_id: paymentId,
		amount_paid: amountPaid,
		currency,
	});

	logger.info(`User ${userId} purchased ${pointsAmount} vote points via ${provider} ($${amountPaid} ${currency})`);

	return {
		success: true,
		pointsAwarded: pointsAmount,
		newBalance: transaction.newBalance,
		paymentId,
	};
};

/**
 * Admin grant points to user
 * @param {string} userId
 * @param {number} amount
 * @param {string} adminId
 * @param {string} reason
 * @returns {Promise<Object>}
 */
const adminGrantPoints = async (userId, amount, adminId, reason = "") => {
	const transaction = await addPoints(userId, amount, "admin_grant", {
		admin_id: adminId,
		reason,
	});

	logger.info(`Admin ${adminId} granted ${amount} vote points to user ${userId}: ${reason}`);

	return transaction;
};

/**
 * Admin revoke points from user
 * @param {string} userId
 * @param {number} amount
 * @param {string} adminId
 * @param {string} reason
 * @returns {Promise<Object>}
 */
const adminRevokePoints = async (userId, amount, adminId, reason = "") => {
	const transaction = await deductPoints(userId, amount, "admin_revoke", {
		admin_id: adminId,
		reason,
	});

	logger.info(`Admin ${adminId} revoked ${amount} vote points from user ${userId}: ${reason}`);

	return transaction;
};

/**
 * Get user's transaction history
 * @param {string} userId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
const getTransactionHistory = async (userId, limit = 50) => Database.VoteRewardTransactions.find({ user_id: userId })
	.sort({ timestamp: -1 })
	.limit(limit)
	.exec();

/**
 * Get vote sites configuration for display
 * @returns {Promise<Array>}
 */
const getVoteSites = async () => {
	const siteSettings = await SiteSettings.findOne("main");
	const botLists = siteSettings?.bot_lists || {};
	const sites = [];

	if (botLists.topgg?.isEnabled) {
		sites.push({
			id: "topgg",
			name: "top.gg",
			url: `https://top.gg/bot/${process.env.CLIENT_ID}/vote`,
			icon: "https://top.gg/images/dblnew.png",
			cooldown: 12 * 60 * 60 * 1000, // 12 hours
		});
	}

	if (botLists.discordbotlist?.isEnabled) {
		sites.push({
			id: "discordbotlist",
			name: "Discord Bot List",
			url: `https://discordbotlist.com/bots/${process.env.CLIENT_ID}/upvote`,
			icon: "https://discordbotlist.com/icon.png",
			cooldown: 12 * 60 * 60 * 1000, // 12 hours
		});
	}

	return sites;
};

/**
 * Check if user can vote on a site (cooldown check)
 * @param {string} userId
 * @param {string} site
 * @returns {Promise<Object>}
 */
const canVote = async (userId, site) => {
	const voteRewards = await getUserVoteRewards(userId);
	const siteVotes = voteRewards.site_votes || {};

	const cooldown = 12 * 60 * 60 * 1000; // 12 hours
	let lastVote = null;

	if (site === "topgg") {
		lastVote = siteVotes.topgg_last;
	} else if (site === "discordbotlist") {
		lastVote = siteVotes.discordbotlist_last;
	}

	if (!lastVote) {
		return { canVote: true };
	}

	const timeSinceVote = Date.now() - new Date(lastVote).getTime();
	if (timeSinceVote >= cooldown) {
		return { canVote: true };
	}

	const timeRemaining = cooldown - timeSinceVote;
	return {
		canVote: false,
		timeRemaining,
		availableAt: new Date(Date.now() + timeRemaining),
	};
};

/**
 * Redeem points for a premium extension
 * @param {string} userId - User redeeming points
 * @param {string} extensionId - Extension to purchase
 * @returns {Promise<Object>}
 */
const redeemForExtension = async (userId, extensionId) => {
	const extension = await Database.Gallery.findOne(extensionId);
	if (!extension) {
		throw new Error("Extension not found");
	}

	if (!extension.premium?.is_premium) {
		throw new Error("This extension is not premium");
	}

	const pointsCost = extension.premium.price_points || 0;
	if (pointsCost <= 0) {
		throw new Error("Extension price not configured");
	}

	// Check if already purchased
	const purchasedBy = extension.purchased_by || [];
	if (purchasedBy.includes(userId)) {
		throw new Error("You have already purchased this extension");
	}

	// Check balance
	const balance = await getBalance(userId);
	if (balance < pointsCost) {
		throw new Error(`Insufficient balance. Need ${pointsCost} points, have ${balance}`);
	}

	// Deduct points
	const transaction = await deductPoints(userId, pointsCost, "redeem_extension", {
		extension_id: extensionId,
		extension_name: extension.name,
	});

	// Add user to purchased_by list
	purchasedBy.push(userId);
	extension.query.set("purchased_by", purchasedBy);
	extension.query.inc("premium.purchases", 1);
	await extension.save();

	logger.info(`User ${userId} purchased extension ${extensionId} (${extension.name}) for ${pointsCost} points`);

	return {
		success: true,
		pointsSpent: pointsCost,
		newBalance: transaction.newBalance,
		extensionId,
		extensionName: extension.name,
	};
};

/**
 * Check if user has purchased a premium extension
 * @param {string} userId
 * @param {string} extensionId
 * @returns {Promise<boolean>}
 */
const hasUserPurchasedExtension = async (userId, extensionId) => {
	const extension = await Database.Gallery.findOne(extensionId);
	if (!extension) return false;

	// Non-premium extensions are always accessible
	if (!extension.premium?.is_premium) return true;

	// Check if user is the owner
	if (extension.owner_id === userId) return true;

	// Check if user has purchased
	return (extension.purchased_by || []).includes(userId);
};

/**
 * Get leaderboard of top vote reward earners
 * @param {number} limit
 * @returns {Promise<Array>}
 */
const getLeaderboard = async (limit = 10) => {
	const users = await Users.find({ "vote_rewards.lifetime_earned": { $gt: 0 } })
		.sort({ "vote_rewards.lifetime_earned": -1 })
		.limit(limit)
		.exec();

	return users.map((u, index) => ({
		rank: index + 1,
		userId: u._id,
		username: u.username,
		lifetimeEarned: u.vote_rewards?.lifetime_earned || 0,
		totalVotes: u.vote_rewards?.total_votes || 0,
	}));
};

module.exports = {
	// Settings
	getSettings,
	invalidateCache,

	// Balance operations
	getUserVoteRewards,
	getBalance,
	addPoints,
	deductPoints,

	// Vote processing
	processVote,
	canVote,

	// Redemption
	redeemForTier,
	redeemForExtension,
	hasUserPurchasedExtension,

	// Purchases
	calculatePointsForPurchase,
	completePurchase,

	// Admin
	adminGrantPoints,
	adminRevokePoints,

	// History and stats
	getTransactionHistory,
	getVoteSites,
	getLeaderboard,
};
