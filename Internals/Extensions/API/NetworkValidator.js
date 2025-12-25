/**
 * Network Validation Module
 * Handles URL validation and network capability checking for extension sandbox
 */

const net = require("net");

const EXT_HTTP_DEFAULT_MAX_BYTES = 1024 * 1024;
const EXT_HTTP_DEFAULT_TIMEOUT_MS = 6000;
const EXT_HTTP_MAX_BODY_BYTES = 100 * 1024;
const EXT_HTTP_RATE_WINDOW_MS = 60 * 1000;
const EXT_HTTP_RATE_MAX = 30;

// Default allowlist used when database settings are not available
const DEFAULT_HTTP_ALLOWLIST = [
	"api.jikan.moe",
	"api.mojang.com",
	"sessionserver.mojang.com",
	"api.steampowered.com",
	"steamcommunity.com",
	"mc-heads.net",
	"api.mcsrvstat.us",
	"api.henrikdev.xyz",
	"fortnite-api.com",
	"ddragon.leagueoflegends.com",
	"raw.communitydragon.org",
];

/**
 * Get allowed HTTP hosts for extension sandbox
 * Priority: Environment variable > Database settings > Default list
 * @returns {Promise<string[]>} Array of allowed hostnames
 */
const getAllowedExtensionHttpHosts = async () => {
	// Environment variable takes highest priority (for quick overrides)
	const envRaw = process.env.EXTENSION_HTTP_ALLOWLIST || "";
	const envList = envRaw.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
	if (envList.length) return envList;

	// Try to get from database settings
	try {
		if (typeof SiteSettings !== "undefined" && SiteSettings?.findOne) {
			const settings = await SiteSettings.findOne("main");
			if (settings?.extension_sandbox?.http_allowlist?.length) {
				return settings.extension_sandbox.http_allowlist.map(h => h.toLowerCase());
			}
		}
	} catch (err) {
		logger.warn("NetworkValidator: Failed to fetch allowlist from database, using defaults", {}, err);
	}

	return DEFAULT_HTTP_ALLOWLIST;
};

/**
 * Check if an IP address is private/internal
 * @param {string} ip - IP address to check
 * @returns {boolean} True if private IP
 */
const isPrivateIp = (ip) => {
	if (!ip) return true;
	if (ip === "127.0.0.1" || ip === "::1") return true;
	if (ip.startsWith("10.")) return true;
	if (ip.startsWith("192.168.")) return true;
	if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
	if (ip.startsWith("169.254.")) return true;
	return false;
};

/**
 * Check if URL is allowed based on network capability level
 * @param {string} rawUrl - The URL to check
 * @param {string} networkCapability - The capability level (none, allowlist_only, network, network_advanced)
 * @param {boolean} networkApproved - Whether the capability has been approved
 * @param {string[]} allowlist - The static allowlist for allowlist_only mode
 * @returns {{ok: boolean, url?: URL, error?: string}}
 */
const isAllowedUrl = (rawUrl, networkCapability, networkApproved, allowlist) => {
	let url;
	try {
		url = new URL(String(rawUrl));
	} catch (_) {
		return { ok: false, error: "INVALID_URL" };
	}

	// Check protocol based on capability
	const isHttps = url.protocol === "https:";
	const isHttp = url.protocol === "http:";

	if (!isHttps && !isHttp) return { ok: false, error: "INVALID_PROTOCOL" };

	// Only network_advanced allows HTTP
	if (isHttp && networkCapability !== "network_advanced") {
		return { ok: false, error: "ONLY_HTTPS" };
	}

	if (!url.hostname) return { ok: false, error: "INVALID_HOST" };

	const host = url.hostname.toLowerCase();
	if (host === "localhost") return { ok: false, error: "HOST_NOT_ALLOWED" };

	// Block private IPs regardless of capability
	const ipType = net.isIP(host);
	if (ipType && isPrivateIp(host)) return { ok: false, error: "PRIVATE_IP_BLOCKED" };

	// Handle based on capability level
	switch (networkCapability) {
		case "none":
			return { ok: false, error: "NETWORK_NOT_ENABLED" };

		case "allowlist_only": {
			// Use static allowlist (auto-approved, no approval check needed)
			const allowed = allowlist.some(a => host === a || host.endsWith(`.${a}`));
			if (!allowed) return { ok: false, error: "HOST_NOT_ALLOWED" };
			return { ok: true, url };
		}

		case "network":
		case "network_advanced":
			// Requires maintainer approval
			if (!networkApproved) {
				return { ok: false, error: "NETWORK_NOT_APPROVED" };
			}
			// Any HTTPS host allowed (or HTTP for network_advanced)
			return { ok: true, url };

		default:
			return { ok: false, error: "INVALID_CAPABILITY" };
	}
};

module.exports = {
	getAllowedExtensionHttpHosts,
	isPrivateIp,
	isAllowedUrl,
	DEFAULT_HTTP_ALLOWLIST,
	EXT_HTTP_DEFAULT_MAX_BYTES,
	EXT_HTTP_DEFAULT_TIMEOUT_MS,
	EXT_HTTP_MAX_BODY_BYTES,
	EXT_HTTP_RATE_WINDOW_MS,
	EXT_HTTP_RATE_MAX,
};
