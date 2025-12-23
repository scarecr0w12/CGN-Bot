/**
 * IndexNow Controller - Manages IndexNow SEO integration diagnostics
 */

const controllers = module.exports;

/**
 * Status page showing IndexNow configuration and stats
 */
controllers.status = async (req, { res }) => {
	const indexNow = req.app.get("indexNow");

	if (!indexNow) {
		return res.setPageData({
			page: "maintainer-indexnow.ejs",
			title: "IndexNow",
			enabled: false,
			message: "IndexNow module not initialized",
		}).render();
	}

	const stats = indexNow.getStats();
	const hostingURL = req.app.client?.configJS?.hostingURL || "";

	return res.setPageData({
		page: "maintainer-indexnow.ejs",
		title: "IndexNow",
		enabled: stats.enabled,
		indexNow: stats,
		keyFileUrl: stats.keyConfigured ? `${hostingURL.replace(/\/$/, "")}/${process.env.INDEXNOW_API_KEY}.txt` : null,
	}).render();
};

/**
 * Test IndexNow configuration
 */
controllers.test = async (req, res) => {
	const indexNow = req.app.get("indexNow");

	if (!indexNow) {
		return res.status(500).json({ success: false, error: "IndexNow module not initialized" });
	}

	const result = await indexNow.testConfiguration();
	res.json(result);
};

/**
 * Manually submit a URL to IndexNow
 */
controllers.submit = async (req, res) => {
	const indexNow = req.app.get("indexNow");

	if (!indexNow) {
		return res.status(500).json({ success: false, error: "IndexNow module not initialized" });
	}

	const { url } = req.body;

	if (!url) {
		return res.status(400).json({ success: false, error: "URL is required" });
	}

	// Ensure URL starts with /
	const urlPath = url.startsWith("/") ? url : `/${url}`;

	const result = await indexNow.submitImmediate(urlPath);
	res.json({
		success: result.success,
		statusCode: result.statusCode,
		error: result.error || null,
		url: urlPath,
	});
};

/**
 * Reset IndexNow statistics
 */
controllers.reset = async (req, res) => {
	const indexNow = req.app.get("indexNow");

	if (!indexNow) {
		return res.status(500).json({ success: false, error: "IndexNow module not initialized" });
	}

	try {
		await indexNow.resetStats();
		res.json({ success: true, message: "Statistics reset successfully" });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};
