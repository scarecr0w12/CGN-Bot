/**
 * SEO Controller - Handles sitemap.xml, robots.txt, and other SEO-related routes
 */

/**
 * Generate robots.txt
 */
const robotsTxt = async (req, res) => {
	const hostingURL = req.app.client.configJS.hostingURL.replace(/\/$/, "");

	const robots = `# Skynet Discord Bot - Robots.txt
# https://www.robotstxt.org/

User-agent: *
Allow: /

# Sitemap location
Sitemap: ${hostingURL}/sitemap.xml

# Crawl-delay for polite crawling
Crawl-delay: 1

# Disallow private/auth pages
Disallow: /dashboard/
Disallow: /login
Disallow: /logout
Disallow: /login/callback
Disallow: /api/
Disallow: /webhooks/
Disallow: /error
Disallow: /account
Disallow: /extensions/my
Disallow: /extensions/builder
Disallow: /wiki/*/edit
Disallow: /blog/*/compose
`;

	res.type("text/plain").send(robots);
};

/**
 * Generate dynamic sitemap.xml
 */
const sitemapXml = async (req, res) => {
	const hostingURL = req.app.client.configJS.hostingURL.replace(/\/$/, "");
	const now = new Date().toISOString().split("T")[0];

	// Static pages with their priority and change frequency
	const staticPages = [
		{ url: "/", priority: "1.0", changefreq: "daily" },
		{ url: "/extensions/gallery", priority: "0.9", changefreq: "daily" },
		{ url: "/activity/servers", priority: "0.8", changefreq: "hourly" },
		{ url: "/activity/users", priority: "0.7", changefreq: "hourly" },
		{ url: "/wiki", priority: "0.8", changefreq: "weekly" },
		{ url: "/blog", priority: "0.7", changefreq: "weekly" },
		{ url: "/extensions/queue", priority: "0.6", changefreq: "daily" },
		{ url: "/status", priority: "0.6", changefreq: "always" },
		{ url: "/donate", priority: "0.5", changefreq: "monthly" },
		{ url: "/membership", priority: "0.6", changefreq: "monthly" },
		{ url: "/add", priority: "0.9", changefreq: "monthly" },
	];

	// Check if paperwork exists (official mode only)
	if (req.app.client.officialMode) {
		staticPages.push({ url: "/paperwork", priority: "0.3", changefreq: "yearly" });
	}

	// Fetch dynamic content from database
	let wikiPages = [];
	let blogPosts = [];
	let extensions = [];

	try {
		// Get wiki pages using global Wiki model
		const wikiDocs = await Wiki.find({}).exec();
		wikiPages = wikiDocs.map(doc => ({
			url: `/wiki/${encodeURIComponent(doc._id)}`,
			priority: "0.8",
			changefreq: "weekly",
			lastmod: doc.updatedAt ? new Date(doc.updatedAt).toISOString().split("T")[0] : now,
		}));
	} catch (err) {
		logger.warn("Failed to fetch wiki pages for sitemap", {}, err);
	}

	try {
		// Get blog posts using global Blog model
		const blogDocs = await Blog.find({}).exec();
		blogPosts = blogDocs.map(doc => ({
			url: `/blog/${doc._id}`,
			priority: "0.8",
			changefreq: "monthly",
			lastmod: doc.published_timestamp ? new Date(doc.published_timestamp).toISOString().split("T")[0] : now,
		}));
	} catch (err) {
		logger.warn("Failed to fetch blog posts for sitemap", {}, err);
	}

	try {
		// Get published extensions using global Gallery model
		const extDocs = await Gallery.find({ state: "gallery" }).exec();
		extensions = extDocs.map(doc => {
			// Use SEO-friendly detail page URL instead of installer
			const extUrl = doc.slug ?
				`/extensions/view/${doc._id}/${doc.slug}` :
				`/extensions/view/${doc._id}`;
			return {
				url: extUrl,
				priority: "0.7",
				changefreq: "weekly",
				lastmod: doc.accepted_at ? new Date(doc.accepted_at).toISOString().split("T")[0] : now,
			};
		});
	} catch (err) {
		logger.warn("Failed to fetch extensions for sitemap", {}, err);
	}

	// Fetch public servers with listings enabled
	let publicServers = [];
	try {
		const serverDocs = await Servers.find({
			"config.public_data.isShown": true,
			"config.public_data.server_listing.isEnabled": true,
		}).exec();
		publicServers = serverDocs.map(doc => {
			const slug = doc.config?.public_data?.server_listing?.slug;
			const serverUrl = slug ?
				`/server/${doc._id}/${slug}` :
				`/server/${doc._id}`;
			return {
				url: serverUrl,
				priority: "0.6",
				changefreq: "daily",
				lastmod: now,
			};
		});
	} catch (err) {
		logger.warn("Failed to fetch public servers for sitemap", {}, err);
	}

	// Combine all pages
	const allPages = [...staticPages, ...wikiPages, ...blogPosts, ...extensions, ...publicServers];

	// Generate sitemap XML
	const urls = allPages.map(page => `
	<url>
		<loc>${hostingURL}${page.url}</loc>
		<lastmod>${page.lastmod || now}</lastmod>
		<changefreq>${page.changefreq}</changefreq>
		<priority>${page.priority}</priority>
	</url>`).join("");

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
<!-- Skynet Discord Bot Sitemap - Generated dynamically -->${urls}
</urlset>`;

	res.type("application/xml").send(sitemap);
};

/**
 * Generate sitemap index for very large sites (future use)
 */
const sitemapIndex = async (req, res) => {
	const hostingURL = req.app.client.configJS.hostingURL.replace(/\/$/, "");
	const now = new Date().toISOString().split("T")[0];

	const index = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<sitemap>
		<loc>${hostingURL}/sitemap.xml</loc>
		<lastmod>${now}</lastmod>
	</sitemap>
</sitemapindex>`;

	res.type("application/xml").send(index);
};

/**
 * Serve IndexNow key verification file
 * The key file is served at /{key}.txt
 */
const indexNowKey = async (req, res) => {
	const key = process.env.INDEXNOW_API_KEY;
	if (!key) {
		return res.status(404).send("IndexNow not configured");
	}
	res.type("text/plain").send(key);
};

module.exports = {
	robotsTxt,
	sitemapXml,
	sitemapIndex,
	indexNowKey,
};
