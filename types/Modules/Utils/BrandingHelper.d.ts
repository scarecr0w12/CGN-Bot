/**
 * Check if a server has custom branding enabled
 * @param {string} serverId - The server ID to check
 * @returns {Promise<boolean>}
 */
export function hasCustomBranding(serverId: string): Promise<boolean>;
/**
 * Get the appropriate footer for an embed based on branding settings
 * @param {Object} serverDocument - The server document
 * @param {string} serverId - The server ID to check for branding feature
 * @param {string} customText - Optional custom footer text
 * @returns {Promise<Object|null>} Footer object or null if branding disabled
 */
export function getEmbedFooter(serverDocument: any, serverId: string, customText?: string): Promise<any | null>;
/**
 * Apply branding to an embed object
 * @param {Object} embed - The embed object to modify
 * @param {Object} serverDocument - The server document
 * @param {string} serverId - The server ID to check for branding feature
 * @param {string} customText - Optional custom footer text
 * @returns {Promise<Object>} Modified embed object
 */
export function applyBranding(embed: any, serverDocument: any, serverId: string, customText?: string): Promise<any>;
/**
 * Build a branded embed with proper footer
 * @param {Object} options - Embed options
 * @param {Object} serverDocument - The server document
 * @param {string} serverId - The server ID for branding check
 * @returns {Promise<Object>} Embed object with branding applied
 */
export function buildBrandedEmbed(options: any, serverDocument: any, serverId: string): Promise<any>;
export namespace DEFAULT_BRANDING {
    let footerText: string;
    let footerIcon: any;
}
//# sourceMappingURL=BrandingHelper.d.ts.map