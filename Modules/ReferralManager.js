/**
 * ReferralManager - Handles server referral tracking and rewards
 * Users can share referral links to invite servers to add the bot
 * and earn Vote Points when servers join using their link
 */

const crypto = require("crypto");
const VoteRewardsManager = require("./VoteRewardsManager");

// Points awarded for different referral milestones
const REFERRAL_REWARDS = {
	// Points awarded immediately when a server joins via referral
	BASE_REFERRAL_POINTS: 50,
	// Bonus points if server is still active after 7 days
	RETENTION_BONUS_POINTS: 100,
	// Minimum server size for referral to count (prevents abuse)
	MIN_SERVER_MEMBERS: 10,
};

const ReferralManager = module.exports;

/**
 * Generate a unique referral code for a user
 * @param {string} userId - Discord user ID
 * @returns {Promise<string>} The generated or existing referral code
 */
ReferralManager.generateReferralCode = async userId => {
	let userDocument = await Users.findOne(userId);
	if (!userDocument) {
		userDocument = await Users.new({ _id: userId });
	}

	// Return existing code if user already has one
	if (userDocument.referrals?.referral_code) {
		return userDocument.referrals.referral_code;
	}

	// Generate a new unique code (8 characters, alphanumeric)
	const code = crypto.randomBytes(4).toString("hex").toUpperCase();

	// Initialize referrals object if it doesn't exist
	if (!userDocument.referrals) {
		userDocument.query.set("referrals", {
			referral_code: code,
			total_referrals: 0,
			total_points_earned: 0,
			referred_servers: [],
		});
	} else {
		userDocument.query.set("referrals.referral_code", code);
	}

	await userDocument.save();
	return code;
};

/**
 * Get referral code for a user (generates one if not exists)
 * @param {string} userId - Discord user ID
 * @returns {Promise<string>} The referral code
 */
ReferralManager.getReferralCode = async userId => {
	const userDocument = await Users.findOne(userId);
	if (userDocument?.referrals?.referral_code) {
		return userDocument.referrals.referral_code;
	}
	return ReferralManager.generateReferralCode(userId);
};

/**
 * Find user by referral code
 * @param {string} code - Referral code
 * @returns {Promise<Object|null>} User document or null
 */
ReferralManager.findUserByReferralCode = async code => {
	if (!code || typeof code !== "string") return null;

	const users = await Users.find({
		"referrals.referral_code": code.toUpperCase(),
	}).limit(1).exec();

	return users.length > 0 ? users[0] : null;
};

/**
 * Process a server joining via referral link
 * @param {Object} guild - Discord guild object
 * @param {string} referralCode - The referral code used
 * @returns {Promise<Object>} Result of the referral processing
 */
ReferralManager.processReferral = async (guild, referralCode) => {
	if (!referralCode) {
		return { success: false, reason: "no_code" };
	}

	// Find the referrer
	const referrerDocument = await ReferralManager.findUserByReferralCode(referralCode);
	if (!referrerDocument) {
		return { success: false, reason: "invalid_code" };
	}

	// Prevent self-referral (user can't refer their own server)
	if (guild.ownerId === referrerDocument._id) {
		return { success: false, reason: "self_referral" };
	}

	// Check if this server was already referred
	const existingReferral = referrerDocument.referrals?.referred_servers?.find(
		s => s._id === guild.id
	);
	if (existingReferral) {
		return { success: false, reason: "already_referred" };
	}

	// Check minimum server size (after a short delay to let member count populate)
	if (guild.memberCount < REFERRAL_REWARDS.MIN_SERVER_MEMBERS) {
		return { success: false, reason: "server_too_small", memberCount: guild.memberCount };
	}

	// Award points to referrer
	const pointsAwarded = REFERRAL_REWARDS.BASE_REFERRAL_POINTS;
	try {
		await VoteRewardsManager.addBalance(referrerDocument._id, pointsAwarded, "referral");
	} catch (err) {
		logger.warn("Failed to award referral points", { userId: referrerDocument._id }, err);
		return { success: false, reason: "points_error" };
	}

	// Record the referral
	const referralRecord = {
		_id: guild.id,
		server_name: guild.name,
		referred_at: new Date(),
		points_awarded: pointsAwarded,
		retention_bonus_awarded: false,
	};

	referrerDocument.query.push("referrals.referred_servers", referralRecord);
	referrerDocument.query.inc("referrals.total_referrals", 1);
	referrerDocument.query.inc("referrals.total_points_earned", pointsAwarded);

	await referrerDocument.save();

	logger.info("Referral processed successfully", {
		referrerId: referrerDocument._id,
		guildId: guild.id,
		guildName: guild.name,
		pointsAwarded,
	});

	return {
		success: true,
		referrerId: referrerDocument._id,
		pointsAwarded,
		serverName: guild.name,
	};
};

