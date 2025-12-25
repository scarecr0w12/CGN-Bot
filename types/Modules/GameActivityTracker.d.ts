/**
 * Normalize game name for consistent tracking
 * @param {string} name - Game name
 * @returns {string} Normalized game name (lowercase, trimmed)
 */
export function normalizeGameName(name: string): string;
/**
 * Check if an activity is likely a non-game application
 * @param {string} name - Activity name
 * @returns {boolean}
 */
export function isNonGame(name: string): boolean;
/**
 * Start tracking a game session
 * @param {Object} serverDocument - Server document
 * @param {string} userId - User ID
 * @param {string} gameName - Game name
 */
export function startSession(serverDocument: any, userId: string, gameName: string): Promise<void>;
/**
 * End a game session and record playtime
 * @param {Object} serverDocument - Server document
 * @param {string} userId - User ID
 * @returns {Object|null} Session data with duration, or null if no session
 */
export function endSession(serverDocument: any, userId: string): any | null;
/**
 * Handle presence update for game tracking
 * @param {Object} oldPresence - Old presence
 * @param {Object} newPresence - New presence
 */
export function handlePresenceUpdate(oldPresence: any, newPresence: any): Promise<void>;
/**
 * Get user's game activity for profile display
 * @param {string} userId - User ID
 * @param {number} limit - Max number of games to return
 * @returns {Array} Sorted game activity array
 */
export function getUserGameActivity(userId: string, limit?: number): any[];
/**
 * Format playtime for display
 * @param {number} minutes - Total minutes
 * @returns {string} Formatted time string
 */
export function formatPlaytime(minutes: number): string;
/**
 * Get relative time string for last played
 * @param {Date} date - Last played date
 * @returns {string} Relative time string
 */
export function getLastPlayedText(date: Date): string;
/**
 * Game Activity Tracker Module
 * Tracks user game playtime based on Discord presence updates
 */
export const NON_GAME_APPS: string[];
//# sourceMappingURL=GameActivityTracker.d.ts.map