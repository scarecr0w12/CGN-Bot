/**
 * Cloudflare Turnstile Middleware
 * Bot protection for form submissions
 */

const { getInstance: getCloudflareService } = require("../../Modules/CloudflareService");
const logger = global.logger || console;

/**
 * Verify Turnstile token from form submission
 * Checks for cf-turnstile-response field in request body
 * Sets req.turnstileVerified = true if valid
 */
const verifyTurnstile = async (req, res, next) => {
	// Skip verification if Turnstile is not configured
	if (!process.env.CLOUDFLARE_TURNSTILE_SECRET || !process.env.CLOUDFLARE_TURNSTILE_SITEKEY) {
		logger.warn("Turnstile verification skipped - not configured");
		req.turnstileVerified = true; // Allow through if not configured
		return next();
	}

	const token = req.body["cf-turnstile-response"];

	if (!token) {
		logger.warn("Turnstile token missing from form submission", {
			path: req.path,
			ip: req.realIP || req.ip,
		});
		return res.status(400).json({
			success: false,
			error: "Bot verification failed. Please try again.",
		});
	}

	try {
		const cloudflare = getCloudflareService();
		const remoteIP = req.realIP || req.headers["cf-connecting-ip"] || req.ip;

		const result = await cloudflare.verifyTurnstile(token, remoteIP);

		if (result.success) {
			req.turnstileVerified = true;
			req.turnstileData = {
				challengeTs: result.challenge_ts,
				hostname: result.hostname,
			};
			return next();
		} else {
			logger.warn("Turnstile verification failed", {
				path: req.path,
				ip: remoteIP,
				errorCodes: result["error-codes"],
			});
			return res.status(403).json({
				success: false,
				error: "Bot verification failed. Please refresh and try again.",
				errorCodes: result["error-codes"],
			});
		}
	} catch (err) {
		logger.error("Turnstile verification error", {}, err);
		// In case of server error, you can choose to:
		// 1. Block the request (secure but may cause false negatives)
		// 2. Allow the request (user-friendly but less secure)
		// Here we block for security
		return res.status(500).json({
			success: false,
			error: "Verification service unavailable. Please try again later.",
		});
	}
};

/**
 * Optional Turnstile verification - logs warning but allows through on failure
 * Useful for non-critical forms where you want data but also want to track bots
 */
const verifyTurnstileOptional = async (req, res, next) => {
	if (!process.env.CLOUDFLARE_TURNSTILE_SECRET || !process.env.CLOUDFLARE_TURNSTILE_SITEKEY) {
		req.turnstileVerified = false;
		req.turnstileSkipped = true;
		return next();
	}

	const token = req.body["cf-turnstile-response"];

	if (!token) {
		req.turnstileVerified = false;
		logger.info("Turnstile token missing (optional verification)", {
			path: req.path,
			ip: req.realIP || req.ip,
		});
		return next();
	}

	try {
		const cloudflare = getCloudflareService();
		const remoteIP = req.realIP || req.headers["cf-connecting-ip"] || req.ip;

		const result = await cloudflare.verifyTurnstile(token, remoteIP);
		req.turnstileVerified = result.success;

		if (!result.success) {
			logger.info("Turnstile verification failed (optional)", {
				path: req.path,
				ip: remoteIP,
				errorCodes: result["error-codes"],
			});
		}
	} catch (err) {
		logger.error("Turnstile verification error (optional)", {}, err);
		req.turnstileVerified = false;
	}

	// Always allow through for optional verification
	next();
};

/**
 * Middleware to add Turnstile configuration to response locals
 * Makes sitekey available to templates
 */
const addTurnstileConfig = (req, res, next) => {
	res.locals.turnstile = {
		enabled: !!(process.env.CLOUDFLARE_TURNSTILE_SECRET && process.env.CLOUDFLARE_TURNSTILE_SITEKEY),
		sitekey: process.env.CLOUDFLARE_TURNSTILE_SITEKEY || "",
		theme: process.env.CLOUDFLARE_TURNSTILE_THEME || "auto", // auto, light, dark
		size: process.env.CLOUDFLARE_TURNSTILE_SIZE || "normal", // normal, compact
	};
	next();
};

module.exports = {
	verifyTurnstile,
	verifyTurnstileOptional,
	addTurnstileConfig,
};
