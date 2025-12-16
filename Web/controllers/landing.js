const moment = require("moment");
const { getRoundedUptime } = require("../helpers");

module.exports = async (req, { res }) => {
	const uptime = process.uptime();
	const guildSize = await req.app.client.guilds.totalCount;
	const userSize = await req.app.client.users.totalCount;

	// Fetch featured extensions (featured first, then by points)
	let featuredExtensions = [];
	try {
		const extensions = await Gallery.find({ state: "gallery" })
			.sort({ featured: -1, points: -1 })
			.limit(10)
			.exec();
		console.log(`[LANDING] Found ${extensions.length} gallery extensions for carousel`);
		featuredExtensions = extensions.map(ext => ({
			_id: ext._id.toString(),
			name: ext.name,
			description: ext.description ? ext.description.substring(0, 120) + (ext.description.length > 120 ? "..." : "") : "",
			points: ext.points || 0,
			featured: ext.featured || false,
			tags: ext.tags || [],
		}));
	} catch (err) {
		console.error("[LANDING] Failed to fetch extensions for carousel:", err);
	}

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
		featuredExtensions,
	});

	res.render();
};
