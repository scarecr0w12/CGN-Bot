const { saveAdminConsoleOptions: save, getChannelData, getRoleData } = require("../../helpers");
const parsers = require("../../parsers");
const TierManager = require("../../../Modules/TierManager");

const controllers = module.exports;

controllers.collection = async (req, { res }) => {
	const { client } = req.app;
	const { svr } = req;
	const serverDocument = req.svr.document;

	res.setPageData({
		page: "admin-stats-collection.ejs",
		channelData: getChannelData(svr),
		commandDescriptions: {
			games: client.getPublicCommandMetadata("games").description,
			messages: client.getPublicCommandMetadata("messages").description,
			stats: client.getPublicCommandMetadata("stats").description,
		},
		commandCategories: {
			games: client.getPublicCommandMetadata("games").category,
			messages: client.getPublicCommandMetadata("messages").category,
			stats: client.getPublicCommandMetadata("stats").category,
		},
	});
	res.setConfigData({
		commands: {
			messages: serverDocument.config.commands.messages,
			stats: serverDocument.config.commands.stats,
		},
	});
	res.render();
};
controllers.collection.post = async (req, res) => {
	parsers.commandOptions(req, "stats", req.body);
	parsers.commandOptions(req, "games", req.body);
	parsers.commandOptions(req, "messages", req.body);

	save(req, res, true);
};

controllers.ranks = async (req, { res }) => {
	const { svr } = req;
	const serverDocument = req.svr.document;
	await svr.fetchCollection("roles");

	res.setPageData({
		page: "admin-ranks.ejs",
		roleData: getRoleData(svr),
	});
	res.setConfigData({
		ranks_list: serverDocument.config.ranks_list.map(a => {
			a.members = Object.values(serverDocument.members).filter(memberDocument => memberDocument.rank === a._id).length;
			return a;
		}),
	});
	res.render();
};
controllers.ranks.post = async (req, res) => {
	const serverDocument = req.svr.document;
	const serverQueryDocument = req.svr.queryDocument;

	if (req.body["new-name"] && req.body["new-max_score"] && !serverDocument.config.ranks_list.id(req.body["new-name"])) {
		serverQueryDocument.push("config.ranks_list", {
			_id: req.body["new-name"],
			max_score: parseInt(req.body["new-max_score"]),
			role_id: req.body["new-role_id"] || null,
		});
	} else if (req.body["ranks_list-reset"]) {
		Object.values(serverDocument.members).forEach(member => {
			serverQueryDocument.set(`members.${member._id}.rank`, "No Rank");
		});
	} else {
		serverDocument.config.ranks_list.forEach(rankDocument => {
			const rankQueryDocument = serverQueryDocument.clone.id("config.ranks_list", rankDocument._id);

			const newMaxScore = parseInt(req.body[`rank-${rankDocument._id}-max_score`]);
			if (newMaxScore || newMaxScore === 0) rankQueryDocument.set("max_score", newMaxScore);

			const newRoleId = req.body[`rank-${rankDocument._id}-role_id`];
			if (newRoleId || newRoleId === "") rankQueryDocument.set("role_id", newRoleId);
		});
	}
	serverQueryDocument.set("config.ranks_list", serverDocument.config.ranks_list.sort((a, b) => a.max_score - b.max_score));

	save(req, res, true);
};

controllers.points = async (req, { res }) => {
	const { client } = req.app;
	const { svr } = req;
	const serverDocument = req.svr.document;

	res.setPageData({
		page: "admin-skynet-points.ejs",
		channelData: getChannelData(svr),
		commandDescriptions: {
			points: client.getPublicCommandMetadata("points").description,
			lottery: client.getPublicCommandMetadata("lottery").description,
		},
		commandCategories: {
			points: client.getPublicCommandMetadata("points").category,
			lottery: client.getPublicCommandMetadata("lottery").category,
		},
	});
	res.setConfigData({
		commands: {
			points: serverDocument.config.commands.points,
			lottery: serverDocument.config.commands.lottery,
		},
	});
	res.render();
};
controllers.points.post = async (req, res) => {
	parsers.commandOptions(req, "points", req.body);
	parsers.commandOptions(req, "lottery", req.body);

	save(req, res, true);
};