/**
 * Award retention bonus to referrer if server is still active after 7 days
 * Should be called by a scheduled job
 * @param {string} guildId - Discord guild ID
 * @returns {Promise<Object>} Result of the bonus processing
 */
ReferralManager.processRetentionBonus = async guildId => {
	// Find the referrer who referred this server
	const referrers = await Users.find({
		"referrals.referred_servers._id": guildId,
	}).exec();

	for (const referrerDocument of referrers) {
		const referral = referrerDocument.referrals?.referred_servers?.find(
			s => s._id === guildId
		);

		if (!referral || referral.retention_bonus_awarded) {
			continue;
		}

		// Check if 7 days have passed since referral
		const daysSinceReferral = (Date.now() - new Date(referral.referred_at).getTime()) / (1000 * 60 * 60 * 24);
		if (daysSinceReferral < 7) {
			continue;
		}

		// Award retention bonus
		const bonusPoints = REFERRAL_REWARDS.RETENTION_BONUS_POINTS;
		try {
			await VoteRewardsManager.addBalance(referrerDocument._id, bonusPoints, "referral_retention");
		} catch (err) {
			logger.warn("Failed to award retention bonus", { userId: referrerDocument._id }, err);
			continue;
		}

		// Update referral record
		referrerDocument.query.clone.id("referrals.referred_servers", guildId)
			.set("retention_bonus_awarded", true);
		referrerDocument.query.inc("referrals.total_points_earned", bonusPoints);

		await referrerDocument.save();

		logger.info("Retention bonus awarded", {
			referrerId: referrerDocument._id,
			guildId,
			bonusPoints,
		});
	}
};

/**
 * Get referral stats for a user
 * @param {string} userId - Discord user ID
 * @returns {Promise<Object>} Referral statistics
 */
ReferralManager.getReferralStats = async userId => {
	const userDocument = await Users.findOne(userId);

	if (!userDocument?.referrals) {
		return {
			referralCode: null,
			totalReferrals: 0,
			totalPointsEarned: 0,
			referredServers: [],
		};
	}

	return {
		referralCode: userDocument.referrals.referral_code,
		totalReferrals: userDocument.referrals.total_referrals || 0,
		totalPointsEarned: userDocument.referrals.total_points_earned || 0,
		referredServers: (userDocument.referrals.referred_servers || []).map(s => ({
			id: s._id,
			name: s.server_name,
			referredAt: s.referred_at,
			pointsAwarded: s.points_awarded,
			retentionBonusAwarded: s.retention_bonus_awarded,
		})),
	};
};

/**
 * Build referral invite URL
 * @param {string} code - Referral code
 * @param {string} clientId - Bot client ID
 * @returns {string} Full referral invite URL
 */
ReferralManager.buildReferralUrl = code => {
	const baseUrl = configJS.hostingURL.replace(/\/$/, "");
	return `${baseUrl}/invite/ref/${code}`;
};

/**
 * Get reward configuration
 * @returns {Object} Reward amounts
 */
ReferralManager.getRewardConfig = () => REFERRAL_REWARDS;
