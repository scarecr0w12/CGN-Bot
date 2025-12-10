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

// Premium Advanced Stats API endpoint
controllers.analytics = async (req, res) => {
	// Check if user has advanced_stats feature
	const hasAdvancedStats = await TierManager.canAccess(req.consolemember.user.id, "advanced_stats");
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
