export = CommandExecutor;
/**
 * CommandExecutor class for unified command execution across prefix and slash commands.
 * Handles validation, permissions, cooldowns, context checking, and error handling.
 *
 * @class CommandExecutor
 *
 * @example
 * const executor = new CommandExecutor(client);
 *
 * // Execute prefix command
 * await executor.execute(command, message, args, false);
 *
 * // Execute slash command
 * await executor.execute(command, interaction, options, true);
 */
declare class CommandExecutor {
    /**
     * Creates a new CommandExecutor instance.
     *
     * @constructor
     * @param {Client} client - Discord.js client instance
     *
     * @example
     * const executor = new CommandExecutor(client);
     */
    constructor(client: Client);
    /**
     * Discord.js client instance
     * @type {Client}
     * @private
     */
    private client;
    /**
     * Collection of command cooldowns by command name and user ID
     * @type {Collection<string, Collection<string, number>>}
     * @private
     */
    private cooldowns;
    /**
     * Validate command permissions
     * @param {Object} command - Command object
     * @param {Object} context - Execution context (message or interaction)
     * @returns {{valid: boolean, error?: string}}
     */
    validatePermissions(command: any, context: any): {
        valid: boolean;
        error?: string;
    };
    /**
     * Check and enforce command cooldowns
     * @param {Object} command - Command object
     * @param {string} userId - User ID
     * @returns {{allowed: boolean, timeLeft?: number}}
     */
    checkCooldown(command: any, userId: string): {
        allowed: boolean;
        timeLeft?: number;
    };
    /**
     * Validate command context (DM vs Guild)
     * @param {Object} command - Command object
     * @param {Object} context - Execution context
     * @returns {{valid: boolean, error?: string}}
     */
    validateContext(command: any, context: any): {
        valid: boolean;
        error?: string;
    };
    /**
     * Parse and validate command arguments
     * @param {Object} command - Command object
     * @param {Array|Object} args - Arguments (array for prefix, object for slash)
     * @param {boolean} isSlash - Whether this is a slash command
     * @returns {{valid: boolean, parsed?: Object, error?: string}}
     */
    validateArguments(command: any, args: any[] | any, isSlash?: boolean): {
        valid: boolean;
        parsed?: any;
        error?: string;
    };
    /**
     * Execute a command with full validation and error handling
     * @param {Object} command - Command object
     * @param {Object} context - Execution context (message or interaction)
     * @param {Array|Object} args - Command arguments
     * @param {boolean} isSlash - Whether this is a slash command
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    execute(command: any, context: any, args?: any[] | any, isSlash?: boolean): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Send an error message to the user
     * @param {Object} context - Message or interaction
     * @param {string} error - Error message
     * @param {boolean} isSlash - Whether this is a slash command
     * @private
     */
    private sendError;
    /**
     * Get cooldown statistics
     * @returns {Object} Cooldown stats
     */
    getCooldownStats(): any;
    /**
     * Clear expired cooldowns
     */
    clearExpiredCooldowns(): number;
}
//# sourceMappingURL=CommandExecutor.d.ts.map