export namespace DEFAULTS {
    let PREFIX: string;
    let LANGUAGE: string;
    let MOD_LOG_ENABLED: boolean;
    let MODERATION_ENABLED: boolean;
    let POINTS_ENABLED: boolean;
    let AFK_ENABLED: boolean;
    let STARBOARD_ENABLED: boolean;
    let STARBOARD_MIN_STARS: number;
    let AUTO_ESCALATION_ENABLED: boolean;
    let SPAM_FILTER_ENABLED: boolean;
    let INVITE_FILTER_ENABLED: boolean;
    let MENTION_FILTER_ENABLED: boolean;
}
/**
 * Get command prefix for a server
 * @param {Object} serverDocument - Server document
 * @returns {string} Command prefix
 */
export function getPrefix(serverDocument: any): string;
/**
 * Get server language
 * @param {Object} serverDocument - Server document
 * @returns {string} Language code
 */
export function getLanguage(serverDocument: any): string;
/**
 * Check if moderation is enabled
 * @param {Object} serverDocument - Server document
 * @returns {boolean}
 */
export function isModEnabled(serverDocument: any): boolean;
/**
 * Check if mod log is enabled
 * @param {Object} serverDocument - Server document
 * @returns {boolean}
 */
export function isModLogEnabled(serverDocument: any): boolean;
/**
 * Get mod log channel ID
 * @param {Object} serverDocument - Server document
 * @returns {string|null} Channel ID or null
 */
export function getModLogChannel(serverDocument: any): string | null;
/**
 * Check if auto-escalation is enabled
 * @param {Object} serverDocument - Server document
 * @returns {boolean}
 */
export function isAutoEscalationEnabled(serverDocument: any): boolean;
/**
 * Get auto-escalation thresholds
 * @param {Object} serverDocument - Server document
 * @returns {Array} Escalation thresholds
 */
export function getEscalationThresholds(serverDocument: any): any[];
/**
 * Check if spam filter is enabled
 * @param {Object} serverDocument - Server document
 * @returns {boolean}
 */
export function isSpamFilterEnabled(serverDocument: any): boolean;
/**
 * Check if invite filter is enabled
 * @param {Object} serverDocument - Server document
 * @returns {boolean}
 */
export function isInviteFilterEnabled(serverDocument: any): boolean;
/**
 * Check if mention spam filter is enabled
 * @param {Object} serverDocument - Server document
 * @returns {boolean}
 */
export function isMentionFilterEnabled(serverDocument: any): boolean;
/**
 * Get a specific filter configuration
 * @param {Object} serverDocument - Server document
 * @param {string} filterType - Filter type (spam, invites, mentions, etc.)
 * @returns {Object|null} Filter config or null
 */
export function getFilter(serverDocument: any, filterType: string): any | null;
/**
 * Get all active filters
 * @param {Object} serverDocument - Server document
 * @returns {Array} Active filter configurations
 */
export function getActiveFilters(serverDocument: any): any[];
/**
 * Check if points system is enabled
 * @param {Object} serverDocument - Server document
 * @returns {boolean}
 */
export function isPointsEnabled(serverDocument: any): boolean;
/**
 * Check if AFK system is enabled
 * @param {Object} serverDocument - Server document
 * @returns {boolean}
 */
export function isAfkEnabled(serverDocument: any): boolean;
/**
 * Check if starboard is enabled
 * @param {Object} serverDocument - Server document
 * @returns {boolean}
 */
export function isStarboardEnabled(serverDocument: any): boolean;
/**
 * Get starboard configuration
 * @param {Object} serverDocument - Server document
 * @returns {Object} Starboard config with defaults
 */
export function getStarboardConfig(serverDocument: any): any;
/**
 * Get admin roles for a server
 * @param {Object} serverDocument - Server document
 * @returns {Array} Admin role configurations
 */
export function getAdminRoles(serverDocument: any): any[];
/**
 * Get admin level for a specific role
 * @param {Object} serverDocument - Server document
 * @param {string} roleId - Discord role ID
 * @returns {number} Admin level (0 if not found)
 */
export function getRoleAdminLevel(serverDocument: any, roleId: string): number;
/**
 * Check if a command is enabled
 * @param {Object} serverDocument - Server document
 * @param {string} commandName - Command name
 * @returns {boolean}
 */
export function isCommandEnabled(serverDocument: any, commandName: string): boolean;
/**
 * Get command configuration
 * @param {Object} serverDocument - Server document
 * @param {string} commandName - Command name
 * @returns {Object} Command config with defaults
 */
export function getCommandConfig(serverDocument: any, commandName: string): any;
/**
 * Get welcome/leave message configuration
 * @param {Object} serverDocument - Server document
 * @param {string} type - 'welcome' or 'leave'
 * @returns {Object} Message config
 */
export function getMessageConfig(serverDocument: any, type: string): any;
/**
 * Get all hot config values at once for batch access
 * @param {Object} serverDocument - Server document
 * @returns {Object} All commonly accessed config values
 */
export function getHotConfig(serverDocument: any): any;
//# sourceMappingURL=ServerConfigHelper.d.ts.map