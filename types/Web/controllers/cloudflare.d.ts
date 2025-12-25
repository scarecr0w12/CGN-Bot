/**
 * Get Cloudflare service status and overview
 */
export function getStatus(req: any, { res }: {
    res: any;
}): Promise<any>;
/**
 * Get Cloudflare analytics data
 */
export function getAnalytics(req: any, res: any): Promise<any>;
/**
 * Purge entire cache
 */
export function purgeAll(req: any, res: any): Promise<any>;
/**
 * Purge specific URLs from cache
 */
export function purgeUrls(req: any, res: any): Promise<any>;
/**
 * Toggle development mode
 */
export function toggleDevMode(req: any, res: any): Promise<any>;
/**
 * Set security level
 */
export function setSecurityLevel(req: any, res: any): Promise<any>;
/**
 * Enable "I'm Under Attack" mode
 */
export function enableUnderAttack(req: any, res: any): Promise<any>;
/**
 * Disable "I'm Under Attack" mode
 */
export function disableUnderAttack(req: any, res: any): Promise<any>;
/**
 * Get zone settings
 */
export function getSettings(req: any, res: any): Promise<any>;
/**
 * List firewall access rules
 */
export function listAccessRules(req: any, res: any): Promise<any>;
/**
 * Block an IP address
 */
export function blockIP(req: any, res: any): Promise<any>;
/**
 * Unblock/delete access rule
 */
export function deleteAccessRule(req: any, res: any): Promise<any>;
/**
 * Set cache level
 */
export function setCacheLevel(req: any, res: any): Promise<any>;
//# sourceMappingURL=cloudflare.d.ts.map