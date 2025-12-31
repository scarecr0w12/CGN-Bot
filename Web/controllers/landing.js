const moment = require("moment");
const { getRoundedUptime } = require("../helpers");
const parsers = require("../parsers");
const showdown = require("showdown");
const md = new showdown.Converter({
	tables: true,
	simplifiedAutoLink: true,
	strikethrough: true,
	tasklists: true,
	smoothLivePreview: true,
	smartIndentationFix: true,
	extensions: [require("showdown-xss-filter")],
});
md.setFlavor("github");

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

	// Fetch latest blog posts
	let featuredPosts = [];
	try {
		const blogDocuments = await Blog.find({})
			.sort({ published_timestamp: -1 })
			.limit(3)
			.exec();

		if (blogDocuments) {
			featuredPosts = await Promise.all(blogDocuments.map(async blogDocument => {
				const data = await parsers.blogData(req, blogDocument);
				// Convert to HTML then strip tags to get clean text for excerpt
				let excerpt = md.makeHtml(data.content).replace(/<[^>]*>?/gm, "");
				if (excerpt.length > 150) {
					excerpt = `${excerpt.substring(0, 150)}...`;
				}
				data.excerpt = excerpt;
				data.slug = blogDocument.slug;
				return data;
			}));
		}
	} catch (err) {
		console.error("[LANDING] Failed to fetch blog posts:", err);
	}

	const ConfigManager = require("../../Modules/ConfigManager");
	const settings = await ConfigManager.get();

	// Check for active promotion
	const now = new Date();
	const promoEnd = new Date("2026-01-10T23:59:59.999Z");
	const isPromoActive = now < promoEnd;

	res.setPageData({
		page: req.debugMode ? "newLanding.ejs" : "landing.ejs",
		bannerMessage: settings.homepageMessageHTML,
		isPromoActive,
		rawServerCount: guildSize,
		roundedServerCount: Math.floor(guildSize / 100) * 100,
		rawUserCount: `${Math.floor(userSize / 1000)}K`,
		rawUptime: moment.duration(uptime, "seconds").humanize(),
		roundedUptime: getRoundedUptime(uptime),
		featuredExtensions,
		featuredPosts,
		botAvatar: req.app.client.user ? req.app.client.user.displayAvatarURL({ size: 512 }) : "/static/img/logo.png",
		botName: req.app.client.user ? req.app.client.user.username : "Skynet",
	});

	res.render();
};
