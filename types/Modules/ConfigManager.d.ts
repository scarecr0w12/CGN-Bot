/**
 * Get current settings from database (with caching)
 * @param {boolean} forceRefresh - Force refresh from database
 * @returns {Object} Settings object with all configuration values
 */
export function get(forceRefresh?: boolean): any;
/**
 * Update settings in the database
 * @param {Object} updates - Object containing fields to update
 * @returns {Object} Updated settings
 */
export function update(updates: any): any;
/**
 * Invalidate the settings cache
 */
export function invalidateCache(): void;
/**
 * Check if a user is a maintainer (any level)
 * @param {string} userId - Discord user ID
 * @returns {boolean}
 */
export function isMaintainer(userId: string): boolean;
/**
 * Check if a user is a sudo maintainer
 * @param {string} userId - Discord user ID
 * @returns {boolean}
 */
export function isSudoMaintainer(userId: string): boolean;
/**
 * Check if a user is blocked globally
 * @param {string} userId - Discord user ID
 * @returns {boolean}
 */
export function isUserBlocked(userId: string): boolean;
/**
 * Check if a guild is blocked
 * @param {string} guildId - Discord guild ID
 * @returns {boolean}
 */
export function isGuildBlocked(guildId: string): boolean;
/**
 * Check if a user can perform a specific action based on permission levels
 * @param {string} action - Action name (eval, sudo, management, administration, shutdown)
 * @param {string} userId - Discord user ID
 * @returns {boolean}
 */
export function canDo(action: string, userId: string): boolean;
/**
 * Get the permission level for a user
 * @param {string} userId - Discord user ID
 * @returns {number} 0 = Host, 1 = Maintainer, 2 = Sudo Maintainer, -1 = None
 */
export function getUserLevel(userId: string): number;
/**
 * Check sudo mode access (compatible with old configJSON.perms.sudo check)
 * @param {string} userId - Discord user ID
 * @returns {boolean}
 */
export function checkSudoMode(userId: string): boolean;
/**
 * Fetch maintainer privileges for a user
 * @param {string} userId - Discord user ID
 * @returns {string[]} Array of action names the user can perform
 */
export function fetchMaintainerPrivileges(userId: string): string[];
/**
 * Synchronous version of fetchMaintainerPrivileges using cached settings
 * Use this in constructors or other sync contexts
 * @param {string} userId - Discord user ID
 * @returns {string[]} Array of action names the user can perform
 */
export function fetchMaintainerPrivilegesCached(userId: string): string[];
/**
 * Add a user to maintainers list
 * @param {string} userId - Discord user ID
 * @param {boolean} isSudo - Whether to add as sudo maintainer
 */
export function addMaintainer(userId: string, isSudo?: boolean): Promise<void>;
/**
 * Remove a user from maintainers list
 * @param {string} userId - Discord user ID
 */
export function removeMaintainer(userId: string): Promise<void>;
/**
 * Add a user to the blocklist
 * @param {string} userId - Discord user ID
 */
export function blockUser(userId: string): Promise<void>;
/**
 * Remove a user from the blocklist
 * @param {string} userId - Discord user ID
 */
export function unblockUser(userId: string): Promise<void>;
/**
 * Add a guild to the blocklist
 * @param {string} guildId - Discord guild ID
 */
export function blockGuild(guildId: string): Promise<void>;
/**
 * Remove a guild from the blocklist
 * @param {string} guildId - Discord guild ID
 */
export function unblockGuild(guildId: string): Promise<void>;
/**
 * Get synchronous access to cached settings (may be stale)
 * Use this only when async is not possible and you accept potentially stale data
 * @returns {Object|null} Cached settings or null if not yet loaded
 */
export function getCached(): any | null;
/**
 * Initialize the config manager by loading settings
 * Call this during bot startup after database connection
 */
export function initialize(): Promise<void>;
export namespace DEFAULTS {
    let sudoMaintainers: any[];
    let maintainers: any[];
    let wikiContributors: any[];
    let userBlocklist: any[];
    let guildBlocklist: any[];
    let activityBlocklist: any[];
    let botStatus: string;
    namespace botActivity {
        let name: string;
        let type: string;
        let twitchURL: string;
    }
    namespace perms {
        let eval: number;
        let sudo: number;
        let management: number;
        let administration: number;
        let shutdown: number;
    }
    let pmForward: boolean;
    let homepageMessageHTML: string;
    let headerImage: string;
    namespace injection {
        let headScript: string;
        let footerHTML: string;
    }
}
//# sourceMappingURL=ConfigManager.d.ts.map