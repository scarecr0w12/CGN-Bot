/**
 * Cloudflare-specific middleware for Express
 *
 * Provides:
 * - Real IP extraction from CF-Connecting-IP header
 * - Cloudflare header verification
 * - Country/location data from CF headers
 * - Bot detection headers
 */

const { getIPv4Ranges, getIPv6Ranges } = require("../../Modules/CloudflareService");

/**
 * Check if request is coming through Cloudflare proxy
 * @param {Request} req - Express request object
 */
function isCloudflareRequest (req) {
	// Check for Cloudflare-specific headers
	return !!(req.headers["cf-ray"] || req.headers["cf-connecting-ip"]);
}

/**
 * Extract real client IP from Cloudflare headers
 * Falls back to X-Forwarded-For or remote address
 * @param {Request} req - Express request object
 */
const getRealIP = req => {
	// Cloudflare's header takes priority
	if (req.headers["cf-connecting-ip"]) {
		return req.headers["cf-connecting-ip"];
	}

	// Fall back to X-Forwarded-For
	if (req.headers["x-forwarded-for"]) {
		return req.headers["x-forwarded-for"].split(",")[0].trim();
	}

	// Last resort: socket remote address
	return req.socket?.remoteAddress || req.ip;
};

/**
 * Middleware to populate request with Cloudflare data
 * Adds: req.cloudflare object with various CF header data
 */
const cloudflareData = (req, res, next) => {
	req.cloudflare = {
		isProxy: isCloudflareRequest(req),
		ray: req.headers["cf-ray"] || null,
		ip: req.headers["cf-connecting-ip"] || null,
		country: req.headers["cf-ipcountry"] || null,
		visitor: null,
		botManagement: null,
	};

	// Parse CF-Visitor header (contains scheme info)
	if (req.headers["cf-visitor"]) {
		try {
			req.cloudflare.visitor = JSON.parse(req.headers["cf-visitor"]);
		} catch {
			// Invalid JSON, ignore
		}
	}

	// Bot management data (Enterprise feature)
	if (req.headers["cf-bot-score"]) {
		req.cloudflare.botManagement = {
			score: parseInt(req.headers["cf-bot-score"], 10),
			verifiedBot: req.headers["cf-verified-bot"] === "true",
			staticResource: req.headers["cf-static-resource"] === "true",
		};
	}

	// Set the real IP on the request
	req.realIP = getRealIP(req);

	next();
};

/**
 * Middleware to require requests come through Cloudflare
 * Useful for protecting origin server from direct access
 */
const requireCloudflare = (req, res, next) => {
	if (!isCloudflareRequest(req)) {
		logger.warn("Direct access attempt blocked", { ip: req.ip, path: req.path });
		return res.status(403).json({ error: "Direct access not allowed" });
	}
	next();
};

/**
 * Middleware to block requests from certain countries
 * Uses CF-IPCountry header
 * @param {string[]} blockedCountries - Array of ISO country codes to block
 */
const blockCountries = blockedCountries => (req, res, next) => {
	const country = req.headers["cf-ipcountry"];

	if (country && blockedCountries.includes(country.toUpperCase())) {
		logger.warn("Request blocked by country", { country, ip: getRealIP(req), path: req.path });
		return res.status(403).json({ error: "Access denied" });
	}
	next();
};

/**
 * Middleware to only allow requests from certain countries
 * Uses CF-IPCountry header
 * @param {string[]} allowedCountries - Array of ISO country codes to allow
 */
const allowCountries = allowedCountries => (req, res, next) => {
	const country = req.headers["cf-ipcountry"];

	// If no country header, allow (might not be through CF)
	if (!country) {
		return next();
	}

	if (!allowedCountries.includes(country.toUpperCase())) {
		logger.warn("Request blocked - country not allowed", { country, ip: getRealIP(req), path: req.path });
		return res.status(403).json({ error: "Access denied" });
	}
	next();
};

/**
 * Middleware to block likely bots based on bot score
 * Requires Cloudflare Bot Management (Enterprise)
 * @param {number} threshold - Minimum bot score to allow (1-99, higher = more human-like)
 */
const blockBots = (threshold = 30) => (req, res, next) => {
	const botScore = req.headers["cf-bot-score"];

	// If no bot score header, allow (feature might not be enabled)
	if (!botScore) {
		return next();
	}

	const score = parseInt(botScore, 10);

	// Verified bots (like search engines) get a pass
	if (req.headers["cf-verified-bot"] === "true") {
		return next();
	}

	if (score < threshold) {
		logger.warn("Request blocked by bot score", {
			score,
			ip: getRealIP(req),
			path: req.path,
			userAgent: req.headers["user-agent"],
		});
		return res.status(403).json({ error: "Request blocked" });
	}
	next();
};

/**
 * Generate Express trust proxy configuration for Cloudflare
 * Returns a function that can be used with app.set('trust proxy', fn)
 */
const getTrustProxyConfig = () => {
	const ipv4Ranges = getIPv4Ranges();
	const ipv6Ranges = getIPv6Ranges();
	const allRanges = [...ipv4Ranges, ...ipv6Ranges];

	// For simplicity, return the number of proxies or trust specific IPs
	// In production, you might want to use a proper CIDR matching library
	return (ip, i) => {
		// Trust first hop (Cloudflare proxy)
		if (i === 0) {
			// Simple prefix check - for production use proper CIDR matching
			for (const range of allRanges) {
				const [rangeStart] = range.split("/");
				if (ip.startsWith(rangeStart.split(".").slice(0, 2).join("."))) {
					return true;
				}
			}
		}
		return false;
	};
};

/**
 * Security headers middleware optimized for Cloudflare
 * Sets additional security headers that complement Cloudflare's
 */
const securityHeaders = (req, res, next) => {
	// Prevent clickjacking
	res.setHeader("X-Frame-Options", "SAMEORIGIN");

	// Prevent MIME type sniffing
	res.setHeader("X-Content-Type-Options", "nosniff");

	// XSS protection (legacy but still useful)
	res.setHeader("X-XSS-Protection", "1; mode=block");

	// Referrer policy
	res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

	// Permissions policy
	res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

	// If behind Cloudflare, we can be more aggressive with HSTS
	// since CF handles SSL termination
	if (isCloudflareRequest(req)) {
		res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
	}

	next();
};

/**
 * Rate limit bypass check for Cloudflare
 * Allows bypassing rate limits for verified Cloudflare health checks
 */
const bypassRateLimitForCF = (req, res, next) => {
	// Cloudflare health checks come from specific IPs and have specific UA
	const ua = req.headers["user-agent"] || "";

	if (ua.includes("Cloudflare-Healthchecks") || ua.includes("CF-UC")) {
		req.skipRateLimit = true;
	}

	next();
};

/**
 * Log Cloudflare request data for debugging
 */
const logCloudflareData = (req, res, next) => {
	if (isCloudflareRequest(req)) {
		logger.debug("Cloudflare request", {
			ray: req.headers["cf-ray"],
			ip: req.headers["cf-connecting-ip"],
			country: req.headers["cf-ipcountry"],
			botScore: req.headers["cf-bot-score"],
			path: req.path,
		});
	}
	next();
};

module.exports = {
	isCloudflareRequest,
	getRealIP,
	cloudflareData,
	requireCloudflare,
	blockCountries,
	allowCountries,
	blockBots,
	getTrustProxyConfig,
	securityHeaders,
	bypassRateLimitForCF,
	logCloudflareData,
};
