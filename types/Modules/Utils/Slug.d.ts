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
export function generateSlug(text: string, options?: {
    maxLength: number;
    lowercase: boolean;
}): string;
/**
 * Generate a unique slug by appending a suffix if needed
 * @param {string} text - The text to convert to a slug
 * @param {Function} existsCheck - Async function that returns true if slug already exists
 * @param {Object} options - Options for slug generation
 * @returns {Promise<string>} A unique slug
 */
export function generateUniqueSlug(text: string, existsCheck: Function, options?: any): Promise<string>;
/**
 * Validate a slug format
 * @param {string} slug - The slug to validate
 * @returns {boolean} True if valid slug format
 */
export function isValidSlug(slug: string): boolean;
//# sourceMappingURL=Slug.d.ts.map