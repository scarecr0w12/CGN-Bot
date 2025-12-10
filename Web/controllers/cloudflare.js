/**
 * Cloudflare Management Controller
 *
 * Provides maintainer-level access to:
 * - Cache purging
 * - Analytics dashboard
 * - Security settings
 * - Development mode toggle
 */

const { getInstance } = require("../../Modules/CloudflareService");
// logger is a global defined in Boot.js/Worker.js

/**
 * Get Cloudflare service status and overview
 */
async function getStatus (req, { res }) {
	const cf = getInstance();

	if (!cf.isEnabled()) {
		return res.setPageData({
			page: "maintainer-cloudflare",
			title: "Cloudflare",
			enabled: false,
			message: "Cloudflare integration is not configured",
		}).render();
	}

	try {
		const summary = await cf.getConfigSummary();

		return res.setPageData({
			page: "maintainer-cloudflare",
			title: "Cloudflare",
			enabled: true,
			summary,
		}).render();
	} catch (err) {
		logger.error("Failed to get Cloudflare status", {}, err);
		return res.setPageData({
			page: "maintainer-cloudflare",
			title: "Cloudflare",
			enabled: true,
			error: err.message,
		}).render();
	}
}

/**
 * Get Cloudflare analytics data
 */
async function getAnalytics (req, { res }) {
	const cf = getInstance();

	if (!cf.isEnabled()) {
		return res.status(400).json({ error: "Cloudflare not configured" });
	}

	try {
		const period = req.query.period || "day";
		const since = period === "week" ? "-10080" : period === "month" ? "-43200" : "-1440";

		// Try to fetch analytics, but handle permission errors gracefully
		const results = await Promise.allSettled([
			cf.getBandwidthStats({ since }),
			cf.getRequestStats({ since }),
			cf.getThreatStats({ since }),
		]);

		const [bandwidthResult, requestsResult, threatsResult] = results;

		// Check if all failed with permission error
		const allFailed = results.every(r => r.status === "rejected");
		if (allFailed) {
			const firstError = results[0].reason?.message || "Unknown error";
			if (firstError.includes("1102") || firstError.includes("Failed to get zone")) {
				return res.status(403).json({
					error: "Analytics permission not configured. Add 'Zone → Analytics → Read' to your API token.",
					permissionError: true,
				});
			}
			return res.status(500).json({ error: firstError });
		}

		return res.json({
			period,
			bandwidth: bandwidthResult.status === "fulfilled" ? bandwidthResult.value : null,
			requests: requestsResult.status === "fulfilled" ? requestsResult.value : null,
			threats: threatsResult.status === "fulfilled" ? threatsResult.value : null,
		});
	} catch (err) {
		logger.error("Failed to get Cloudflare analytics", {}, err);
		return res.status(500).json({ error: err.message });
	}
}

/**
 * Purge entire cache
 */
async function purgeAll (req, { res }) {
	const cf = getInstance();

	if (!cf.isEnabled()) {
		return res.status(400).json({ error: "Cloudflare not configured" });
	}

	try {
		await cf.purgeAllCache();
		logger.info("Cloudflare cache purged by maintainer", { userId: req.user?.id });
		return res.json({ success: true, message: "Entire cache purged successfully" });
	} catch (err) {
		logger.error("Failed to purge Cloudflare cache", {}, err);
		return res.status(500).json({ error: err.message });
	}
}

/**
 * Purge specific URLs from cache
 */
async function purgeUrls (req, { res }) {
	const cf = getInstance();

	if (!cf.isEnabled()) {
		return res.status(400).json({ error: "Cloudflare not configured" });
	}

	const { urls } = req.body;
	if (!urls || !Array.isArray(urls) || urls.length === 0) {
		return res.status(400).json({ error: "URLs array is required" });
	}

	try {
		await cf.purgeUrls(urls);
		logger.info("Cloudflare cache URLs purged by maintainer", { userId: req.user?.id, count: urls.length });
		return res.json({ success: true, message: `Purged ${urls.length} URL(s) from cache` });
	} catch (err) {
		logger.error("Failed to purge Cloudflare cache URLs", {}, err);
		return res.status(500).json({ error: err.message });
	}
}

/**
 * Toggle development mode
 */
async function toggleDevMode (req, { res }) {
	const cf = getInstance();

	if (!cf.isEnabled()) {
		return res.status(400).json({ error: "Cloudflare not configured" });
	}

	const { enabled } = req.body;
	if (typeof enabled !== "boolean") {
		return res.status(400).json({ error: "enabled (boolean) is required" });
	}

	try {
		await cf.setDevelopmentMode(enabled);
		logger.info("Cloudflare development mode toggled", { userId: req.user?.id, enabled });
		return res.json({
			success: true,
			message: enabled ? "Development mode enabled (cache disabled for 3 hours)" : "Development mode disabled",
		});
	} catch (err) {
		logger.error("Failed to toggle Cloudflare development mode", {}, err);
		return res.status(500).json({ error: err.message });
	}
}

/**
 * Set security level
 */
