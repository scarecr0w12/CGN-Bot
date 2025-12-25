/**
 * Primary profile page handler
 */
export function primaryProfile(req: any, res: any): Promise<any>;
/**
 * Server profile page handler
 */
export function serverProfile(req: any, res: any): Promise<any>;
/**
 * Edit primary profile page
 */
export function editPrimaryProfile(req: any, res: any): Promise<any>;
/**
 * Edit server profile page
 */
export function editServerProfile(req: any, res: any): Promise<any>;
/**
 * API: Update primary profile
 */
export function updatePrimaryProfile(req: any, res: any): Promise<any>;
/**
 * API: Update server profile
 */
export function updateServerProfile(req: any, res: any): Promise<any>;
/**
 * Get user data for profile display
 * @param {Object} client - Discord client
 * @param {string} userId - User ID to look up
 * @returns {Object|null} User data or null
 */
export function getUserData(client: any, userId: string): any | null;
/**
 * Calculate account age string
 * @param {Date} createdAt - Account creation date
 * @returns {Object} Account age info
 */
export function getAccountAge(createdAt: Date): any;
/**
 * Get mutual servers between user and viewer
 * @param {Object} client - Discord client
 * @param {string} targetUserId - Profile user ID
 * @param {string} viewerUserId - Viewer user ID (optional)
 * @returns {Array} Array of mutual server objects
 */
export function getMutualServers(client: any, targetUserId: string, viewerUserId?: string): any[];
//# sourceMappingURL=profile.d.ts.map