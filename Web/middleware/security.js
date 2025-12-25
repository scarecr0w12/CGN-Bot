/**
 * Security middleware for input sanitization and XSS protection
 */

const xss = require("xss");

/**
 * Sanitize user input to prevent XSS attacks
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware
 */
module.exports.sanitizeInput = (options = {}) => {
	const xssOptions = {
		whiteList: options.whiteList || {},
		stripIgnoreTag: true,
		stripIgnoreTagBody: ["script", "style"],
	};

	return (req, res, next) => {
		// Sanitize body parameters
		if (req.body && typeof req.body === "object") {
			req.body = sanitizeObject(req.body, xssOptions);
		}

		// Sanitize query parameters
		if (req.query && typeof req.query === "object") {
			req.query = sanitizeObject(req.query, xssOptions);
		}

		// Add helper function to response for safe rendering
		res.locals.sanitize = text => xss(text, xssOptions);

		next();
	};
};

/**
 * Recursively sanitize object properties
 * @param {Object} obj - Object to sanitize
 * @param {Object} xssOptions - XSS filter options
 * @returns {Object} Sanitized object
 */
function sanitizeObject (obj, xssOptions) {
	if (!obj || typeof obj !== "object") {
		return obj;
	}

	const sanitized = Array.isArray(obj) ? [] : {};

	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			const value = obj[key];

			if (typeof value === "string") {
				// Only sanitize strings that might contain HTML
				// Skip sanitization for fields that should preserve formatting
				if (key === "code" || key === "password" || key === "token") {
					sanitized[key] = value;
				} else {
					sanitized[key] = xss(value, xssOptions);
				}
			} else if (typeof value === "object" && value !== null) {
				sanitized[key] = sanitizeObject(value, xssOptions);
			} else {
				sanitized[key] = value;
			}
		}
	}

	return sanitized;
}

/**
 * Set security headers for API responses
 */
module.exports.apiSecurityHeaders = (req, res, next) => {
	res.setHeader("X-Content-Type-Options", "nosniff");
	res.setHeader("X-Frame-Options", "DENY");
	res.setHeader("X-XSS-Protection", "1; mode=block");
	next();
};

/**
 * Validate and sanitize JSON responses
 */
module.exports.sanitizeJsonResponse = (req, res, next) => {
	const originalJson = res.json;

	res.json = function (data) {
		// Ensure we're sending proper JSON, not raw HTML/text
		if (typeof data === "string") {
			data = { message: data };
		}
		return originalJson.call(this, data);
	};

	next();
};