async function setSecurityLevel (req, { res }) {
	const cf = getInstance();

	if (!cf.isEnabled()) {
		return res.status(400).json({ error: "Cloudflare not configured" });
	}

	const { level } = req.body;
	const validLevels = ["off", "essentially_off", "low", "medium", "high", "under_attack"];
	if (!level || !validLevels.includes(level)) {
		return res.status(400).json({ error: `Invalid level. Must be one of: ${validLevels.join(", ")}` });
	}

	try {
		await cf.setSecurityLevel(level);
		logger.info("Cloudflare security level changed", { userId: req.user?.id, level });
		return res.json({ success: true, message: `Security level set to: ${level}` });
	} catch (err) {
		logger.error("Failed to set Cloudflare security level", {}, err);
		return res.status(500).json({ error: err.message });
	}
}

/**
 * Enable "I'm Under Attack" mode
 */
async function enableUnderAttack (req, { res }) {
	const cf = getInstance();

	if (!cf.isEnabled()) {
		return res.status(400).json({ error: "Cloudflare not configured" });
	}

	try {
		await cf.enableUnderAttackMode();
		logger.warn("Cloudflare Under Attack mode ENABLED", { userId: req.user?.id });
		return res.json({ success: true, message: "Under Attack mode enabled" });
	} catch (err) {
		logger.error("Failed to enable Cloudflare Under Attack mode", {}, err);
		return res.status(500).json({ error: err.message });
	}
}

/**
 * Disable "I'm Under Attack" mode
 */
async function disableUnderAttack (req, { res }) {
	const cf = getInstance();

	if (!cf.isEnabled()) {
		return res.status(400).json({ error: "Cloudflare not configured" });
	}

	try {
		await cf.disableUnderAttackMode();
		logger.info("Cloudflare Under Attack mode disabled", { userId: req.user?.id });
		return res.json({ success: true, message: "Under Attack mode disabled" });
	} catch (err) {
		logger.error("Failed to disable Cloudflare Under Attack mode", {}, err);
		return res.status(500).json({ error: err.message });
	}
}

/**
 * Get zone settings
 */
async function getSettings (req, { res }) {
	const cf = getInstance();

	if (!cf.isEnabled()) {
		return res.status(400).json({ error: "Cloudflare not configured" });
	}

	try {
		const settings = await cf.getZoneSettings();
		return res.json(settings.result);
	} catch (err) {
		logger.error("Failed to get Cloudflare settings", {}, err);
		return res.status(500).json({ error: err.message });
	}
}

/**
 * List firewall access rules
 */
async function listAccessRules (req, { res }) {
	const cf = getInstance();

	if (!cf.isEnabled()) {
		return res.status(400).json({ error: "Cloudflare not configured" });
	}

	try {
		const page = parseInt(req.query.page, 10) || 1;
		const rules = await cf.listAccessRules({ page });
		return res.json(rules);
	} catch (err) {
		logger.error("Failed to list Cloudflare access rules", {}, err);
		return res.status(500).json({ error: err.message });
	}
}

/**
 * Block an IP address
 */
async function blockIP (req, { res }) {
	const cf = getInstance();

	if (!cf.isEnabled()) {
		return res.status(400).json({ error: "Cloudflare not configured" });
	}

	const { ip, notes } = req.body;
	if (!ip) {
		return res.status(400).json({ error: "IP address is required" });
	}

	try {
		await cf.blockIP(ip, notes || `Blocked by ${req.user?.username || "maintainer"}`);
		logger.warn("IP blocked via Cloudflare", { userId: req.user?.id, ip });
		return res.json({ success: true, message: `IP ${ip} blocked` });
	} catch (err) {
		logger.error("Failed to block IP via Cloudflare", {}, err);
		return res.status(500).json({ error: err.message });
	}
}

/**
 * Unblock/delete access rule
 */
async function deleteAccessRule (req, { res }) {
	const cf = getInstance();

	if (!cf.isEnabled()) {
		return res.status(400).json({ error: "Cloudflare not configured" });
	}

	const { ruleId } = req.params;
	if (!ruleId) {
		return res.status(400).json({ error: "Rule ID is required" });
	}

	try {
		await cf.deleteAccessRule(ruleId);
		logger.info("Cloudflare access rule deleted", { userId: req.user?.id, ruleId });
		return res.json({ success: true, message: "Access rule deleted" });
	} catch (err) {
		logger.error("Failed to delete Cloudflare access rule", {}, err);
		return res.status(500).json({ error: err.message });
	}
}

/**
 * Set cache level
 */
async function setCacheLevel (req, { res }) {
	const cf = getInstance();

	if (!cf.isEnabled()) {
		return res.status(400).json({ error: "Cloudflare not configured" });
	}

	const { level } = req.body;
	const validLevels = ["aggressive", "basic", "simplified"];
	if (!level || !validLevels.includes(level)) {
		return res.status(400).json({ error: `Invalid level. Must be one of: ${validLevels.join(", ")}` });
	}

	try {
		await cf.setCacheLevel(level);
		logger.info("Cloudflare cache level changed", { userId: req.user?.id, level });
		return res.json({ success: true, message: `Cache level set to: ${level}` });
	} catch (err) {
		logger.error("Failed to set Cloudflare cache level", {}, err);
		return res.status(500).json({ error: err.message });
	}
}

module.exports = {
	getStatus,
	getAnalytics,
	purgeAll,
	purgeUrls,
	toggleDevMode,
	setSecurityLevel,
	enableUnderAttack,
	disableUnderAttack,
	getSettings,
	listAccessRules,
	blockIP,
	deleteAccessRule,
	setCacheLevel,
};
