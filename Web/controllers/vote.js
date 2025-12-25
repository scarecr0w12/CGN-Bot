/**
 * Vote Page Controller
 *
 * Handles the dedicated /vote page that displays:
 * - User's vote stats (if authenticated)
 * - All vote sites with cooldown timers
 * - Vote rewards information
 */

const VoteRewardsManager = require("../../Modules/VoteRewardsManager");

const controllers = module.exports;

/**
 * Main vote page
 */
controllers.index = async (req, res) => {
	try {
		const settings = await VoteRewardsManager.getSettings();
		const voteSites = await VoteRewardsManager.getVoteSites();

		// Base page data
		const pageData = {
			isEnabled: settings.isEnabled || false,
			pointsPerVote: settings.points_per_vote || 100,
			weekendMultiplier: settings.weekend_multiplier || 2,
			voteSites: voteSites || [],
			userStats: null,
			sitesWithStatus: [],
			leaderboard: [],
		};

		// Get leaderboard (public)
		try {
			pageData.leaderboard = await VoteRewardsManager.getLeaderboard(10);
		} catch (err) {
			logger.warn("Failed to fetch vote leaderboard", {}, err);
		}

		// If user is authenticated, get their personal stats
		if (req.isAuthenticated()) {
			try {
				const [voteRewards, sitesWithStatus] = await Promise.all([
					VoteRewardsManager.getUserVoteRewards(req.user.id),
					Promise.all(
						voteSites.map(async site => {
							const status = await VoteRewardsManager.canVote(req.user.id, site.id);
							return { ...site, ...status };
						}),
					),
				]);

				pageData.userStats = {
					balance: voteRewards.balance || 0,
					lifetimeEarned: voteRewards.lifetime_earned || 0,
					lifetimeSpent: voteRewards.lifetime_spent || 0,
					totalVotes: voteRewards.total_votes || 0,
					lastVoteAt: voteRewards.last_vote_at,
				};

				pageData.sitesWithStatus = sitesWithStatus;
			} catch (err) {
				logger.warn("Failed to fetch user vote stats", { userId: req.user.id }, err);
			}
		}

		res.render("pages/vote.ejs", {
			authUser: req.user || null,
			currentPage: "/vote",
			pageData,
		});
	} catch (err) {
		logger.error("Error rendering vote page", {}, err);
		require("../helpers").renderError(res, "Failed to load vote page.");
	}
};

/**
 * API endpoint to get user's vote status (for dynamic updates)
 */
controllers.getStatus = async (req, res) => {
	if (!req.isAuthenticated()) {
		return res.status(401).json({ error: "Not authenticated" });
	}

	try {
		const [voteRewards, voteSites] = await Promise.all([
			VoteRewardsManager.getUserVoteRewards(req.user.id),
			VoteRewardsManager.getVoteSites(),
		]);

		const sitesWithStatus = await Promise.all(
			voteSites.map(async site => {
				const status = await VoteRewardsManager.canVote(req.user.id, site.id);
				return { ...site, ...status };
			}),
		);

		res.json({
			balance: voteRewards.balance || 0,
			lifetimeEarned: voteRewards.lifetime_earned || 0,
			totalVotes: voteRewards.total_votes || 0,
			lastVoteAt: voteRewards.last_vote_at,
			sites: sitesWithStatus,
		});
	} catch (err) {
		logger.error("Error fetching vote status", {}, err);
		res.status(500).json({ error: "Failed to fetch vote status" });
	}
};
