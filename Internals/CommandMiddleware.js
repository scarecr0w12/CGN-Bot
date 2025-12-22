/**
 * @fileoverview Command Middleware Framework
 * Provides extensible middleware system for command processing with priority-based execution.
 *
 * @module Internals/CommandMiddleware
 */

// Performance monitoring
let metrics = null;
try {
	metrics = require("../Modules/Metrics");
} catch (err) {
	// Metrics not available
}

class CommandMiddleware {
	constructor () {
		this.middlewares = [];
	}

	/**
	 * Register a middleware function
	 * @param {Function} middleware - Middleware function (context, next) => Promise<void>
	 * @param {number} priority - Execution priority (lower runs first)
	 */
	use (middleware, priority = 100) {
		this.middlewares.push({ fn: middleware, priority });
		this.middlewares.sort((a, b) => a.priority - b.priority);

		// Update middleware count metric
		if (metrics) {
			metrics.updateMiddlewareCount(this.middlewares.length);
		}
	}

	/**
	 * Execute all middlewares in order
	 * @param {Object} context - Command execution context
	 * @returns {Promise<{continue: boolean, error?: string}>}
	 */
	async execute (context) {
		let index = 0;

		const next = async () => {
			if (index >= this.middlewares.length) {
				return { continue: true };
			}

			const middleware = this.middlewares[index++];
			const start = process.hrtime.bigint();

			try {
				await middleware.fn(context, next);

				// Record successful middleware execution
				if (metrics) {
					const duration = Number(process.hrtime.bigint() - start) / 1e9;
					const name = middleware.fn.name || `middleware_${index}`;
					metrics.recordMiddlewareExecution(name, duration);
				}

				return { continue: true };
			} catch (error) {
				// Record middleware failure
				if (metrics) {
					const name = middleware.fn.name || `middleware_${index}`;
					metrics.recordMiddlewareBlock(name, error.message || "error");
				}

				return {
					continue: false,
					error: error.message || "Middleware error",
				};
			}
		};

		return next();
	}

	/**
	 * Clear all middlewares
	 */
	clear () {
		this.middlewares = [];
	}

	/**
	 * Get middleware count
	 * @returns {number}
	 */
	count () {
		return this.middlewares.length;
	}
}

// Built-in middleware functions

/**
 * Logging middleware - logs command execution
 */
const loggingMiddleware = async (context, next) => {
	const start = Date.now();
	const userId = context.user?.id || context.author?.id;
	const commandName = context.commandName || context.command?.name;

	logger.debug("Command execution started", {
		command: commandName,
		user: userId,
		guild: context.guild?.id,
	});

	await next();

	const duration = Date.now() - start;
	logger.debug("Command execution completed", {
		command: commandName,
		user: userId,
		duration,
	});
};

/**
 * Rate limiting middleware - prevents abuse
 */
const rateLimitMiddleware = (maxCommands = 5, windowMs = 10000) => {
	const userRates = new Map();

	return async (context, next) => {
		const userId = context.user?.id || context.author?.id;
		const now = Date.now();

		if (!userRates.has(userId)) {
			userRates.set(userId, []);
		}

		const userCommands = userRates.get(userId);
		const recentCommands = userCommands.filter(ts => now - ts < windowMs);

		if (recentCommands.length >= maxCommands) {
			throw new Error("You're using commands too quickly. Please slow down.");
		}

		recentCommands.push(now);
		userRates.set(userId, recentCommands);

		// Clean up old entries
		if (userRates.size > 10000) {
			const cutoff = now - windowMs;
			for (const [id, timestamps] of userRates) {
				const recent = timestamps.filter(ts => ts > cutoff);
				if (recent.length === 0) {
					userRates.delete(id);
				} else {
					userRates.set(id, recent);
				}
			}
		}

		await next();
	};
};

/**
 * Analytics middleware - tracks command usage
 */
const analyticsMiddleware = async (context, next) => {
	const commandName = context.commandName || context.command?.name;

	// Increment command counter
	if (global.commandStats) {
		if (!global.commandStats[commandName]) {
			global.commandStats[commandName] = 0;
		}
		global.commandStats[commandName]++;
	}

	await next();

	// Could send to analytics service here
	// const userId = context.user?.id || context.author?.id;
	// const guildId = context.guild?.id;
	// await AnalyticsCollector.trackCommand(commandName, userId, guildId);
};

/**
 * Maintenance mode middleware - blocks commands during maintenance
 */
const maintenanceModeMiddleware = (allowedUserIds = []) => async (context, next) => {
	const userId = context.user?.id || context.author?.id;

	if (global.maintenanceMode && !allowedUserIds.includes(userId)) {
		throw new Error("The bot is currently in maintenance mode. Please try again later.");
	}

	await next();
};

/**
 * Guild blacklist middleware - blocks commands in blacklisted guilds
 */
const guildBlacklistMiddleware = (blacklistedGuilds = []) => async (context, next) => {
	const guildId = context.guild?.id;

	if (guildId && blacklistedGuilds.includes(guildId)) {
		throw new Error("This server is not authorized to use this bot.");
	}

	await next();
};

/**
 * User blacklist middleware - blocks commands from blacklisted users
 */
const userBlacklistMiddleware = (blacklistedUsers = []) => async (context, next) => {
	const userId = context.user?.id || context.author?.id;

	if (blacklistedUsers.includes(userId)) {
		throw new Error("You are not authorized to use this bot.");
	}

	await next();
};

/**
 * Validation middleware - validates command structure
 */
const validationMiddleware = async (context, next) => {
	const command = context.command;

	if (!command) {
		throw new Error("Command not found");
	}

	if (!command.name) {
		throw new Error("Invalid command structure: missing name");
	}

	if (typeof command.execute !== "function" && typeof command.run !== "function") {
		throw new Error("Invalid command structure: missing execute/run function");
	}

	await next();
};

module.exports = {
	CommandMiddleware,
	loggingMiddleware,
	rateLimitMiddleware,
	analyticsMiddleware,
	maintenanceModeMiddleware,
	guildBlacklistMiddleware,
	userBlacklistMiddleware,
	validationMiddleware,
};
