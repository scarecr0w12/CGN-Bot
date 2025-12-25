/**
 * Slug generation utility for SEO-friendly URLs
 * Converts names/titles to URL-safe slugs
 */

/**
 * Generate a URL-safe slug from a string
 * @param {string} text - The text to convert to a slug
 * @param {Object} options - Options for slug generation
 * @param {number} options.maxLength - Maximum length of the slug (default: 60)
 * @param {boolean} options.lowercase - Convert to lowercase (default: true)
 * @returns {string} The generated slug
 */
function generateSlug (text, options = {}) {
	const { maxLength = 60, lowercase = true } = options;

	if (!text || typeof text !== "string") {
		return "";
	}

	let slug = text
		// Replace accented characters with ASCII equivalents
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		// Replace spaces and underscores with hyphens
		.replace(/[\s_]+/g, "-")
		// Remove any character that isn't alphanumeric or hyphen
		.replace(/[^a-zA-Z0-9-]/g, "")
		// Replace multiple consecutive hyphens with single hyphen
		.replace(/-+/g, "-")
		// Remove leading/trailing hyphens
		.replace(/^-+|-+$/g, "");

	if (lowercase) {
		slug = slug.toLowerCase();
	}

	// Truncate to maxLength, but don't cut in the middle of a word
	if (slug.length > maxLength) {
		slug = slug.substring(0, maxLength);
		const lastHyphen = slug.lastIndexOf("-");
		if (lastHyphen > maxLength * 0.5) {
			slug = slug.substring(0, lastHyphen);
		}
	}

	return slug;
}

/**
 * Generate a unique slug by appending a suffix if needed
 * @param {string} text - The text to convert to a slug
 * @param {Function} existsCheck - Async function that returns true if slug already exists
 * @param {Object} options - Options for slug generation
 * @returns {Promise<string>} A unique slug
 */
async function generateUniqueSlug (text, existsCheck, options = {}) {
	const baseSlug = generateSlug(text, options);

	if (!baseSlug) {
		// Fallback to random string if no valid slug can be generated
		return `ext-${Date.now().toString(36)}`;
	}

	// Check if base slug is available
	const exists = await existsCheck(baseSlug);
	if (!exists) {
		return baseSlug;
	}

	// Try adding numeric suffixes
	for (let i = 2; i <= 100; i++) {
		const candidateSlug = `${baseSlug}-${i}`;
		const candidateExists = await existsCheck(candidateSlug);
		if (!candidateExists) {
			return candidateSlug;
		}
	}

	// Fallback: append timestamp
	return `${baseSlug}-${Date.now().toString(36)}`;
}

/**
 * Validate a slug format
 * @param {string} slug - The slug to validate
 * @returns {boolean} True if valid slug format
 */
function isValidSlug (slug) {
	if (!slug || typeof slug !== "string") {
		return false;
	}
	// Must be lowercase alphanumeric with hyphens, 2-60 chars
	return /^[a-z0-9][a-z0-9-]{0,58}[a-z0-9]$|^[a-z0-9]{1,2}$/.test(slug);
}

module.exports = {
	generateSlug,
	generateUniqueSlug,
	isValidSlug,
};
