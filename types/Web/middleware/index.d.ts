export function clearInjectionCache(): void;
export function loadInjection(req: any, res: any, next: any): Promise<void>;
export function populateRequest(route: any): (req: any, res: any, next: any) => void;
export function registerTraffic(req: any, res: any, next: any): void;
export function checkUnavailable(req: any, res: any, next: any): any;
export function checkUnavailableAPI(req: any, res: any, next: any): any;
export function markAsAPI(req: any, res: any, next: any): void;
export function enforceProtocol(req: any, res: any, next: any): any;
export function setHeaders(req: any, res: any, next: any): void;
export function logRequest(req: any, res: any, next: any): void;
export function getConsoleSection(req: any, res: any, next: any): void;
/**
 * Middleware to require a specific feature for access
 * Premium is per-server, so checks req.svr.id (dashboard) or req.params.svrid (API)
 * Usage: router.get('/path', middleware.requireFeature('feature_key'), controller)
 * @param {string} featureKey - The feature ID to check
 * @returns {Function} Express middleware
 */
export function requireFeature(featureKey: string): Function;
/**
 * Middleware to require a minimum tier level for access
 * Premium is per-server, so checks req.svr.id (dashboard) or req.params.svrid (API)
 * Usage: router.get('/path', middleware.requireTierLevel(2), controller)
 * @param {number} minLevel - Minimum tier level required
 * @returns {Function} Express middleware
 */
export function requireTierLevel(minLevel: number): Function;
/**
 * Middleware to populate user's tier info on the request
 * Usage: router.get('/path', middleware.populateUserTier, controller)
 */
export function populateUserTier(req: any, res: any, next: any): Promise<void>;
/**
 * Middleware to check subscription expiration
 */
export function checkSubscriptionExpiration(req: any, res: any, next: any): Promise<void>;
export function getInjection(): Promise<{
    headScript: string;
    footerHTML: string;
}>;
//# sourceMappingURL=index.d.ts.map