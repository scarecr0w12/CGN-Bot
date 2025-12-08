const moment = require("moment");
const uptimeKuma = require("../../Modules/UptimeKuma");
const { getRoundedUptime } = require("../helpers");

module.exports = async (req, { res }) => {
	const uptime = process.uptime();
	const guildSize = await req.app.client.guilds.totalCount;
	const userSize = await req.app.client.users.totalCount;

	// Get Uptime Kuma status data
	const statusData = await uptimeKuma.getStatusData();

	res.setPageData({
		page: "status.ejs",
		rawServerCount: guildSize,
		rawUserCount: `${Math.floor(userSize / 1000)}K`,
		rawUptime: moment.duration(uptime, "seconds").humanize(),
		roundedUptime: getRoundedUptime(uptime),
		uptimeKuma: statusData,
		lastUpdated: new Date().toISOString(),
	});

	res.render();
};

// API endpoint for status data
module.exports.api = async (req, res) => {
	const uptime = process.uptime();
	const guildSize = await req.app.client.guilds.totalCount;
	const userSize = await req.app.client.users.totalCount;
	const statusData = await uptimeKuma.getStatusData();

	res.json({
		bot: {
			uptime: uptime,
			uptimeFormatted: getRoundedUptime(uptime),
			servers: guildSize,
			users: userSize,
		},
		monitors: statusData.monitors,
		overallStatus: statusData.overallStatus,
		uptimePercentage: statusData.uptimePercentage,
		available: statusData.available,
		lastUpdated: new Date().toISOString(),
	});
};
