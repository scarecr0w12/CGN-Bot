/**
 * Points/Economy Module for Extensions
 * Provides read and write access to server economy/points data
 * @module Points
 */

const { Scopes } = require("../../../Constants");
const SkynetError = require("../../Errors/SkynetError");

/**
 * Creates a Points module instance for an extension
 * @param {Object} context - Extension execution context
 * @param {Array} scopes - Extension scopes
 * @returns {Object} Points module API
 */
module.exports = function createPointsModule (context, scopes) {
	const { serverDocument, msg } = context;

	// Check for required scopes
	const hasReadScope = scopes.includes(Scopes.members_read.scope);
	const hasWriteScope = scopes.includes(Scopes.economy_manage.scope);

	// Constants for limits
	const MAX_POINTS_PER_ACTION = 10000;
	const MIN_POINTS = 0;

	/**
	 * Get member data from server document
	 * @param {string} userId - User ID to look up
	 * @returns {Object|null} Member document or null
	 * @private
	 */
	const getMemberDoc = userId => {
		if (!serverDocument || !serverDocument.members) return null;
		return serverDocument.members.id ? serverDocument.members.id(userId) : serverDocument.members.find(m => m._id === userId);
	};

	/**
	 * Get current user's member document
	 * @returns {Object|null}
	 * @private
	 */
	const getCurrentMember = () => {
		if (!msg || !msg.author) return null;
		return getMemberDoc(msg.author.id);
	};

	/**
	 * Serialize member points data
	 * @param {Object} memberDoc - Member document
	 * @param {string} [userId] - User ID
	 * @returns {Object} Serialized points data
	 * @private
	 */
	const serializeMemberPoints = (memberDoc, userId) => {
		if (!memberDoc) {
			return {
				userId: userId || null,
				rankScore: 0,
				messages: 0,
				voice: 0,
				rank: "No Rank",
				found: false,
			};
		}

		return {
			userId: memberDoc._id,
			rankScore: memberDoc.rank_score || 0,
			messages: memberDoc.messages || 0,
			voice: memberDoc.voice || 0,
			rank: memberDoc.rank || "No Rank",
			found: true,
		};
	};

	/**
	 * Get ranks configuration
	 * @returns {Array} Ranks list
	 * @private
	 */
	const getRanksConfig = () => {
		if (!serverDocument || !serverDocument.config || !serverDocument.config.ranks_list) {
			return [];
		}
		return serverDocument.config.ranks_list.map(r => ({
			name: r._id,
			maxScore: r.max_score,
			roleId: r.role_id || null,
		})).sort((a, b) => a.maxScore - b.maxScore);
	};

	/**
	 * Calculate rank position on server leaderboard
	 * @param {number} score - User's rank score
	 * @returns {number} Position (1-indexed)
	 * @private
	 */
	const calculatePosition = score => {
		if (!serverDocument || !serverDocument.members) return 1;

		const members = Array.isArray(serverDocument.members) ?
			serverDocument.members :
			Object.values(serverDocument.members);

		return members.filter(m => (m.rank_score || 0) > score).length + 1;
	};

	return {
		/**
		 * Check if economy/points system is enabled on this server
		 * @returns {boolean}
		 */
		get isEnabled () {
			if (!serverDocument || !serverDocument.config || !serverDocument.config.commands) {
				return false;
			}
			const pointsCmd = serverDocument.config.commands.points;
			return pointsCmd ?
				pointsCmd.isEnabled !== false :
				true;
		},

		/**
		 * Get the current user's points data
		 * @returns {Object} Points data for current user
		 * @throws {SkynetError} If missing scope
		 */
		getSelf () {
			if (!hasReadScope) throw new SkynetError("MISSING_SCOPES", "members_read");

			const memberDoc = getCurrentMember();
			const data = serializeMemberPoints(memberDoc, msg?.author?.id);
			data.position = calculatePosition(data.rankScore);
			return data;
		},

		/**
		 * Get points data for a specific user
		 * @param {string} userId - User ID to look up
		 * @returns {Object} Points data for the user
		 * @throws {SkynetError} If missing scope
		 */
		getUser (userId) {
			if (!hasReadScope) throw new SkynetError("MISSING_SCOPES", "members_read");
			if (!userId || typeof userId !== "string") {
				throw new SkynetError("INVALID_PARAMETER", "userId must be a string");
			}

			const memberDoc = getMemberDoc(userId);
			const data = serializeMemberPoints(memberDoc, userId);
			data.position = calculatePosition(data.rankScore);
			return data;
		},

		/**
		 * Get the server leaderboard (top users by rank score)
		 * @param {number} [limit=10] - Maximum number of entries
		 * @returns {Array<Object>} Leaderboard entries
		 * @throws {SkynetError} If missing scope
		 */
		getLeaderboard (limit = 10) {
			if (!hasReadScope) throw new SkynetError("MISSING_SCOPES", "members_read");

			if (!serverDocument || !serverDocument.members) {
				return [];
			}

			// Ensure limit is reasonable
			const safeLimit = Math.min(Math.max(1, limit), 100);

			const members = Array.isArray(serverDocument.members) ?
				serverDocument.members :
				Object.values(serverDocument.members);

			const sorted = members
				.filter(m => m && m._id)
				.map(m => ({
					userId: m._id,
					rankScore: m.rank_score || 0,
					messages: m.messages || 0,
					voice: m.voice || 0,
					rank: m.rank || "No Rank",
				}))
				.sort((a, b) => b.rankScore - a.rankScore)
				.slice(0, safeLimit);

			return sorted.map((entry, index) => ({
				...entry,
				position: index + 1,
			}));
		},

		/**
		 * Get all configured ranks for this server
		 * @returns {Array<Object>} Ranks configuration
		 */
		getRanks () {
			return getRanksConfig();
		},

		/**
		 * Get the rank name for a given score
		 * @param {number} score - The rank score
		 * @returns {string} Rank name
		 */
		getRankForScore (score) {
			const ranks = getRanksConfig();
			if (ranks.length === 0) return "No Rank";

			// Find the highest rank the score qualifies for
			let currentRank = "No Rank";
			for (const rank of ranks) {
				if (score <= rank.maxScore) {
					currentRank = rank.name;
					break;
				}
				currentRank = rank.name;
			}
			return currentRank;
		},

		/**
		 * Get points required for next rank
		 * @param {number} currentScore - Current rank score
		 * @returns {Object} Next rank info or null if at max
		 */
		getNextRank (currentScore) {
			const ranks = getRanksConfig();
			if (ranks.length === 0) return null;

			for (const rank of ranks) {
				if (currentScore < rank.maxScore) {
					return {
						name: rank.name,
						scoreRequired: rank.maxScore,
						pointsNeeded: rank.maxScore - currentScore,
						roleId: rank.roleId,
					};
				}
			}

			// Already at max rank
			return null;
		},

		/**
		 * Get total member count with points data
		 * @returns {number} Total members
		 */
		getTotalMembers () {
			if (!serverDocument || !serverDocument.members) return 0;

			const members = Array.isArray(serverDocument.members) ?
				serverDocument.members :
				Object.values(serverDocument.members);

			return members.filter(m => m && m._id).length;
		},

		/**
		 * Get member IDs with points data (for batch operations like season reset)
		 * @param {number} [limit=250] - Maximum number of member IDs to return
		 * @returns {Array<string>} Array of member user IDs
		 * @throws {SkynetError} If missing scope
		 */
		getMemberIds (limit = 250) {
			if (!hasReadScope) throw new SkynetError("MISSING_SCOPES", "members_read");

			if (!serverDocument || !serverDocument.members) return [];

			const safeLimit = Math.min(Math.max(1, limit), 500);

			const members = Array.isArray(serverDocument.members) ?
				serverDocument.members :
				Object.values(serverDocument.members);

			return members
				.filter(m => m && m._id)
				.map(m => m._id)
				.slice(0, safeLimit);
		},

		/**
		 * Get server economy statistics
		 * @returns {Object} Economy stats
		 * @throws {SkynetError} If missing scope
		 */
		getStats () {
			if (!hasReadScope) throw new SkynetError("MISSING_SCOPES", "members_read");

			if (!serverDocument || !serverDocument.members) {
				return {
					totalMembers: 0,
					totalRankScore: 0,
					totalMessages: 0,
					totalVoice: 0,
					averageRankScore: 0,
					ranksConfigured: 0,
				};
			}

			const members = Array.isArray(serverDocument.members) ?
				serverDocument.members :
				Object.values(serverDocument.members);

			const validMembers = members.filter(m => m && m._id);
			const totalRankScore = validMembers.reduce((sum, m) => sum + (m.rank_score || 0), 0);
			const totalMessages = validMembers.reduce((sum, m) => sum + (m.messages || 0), 0);
			const totalVoice = validMembers.reduce((sum, m) => sum + (m.voice || 0), 0);

			return {
				totalMembers: validMembers.length,
				totalRankScore,
				totalMessages,
				totalVoice,
				averageRankScore: validMembers.length > 0 ?
					Math.round(totalRankScore / validMembers.length) :
					0,
				ranksConfigured: getRanksConfig().length,
			};
		},

		/**
		 * Check if a user exists in the points system
		 * @param {string} userId - User ID to check
		 * @returns {boolean} Whether user has points data
		 */
		hasUser (userId) {
			if (!hasReadScope) throw new SkynetError("MISSING_SCOPES", "members_read");
			const memberDoc = getMemberDoc(userId);
			return memberDoc !== null && memberDoc !== undefined;
		},

		/**
		 * Compare two users' rank scores
		 * @param {string} userId1 - First user ID
		 * @param {string} userId2 - Second user ID
		 * @returns {Object} Comparison result
		 * @throws {SkynetError} If missing scope
		 */
		compare (userId1, userId2) {
			if (!hasReadScope) throw new SkynetError("MISSING_SCOPES", "members_read");

			const user1 = this.getUser(userId1);
			const user2 = this.getUser(userId2);

			const diff = user1.rankScore - user2.rankScore;
			let winner = null;
			if (diff > 0) winner = userId1;
			else if (diff < 0) winner = userId2;

			return {
				user1,
				user2,
				difference: Math.abs(diff),
				winner,
				isTie: diff === 0,
			};
		},

		// ==================== WRITE METHODS ====================

		/**
		 * Check if extension has write access to economy
		 * @returns {boolean}
		 */
		get canWrite () {
			return hasWriteScope;
		},

		/**
		 * Add points to a user's rank score
		 * @param {string} userId - User ID to add points to
		 * @param {number} amount - Amount of points to add (1-10000)
		 * @param {string} [reason] - Optional reason for the change
		 * @returns {Object} Result with new balance
		 * @throws {SkynetError} If missing scope or invalid parameters
		 */
		addPoints (userId, amount, reason = "Extension") {
			if (!hasWriteScope) throw new SkynetError("MISSING_SCOPES", "economy_manage");
			if (!userId || typeof userId !== "string") {
				throw new SkynetError("INVALID_PARAMETER", "userId must be a string");
			}
			if (typeof amount !== "number" || isNaN(amount)) {
				throw new SkynetError("INVALID_PARAMETER", "amount must be a number");
			}
			if (amount <= 0) {
				throw new SkynetError("INVALID_PARAMETER", "amount must be positive");
			}
			if (amount > MAX_POINTS_PER_ACTION) {
				throw new SkynetError("INVALID_PARAMETER", `amount cannot exceed ${MAX_POINTS_PER_ACTION}`);
			}

			// Get or create member document
			let memberDoc = getMemberDoc(userId);
			if (!memberDoc) {
				// Create new member entry
				if (serverDocument.members.id) {
					serverDocument.members.push({ _id: userId, rank_score: 0 });
					memberDoc = serverDocument.members.id(userId);
				} else {
					serverDocument.members[userId] = { _id: userId, rank_score: 0 };
					memberDoc = serverDocument.members[userId];
				}
			}

			const oldScore = memberDoc.rank_score || 0;
			const newScore = oldScore + Math.floor(amount);
			memberDoc.rank_score = newScore;
			serverDocument.markModified("members");

			return {
				success: true,
				userId,
				previousBalance: oldScore,
				newBalance: newScore,
				amountAdded: Math.floor(amount),
				reason,
			};
		},

		/**
		 * Remove points from a user's rank score
		 * @param {string} userId - User ID to remove points from
		 * @param {number} amount - Amount of points to remove (1-10000)
		 * @param {string} [reason] - Optional reason for the change
		 * @returns {Object} Result with new balance
		 * @throws {SkynetError} If missing scope, invalid parameters, or insufficient funds
		 */
		removePoints (userId, amount, reason = "Extension") {
			if (!hasWriteScope) throw new SkynetError("MISSING_SCOPES", "economy_manage");
			if (!userId || typeof userId !== "string") {
				throw new SkynetError("INVALID_PARAMETER", "userId must be a string");
			}
			if (typeof amount !== "number" || isNaN(amount)) {
				throw new SkynetError("INVALID_PARAMETER", "amount must be a number");
			}
			if (amount <= 0) {
				throw new SkynetError("INVALID_PARAMETER", "amount must be positive");
			}
			if (amount > MAX_POINTS_PER_ACTION) {
				throw new SkynetError("INVALID_PARAMETER", `amount cannot exceed ${MAX_POINTS_PER_ACTION}`);
			}

			const memberDoc = getMemberDoc(userId);
			if (!memberDoc) {
				return {
					success: false,
					error: "User not found in points system",
					userId,
				};
			}

			const oldScore = memberDoc.rank_score || 0;
			if (oldScore < amount) {
				return {
					success: false,
					error: "Insufficient points",
					userId,
					currentBalance: oldScore,
					requested: Math.floor(amount),
				};
			}

			const newScore = Math.max(MIN_POINTS, oldScore - Math.floor(amount));
			memberDoc.rank_score = newScore;
			serverDocument.markModified("members");

			return {
				success: true,
				userId,
				previousBalance: oldScore,
				newBalance: newScore,
				amountRemoved: Math.floor(amount),
				reason,
			};
		},

		/**
		 * Transfer points between users
		 * @param {string} fromUserId - User ID to take points from
		 * @param {string} toUserId - User ID to give points to
		 * @param {number} amount - Amount to transfer
		 * @param {string} [reason] - Optional reason
		 * @returns {Object} Transfer result
		 * @throws {SkynetError} If missing scope or invalid parameters
		 */
		transfer (fromUserId, toUserId, amount, reason = "Transfer") {
			if (!hasWriteScope) throw new SkynetError("MISSING_SCOPES", "economy_manage");
			if (fromUserId === toUserId) {
				throw new SkynetError("INVALID_PARAMETER", "Cannot transfer to self");
			}

			// First try to remove from sender
			const removeResult = this.removePoints(fromUserId, amount, reason);
			if (!removeResult.success) {
				return {
					success: false,
					error: removeResult.error,
					fromUserId,
					toUserId,
				};
			}

			// Then add to receiver
			const addResult = this.addPoints(toUserId, amount, reason);

			return {
				success: true,
				fromUserId,
				toUserId,
				amount: Math.floor(amount),
				fromNewBalance: removeResult.newBalance,
				toNewBalance: addResult.newBalance,
				reason,
			};
		},

		/**
		 * Set a user's points to a specific value
		 * @param {string} userId - User ID
		 * @param {number} amount - New point value (0-100000)
		 * @param {string} [reason] - Optional reason
		 * @returns {Object} Result
		 * @throws {SkynetError} If missing scope or invalid parameters
		 */
		setPoints (userId, amount, reason = "Set by extension") {
			if (!hasWriteScope) throw new SkynetError("MISSING_SCOPES", "economy_manage");
			if (!userId || typeof userId !== "string") {
				throw new SkynetError("INVALID_PARAMETER", "userId must be a string");
			}
			if (typeof amount !== "number" || isNaN(amount)) {
				throw new SkynetError("INVALID_PARAMETER", "amount must be a number");
			}
			if (amount < MIN_POINTS || amount > 100000) {
				throw new SkynetError("INVALID_PARAMETER", "amount must be between 0 and 100000");
			}

			// Get or create member document
			let memberDoc = getMemberDoc(userId);
			if (!memberDoc) {
				if (serverDocument.members.id) {
					serverDocument.members.push({ _id: userId, rank_score: 0 });
					memberDoc = serverDocument.members.id(userId);
				} else {
					serverDocument.members[userId] = { _id: userId, rank_score: 0 };
					memberDoc = serverDocument.members[userId];
				}
			}

			const oldScore = memberDoc.rank_score || 0;
			memberDoc.rank_score = Math.floor(amount);
			serverDocument.markModified("members");

			return {
				success: true,
				userId,
				previousBalance: oldScore,
				newBalance: Math.floor(amount),
				reason,
			};
		},
	};
};
