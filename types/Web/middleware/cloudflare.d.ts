/**
 * Check if request is coming through Cloudflare proxy
 * @param {Request} req - Express request object
 */
export function isCloudflareRequest(req: Request): boolean;
/**
 * Extract real client IP from Cloudflare headers
 * Falls back to X-Forwarded-For or remote address
 * @param {Request} req - Express request object
 */
export function getRealIP(req: Request): any;
/**
 * Middleware to populate request with Cloudflare data
 * Adds: req.cloudflare object with various CF header data
 */
export function cloudflareData(req: any, res: any, next: any): void;
/**
 * Middleware to require requests come through Cloudflare
 * Useful for protecting origin server from direct access
 */
export function requireCloudflare(req: any, res: any, next: any): any;
/**
 * Middleware to block requests from certain countries
 * Uses CF-IPCountry header
 * @param {string[]} blockedCountries - Array of ISO country codes to block
 */
export function blockCountries(blockedCountries: string[]): (req: any, res: any, next: any) => any;
/**
 * Middleware to only allow requests from certain countries
 * Uses CF-IPCountry header
 * @param {string[]} allowedCountries - Array of ISO country codes to allow
 */
export function allowCountries(allowedCountries: string[]): (req: any, res: any, next: any) => any;
/**
 * Middleware to block likely bots based on bot score
 * Requires Cloudflare Bot Management (Enterprise)
 * @param {number} threshold - Minimum bot score to allow (1-99, higher = more human-like)
 */
export function blockBots(threshold?: number): (req: any, res: any, next: any) => any;
/**
 * Generate Express trust proxy configuration for Cloudflare
 * Returns a function that can be used with app.set('trust proxy', fn)
 */
export function getTrustProxyConfig(): (ip: any, i: any) => boolean;
/**
 * Security headers middleware optimized for Cloudflare
 * Sets additional security headers that complement Cloudflare's
 */
export function securityHeaders(req: any, res: any, next: any): void;
/**
 * Rate limit bypass check for Cloudflare
 * Allows bypassing rate limits for verified Cloudflare health checks
 */
export function bypassRateLimitForCF(req: any, res: any, next: any): void;
/**
 * Log Cloudflare request data for debugging
 */
export function logCloudflareData(req: any, res: any, next: any): void;
//# sourceMappingURL=cloudflare.d.ts.map