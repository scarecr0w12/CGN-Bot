const moment = require("moment");
const { getRoundedUptime } = require("../helpers");

module.exports = async (req, { res }) => {
	const uptime = process.uptime();
	const guildSize = await req.app.client.guilds.totalCount;
	const userSize = await req.app.client.users.totalCount;

	const ConfigManager = require("../../Modules/ConfigManager");
	const settings = await ConfigManager.get();
	res.setPageData({
		page: req.debugMode ? "newLanding.ejs" : "landing.ejs",
		bannerMessage: settings.homepageMessageHTML,
		rawServerCount: guildSize,
		roundedServerCount: Math.floor(guildSize / 100) * 100,
		rawUserCount: `${Math.floor(userSize / 1000)}K`,
		rawUptime: moment.duration(uptime, "seconds").humanize(),
		roundedUptime: getRoundedUptime(uptime),
	});

	res.render();
};