controllers.economy = async (req, { res }) => {
	const { client } = req.app;
	const { svr } = req;
	const serverDocument = req.svr.document;

	const economyCommands = ["balance", "daily", "deposit", "withdraw", "give", "gamble", "slots", "rob", "shop", "inventory", "auction"];
	const commandDescriptions = {};
	const commandCategories = {};
	const commands = {};

	// Default command config for new economy commands
	const defaultCommandConfig = {
		isEnabled: true,
		admin_level: 0,
		disabled_channel_ids: [],
	};

	economyCommands.forEach(cmd => {
		const metadata = client.getPublicCommandMetadata(cmd);
		if (metadata) {
			commandDescriptions[cmd] = metadata.description;
			commandCategories[cmd] = metadata.category;
			// Use existing config or provide defaults for new commands
			commands[cmd] = serverDocument.config.commands[cmd] || { ...defaultCommandConfig };
		}
	});

	res.setPageData({
		page: "admin-economy.ejs",
		channelData: getChannelData(svr),
		commandDescriptions,
		commandCategories,
	});
	res.setConfigData({ commands });
	res.render();
};
controllers.economy.post = async (req, res) => {
	const economyCommands = ["balance", "daily", "deposit", "withdraw", "give", "gamble", "slots", "rob", "shop", "inventory", "auction"];
	economyCommands.forEach(cmd => {
		parsers.commandOptions(req, cmd, req.body);
	});

	save(req, res, true);
};

controllers.economyStats = async (req, { res }) => {
	const { client } = req.app;
	const { svr } = req;

	// Fetch all members in this server who have economy data
	const memberIds = Object.keys(svr.members || {});
	const usersWithEconomy = [];

	// Fetch user documents for members in this server
	for (const memberId of memberIds) {
		try {
			const userDoc = await Users.findOne(memberId);
			if (userDoc && userDoc.economy && (userDoc.economy.wallet > 0 || userDoc.economy.bank > 0)) {
				const member = svr.members[memberId];
				const discordUser = member?.user || await client.users.fetch(memberId).catch(() => null);

				usersWithEconomy.push({
					id: memberId,
					username: discordUser?.username || `User ${memberId.slice(-4)}`,
					avatar: discordUser ? client.getAvatarURL(discordUser.id, discordUser.avatar) || "/static/img/discord-icon.png" : "/static/img/discord-icon.png",
					wallet: userDoc.economy.wallet || 0,
					bank: userDoc.economy.bank || 0,
					netWorth: (userDoc.economy.wallet || 0) + (userDoc.economy.bank || 0),
					totalEarned: userDoc.economy.total_earned || 0,
					totalLost: userDoc.economy.total_lost || 0,
				});
			}
		} catch (err) {
			// Skip users that can't be fetched
		}
	}

	// Sort by net worth for leaderboard
	const leaderboard = usersWithEconomy
		.sort((a, b) => b.netWorth - a.netWorth)
		.slice(0, 25);

	// Calculate statistics
	const totalCoins = usersWithEconomy.reduce((sum, u) => sum + u.wallet, 0);
	const totalBanked = usersWithEconomy.reduce((sum, u) => sum + u.bank, 0);
	const totalNetWorth = usersWithEconomy.reduce((sum, u) => sum + u.netWorth, 0);
	const averageNetWorth = usersWithEconomy.length > 0 ? Math.round(totalNetWorth / usersWithEconomy.length) : 0;

	// Wealth distribution
	const distribution = {
		poor: usersWithEconomy.filter(u => u.netWorth < 1000).length,
		middle: usersWithEconomy.filter(u => u.netWorth >= 1000 && u.netWorth < 10000).length,
		rich: usersWithEconomy.filter(u => u.netWorth >= 10000 && u.netWorth < 50000).length,
		wealthy: usersWithEconomy.filter(u => u.netWorth >= 50000).length,
	};

	// Top earners and losers
	const topEarners = usersWithEconomy
		.filter(u => u.totalEarned > 0)
		.sort((a, b) => b.totalEarned - a.totalEarned)
		.slice(0, 5);

	const topLosers = usersWithEconomy
		.filter(u => u.totalLost > 0)
		.sort((a, b) => b.totalLost - a.totalLost)
		.slice(0, 5);

	res.setPageData({
		page: "admin-economy-stats.ejs",
		stats: {
			totalCoins,
			totalBanked,
			usersWithEconomy: usersWithEconomy.length,
			averageNetWorth,
			distribution,
		},
		leaderboard,
		topEarners,
		topLosers,
		recentActivity: topEarners.length > 0 || topLosers.length > 0,
	});
	res.render();
};

