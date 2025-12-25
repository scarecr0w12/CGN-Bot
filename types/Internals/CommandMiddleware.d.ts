/**
 * Command Middleware Framework
 * Provides extensible middleware for command validation and logging
 */
export class CommandMiddleware {
    middlewares: any[];
    /**
     * Register a middleware function
     * @param {Function} middleware - Middleware function (context, next) => Promise<void>
     * @param {number} priority - Execution priority (lower runs first)
     */
    use(middleware: Function, priority?: number): void;
    /**
     * Execute all middlewares in order
     * @param {Object} context - Command execution context
     * @returns {Promise<{continue: boolean, error?: string}>}
     */
    execute(context: any): Promise<{
        continue: boolean;
        error?: string;
    }>;
    /**
     * Clear all middlewares
     */
    clear(): void;
    /**
     * Get middleware count
     * @returns {number}
     */
    count(): number;
}
/**
 * Logging middleware - logs command execution
 */
export function loggingMiddleware(context: any, next: any): Promise<void>;
/**
 * Rate limiting middleware - prevents abuse
 */
export function rateLimitMiddleware(maxCommands?: number, windowMs?: number): (context: any, next: any) => Promise<void>;
/**
 * Analytics middleware - tracks command usage
 */
export function analyticsMiddleware(context: any, next: any): Promise<void>;
/**
 * Maintenance mode middleware - blocks commands during maintenance
 */
export function maintenanceModeMiddleware(allowedUserIds?: any[]): (context: any, next: any) => Promise<void>;
/**
 * Guild blacklist middleware - blocks commands in blacklisted guilds
 */
export function guildBlacklistMiddleware(blacklistedGuilds?: any[]): (context: any, next: any) => Promise<void>;
/**
 * User blacklist middleware - blocks commands from blacklisted users
 */
export function userBlacklistMiddleware(blacklistedUsers?: any[]): (context: any, next: any) => Promise<void>;
/**
 * Validation middleware - validates command structure
 */
export function validationMiddleware(context: any, next: any): Promise<void>;
//# sourceMappingURL=CommandMiddleware.d.ts.map