/**
 * Get allowed HTTP hosts for extension sandbox
 * Priority: Environment variable > Database settings > Default list
 * @returns {Promise<string[]>} Array of allowed hostnames
 */
export function getAllowedExtensionHttpHosts(): Promise<string[]>;
/**
 * Check if an IP address is private/internal
 * @param {string} ip - IP address to check
 * @returns {boolean} True if private IP
 */
export function isPrivateIp(ip: string): boolean;
/**
 * Check if URL is allowed based on network capability level
 * @param {string} rawUrl - The URL to check
 * @param {string} networkCapability - The capability level (none, allowlist_only, network, network_advanced)
 * @param {boolean} networkApproved - Whether the capability has been approved
 * @param {string[]} allowlist - The static allowlist for allowlist_only mode
 * @returns {{ok: boolean, url?: URL, error?: string}}
 */
export function isAllowedUrl(rawUrl: string, networkCapability: string, networkApproved: boolean, allowlist: string[]): {
    ok: boolean;
    url?: URL;
    error?: string;
};
export const DEFAULT_HTTP_ALLOWLIST: string[];
export const EXT_HTTP_DEFAULT_MAX_BYTES: number;
export const EXT_HTTP_DEFAULT_TIMEOUT_MS: 6000;
export const EXT_HTTP_MAX_BODY_BYTES: number;
export const EXT_HTTP_RATE_WINDOW_MS: number;
export const EXT_HTTP_RATE_MAX: 30;
//# sourceMappingURL=NetworkValidator.d.ts.map