// Premium Advanced Stats Page
controllers.advancedStats = async (req, { res }) => {
	const hasAdvancedStats = await TierManager.canAccess(req.svr.id, "advanced_stats");
	const serverDocument = req.svr.document;
	const members = Object.values(serverDocument.members || {});

	// Calculate statistics for the page
	const totalPoints = members.reduce((sum, m) => sum + (m.points || 0), 0);
	const avgPoints = members.length ? Math.round(totalPoints / members.length) : 0;

	// Points distribution
	const pointsDistribution = {
		zero: members.filter(m => (m.points || 0) === 0).length,
		low: members.filter(m => (m.points || 0) > 0 && (m.points || 0) <= 100).length,
		medium: members.filter(m => (m.points || 0) > 100 && (m.points || 0) <= 500).length,
		high: members.filter(m => (m.points || 0) > 500 && (m.points || 0) <= 1000).length,
		elite: members.filter(m => (m.points || 0) > 1000).length,
	};

	// Top members by points
	const topMembers = members
		.filter(m => m.points > 0)
		.sort((a, b) => (b.points || 0) - (a.points || 0))
		.slice(0, 10)
		.map(m => ({ id: m._id, points: m.points, rank: m.rank }));

	// Rank distribution
	const rankDistribution = {};
	members.forEach(m => {
		const rank = m.rank || "No Rank";
		rankDistribution[rank] = (rankDistribution[rank] || 0) + 1;
	});

	// Activity metrics (7-day window)
	const activeMembers = members.filter(m => m.last_active && Date.now() - new Date(m.last_active).getTime() < 7 * 24 * 60 * 60 * 1000).length;
	const inactiveMembers = members.length - activeMembers;
	const activityRate = members.length ? Math.round((activeMembers / members.length) * 100) : 0;

	// Strike statistics
	const membersWithStrikes = members.filter(m => m.strikes && m.strikes.length > 0);
	const totalStrikes = membersWithStrikes.reduce((sum, m) => sum + (m.strikes?.length || 0), 0);

	res.setPageData({
		page: "admin-advanced-stats.ejs",
		hasAdvancedStats,
		stats: {
			overview: {
				totalMembers: members.length,
				totalPoints,
				averagePoints: avgPoints,
				messagesToday: serverDocument.messages_today || 0,
			},
			activity: {
				activeMembers,
				inactiveMembers,
				activityRate,
			},
			moderation: {
				membersWithStrikes: membersWithStrikes.length,
				totalStrikes,
			},
			distributions: {
				points: pointsDistribution,
				ranks: rankDistribution,
			},
			leaderboard: topMembers,
		},
	});
	res.render();
};

// Premium Advanced Stats API endpoint
controllers.analytics = async (req, res) => {
	// Check if server has advanced_stats feature (premium is per-server)
	const hasAdvancedStats = await TierManager.canAccess(req.svr.id, "advanced_stats");
	if (!hasAdvancedStats) {
		return res.status(403).json({ error: "Advanced analytics requires a premium subscription." });
	}

	const serverDocument = req.svr.document;
	const members = Object.values(serverDocument.members || {});

	// Calculate advanced statistics
	const totalPoints = members.reduce((sum, m) => sum + (m.points || 0), 0);
	const avgPoints = members.length ? Math.round(totalPoints / members.length) : 0;

	// Points distribution
	const pointsDistribution = {
		zero: members.filter(m => (m.points || 0) === 0).length,
		low: members.filter(m => (m.points || 0) > 0 && (m.points || 0) <= 100).length,
		medium: members.filter(m => (m.points || 0) > 100 && (m.points || 0) <= 500).length,
		high: members.filter(m => (m.points || 0) > 500 && (m.points || 0) <= 1000).length,
		elite: members.filter(m => (m.points || 0) > 1000).length,
	};

	// Top members by points
	const topMembers = members
		.filter(m => m.points > 0)
		.sort((a, b) => (b.points || 0) - (a.points || 0))
		.slice(0, 10)
		.map(m => ({ id: m._id, points: m.points, rank: m.rank }));

	// Rank distribution
	const rankDistribution = {};
	members.forEach(m => {
		const rank = m.rank || "No Rank";
		rankDistribution[rank] = (rankDistribution[rank] || 0) + 1;
	});

	// Activity metrics
	const activeMembers = members.filter(m => m.last_active && Date.now() - new Date(m.last_active).getTime() < 7 * 24 * 60 * 60 * 1000).length;
	const inactiveMembers = members.length - activeMembers;

	// Strike statistics
	const membersWithStrikes = members.filter(m => m.strikes && m.strikes.length > 0);
	const totalStrikes = membersWithStrikes.reduce((sum, m) => sum + (m.strikes?.length || 0), 0);

	res.json({
		overview: {
			totalMembers: members.length,
			totalPoints,
			averagePoints: avgPoints,
			messagestoday: serverDocument.messages_today || 0,
		},
		activity: {
			activeMembers,
			inactiveMembers,
			activityRate: members.length ? Math.round((activeMembers / members.length) * 100) : 0,
		},
		moderation: {
			membersWithStrikes: membersWithStrikes.length,
			totalStrikes,
		},
		distributions: {
			points: pointsDistribution,
			ranks: rankDistribution,
		},
		leaderboard: topMembers,
	});
};
