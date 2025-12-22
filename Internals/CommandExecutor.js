/**
 * @fileoverview Shared Command Execution Logic
 * Consolidates duplicate logic between prefix and slash commands for unified validation,
 * permission checking, cooldown management, and error handling.
 *
 * @module Internals/CommandExecutor
 * @requires discord.js
 *
 * @example
 * const CommandExecutor = require('./Internals/CommandExecutor');
 * const executor = new CommandExecutor(client);
 *
 * // Execute a command with full validation
 * await executor.execute(command, context, args, isSlash);
 */

const { Collection } = require("discord.js");

// Performance monitoring
let metrics = null;
try {
	metrics = require("../Modules/Metrics");
} catch (err) {
	// Metrics not available
}

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
class CommandExecutor {
	/**
	 * Creates a new CommandExecutor instance.
	 *
	 * @constructor
	 * @param {Client} client - Discord.js client instance
	 *
	 * @example
	 * const executor = new CommandExecutor(client);
	 */
	constructor (client) {
		/**
		 * Discord.js client instance
		 * @type {Client}
		 * @private
		 */
		this.client = client;

		/**
		 * Collection of command cooldowns by command name and user ID
		 * @type {Collection<string, Collection<string, number>>}
		 * @private
		 */
		this.cooldowns = new Collection();
	}

	/**
	 * Validate command permissions
	 * @param {Object} command - Command object
	 * @param {Object} context - Execution context (message or interaction)
	 * @returns {{valid: boolean, error?: string}}
	 */
	validatePermissions (command, context) {
		const start = process.hrtime.bigint();
		const member = context.member;
		const guild = context.guild;
		let result;

		if (!member || !guild) {
			result = { valid: false, error: "This command can only be used in a server." };
		} else if (command.permissions && command.permissions.length > 0) {
			// Check user permissions
			const missing = command.permissions.filter(perm => !member.permissions.has(perm));
			if (missing.length > 0) {
				result = {
					valid: false,
					error: `You need the following permissions: ${missing.join(", ")}`,
				};
			}
		} else if (command.botPermissions && command.botPermissions.length > 0) {
			// Check bot permissions
			const botMember = guild.members.cache.get(this.client.user.id);
			const missing = command.botPermissions.filter(perm => !botMember.permissions.has(perm));
			if (missing.length > 0) {
				result = {
					valid: false,
					error: `I need the following permissions: ${missing.join(", ")}`,
				};
			}
		}

		if (!result) {
			result = { valid: true };
		}

		// Record validation timing
		if (metrics && !result.valid) {
			const duration = Number(process.hrtime.bigint() - start) / 1e9;
			metrics.recordCommandValidation("permissions", duration);
			metrics.recordCommandValidationFailure("permissions");
		}

		return result;
	}

	/**
	 * Check and enforce command cooldowns
	 * @param {Object} command - Command object
	 * @param {string} userId - User ID
	 * @returns {{allowed: boolean, timeLeft?: number}}
	 */
	checkCooldown (command, userId) {
		if (!command.cooldown) {
			return { allowed: true };
		}

		const commandName = command.name;
		const cooldownAmount = command.cooldown * 1000;

		if (!this.cooldowns.has(commandName)) {
			this.cooldowns.set(commandName, new Collection());
		}

		const timestamps = this.cooldowns.get(commandName);
		const now = Date.now();

		if (timestamps.has(userId)) {
			const expirationTime = timestamps.get(userId) + cooldownAmount;
			if (now < expirationTime) {
				const timeLeft = (expirationTime - now) / 1000;
				return { allowed: false, timeLeft };
			}
		}

		timestamps.set(userId, now);
		setTimeout(() => timestamps.delete(userId), cooldownAmount);

		return { allowed: true };
	}

	/**
	 * Validate command context (DM vs Guild)
	 * @param {Object} command - Command object
	 * @param {Object} context - Execution context
	 * @returns {{valid: boolean, error?: string}}
	 */
	validateContext (command, context) {
		// Guild-only commands
		if (command.guildOnly && !context.guild) {
			return { valid: false, error: "This command can only be used in a server." };
		}

		// DM-only commands
		if (command.dmOnly && context.guild) {
			return { valid: false, error: "This command can only be used in DMs." };
		}

		// NSFW channel check
		if (command.nsfw && context.channel && !context.channel.nsfw) {
			return { valid: false, error: "This command can only be used in NSFW channels." };
		}

		return { valid: true };
	}

	/**
	 * Parse and validate command arguments
	 * @param {Object} command - Command object
	 * @param {Array|Object} args - Arguments (array for prefix, object for slash)
	 * @param {boolean} isSlash - Whether this is a slash command
	 * @returns {{valid: boolean, parsed?: Object, error?: string}}
	 */
	validateArguments (command, args, isSlash = false) {
		if (!command.args || command.args.length === 0) {
			return { valid: true, parsed: isSlash ? args : {} };
		}

		const parsed = {};
		const errors = [];

		command.args.forEach((argDef, index) => {
			const value = isSlash ? args[argDef.name] : args[index];

			// Check required arguments
			if (argDef.required && (value === undefined || value === null || value === "")) {
				errors.push(`Missing required argument: ${argDef.name}`);
				return;
			}

			// Type validation
			if (value !== undefined && argDef.type) {
				switch (argDef.type) {
					case "number":
					case "integer": {
						const num = parseInt(value);
						if (isNaN(num)) {
							errors.push(`${argDef.name} must be a number`);
							return;
						}
						parsed[argDef.name] = num;
						break;
					}
					case "boolean":
						parsed[argDef.name] = value === true || value === "true" || value === "1";
						break;
					default:
						parsed[argDef.name] = value;
				}
			} else {
				parsed[argDef.name] = value;
			}
		});

		if (errors.length > 0) {
			return { valid: false, error: errors.join("\n") };
		}

		return { valid: true, parsed };
	}

	/**
	 * Execute a command with full validation and error handling
	 * @param {Object} command - Command object
	 * @param {Object} context - Execution context (message or interaction)
	 * @param {Array|Object} args - Command arguments
	 * @param {boolean} isSlash - Whether this is a slash command
	 * @returns {Promise<{success: boolean, error?: string}>}
	 */
	async execute (command, context, args = [], isSlash = false) {
		const start = process.hrtime.bigint();
		let status = "success";

		try {
			// Validate context (DM/Guild/NSFW)
			const contextCheck = this.validateContext(command, context);
			if (!contextCheck.valid) {
				await this.sendError(context, contextCheck.error, isSlash);
				return { success: false, error: contextCheck.error };
			}

			// Validate permissions
			const permCheck = this.validatePermissions(command, context);
			if (!permCheck.valid) {
				await this.sendError(context, permCheck.error, isSlash);
				return { success: false, error: permCheck.error };
			}

			// Check cooldowns
			const cooldownCheck = this.checkCooldown(command, context.user?.id || context.author?.id);
			if (!cooldownCheck.allowed) {
				const error = `Please wait ${cooldownCheck.timeLeft.toFixed(1)} seconds before using this command again.`;
				await this.sendError(context, error, isSlash);
				return { success: false, error };
			}

			// Validate arguments
			const argsCheck = this.validateArguments(command, args, isSlash);
			if (!argsCheck.valid) {
				await this.sendError(context, argsCheck.error, isSlash);
				return { success: false, error: argsCheck.error };
			}

			// Execute the command
			if (isSlash) {
				await command.execute(context, argsCheck.parsed);
			} else {
				await command.run(context, argsCheck.parsed);
			}

			return { success: true };
		} catch (error) {
			status = "error";
			logger.error("Command execution error", {
				command: command.name,
				user: context.user?.id || context.author?.id,
				guild: context.guild?.id,
			}, error);

			const errorMsg = "An error occurred while executing this command.";
			await this.sendError(context, errorMsg, isSlash);
			return { success: false, error: error.message };
		} finally {
			// Record metrics
			if (metrics) {
				const duration = Number(process.hrtime.bigint() - start) / 1e9;
				const commandType = isSlash ? "slash" : "prefix";
				metrics.recordCommandExecution(command.name, commandType, status, duration);
			}
		}
	}

	/**
	 * Send an error message to the user
	 * @param {Object} context - Message or interaction
	 * @param {string} error - Error message
	 * @param {boolean} isSlash - Whether this is a slash command
	 * @private
	 */
	async sendError (context, error, isSlash) {
		const content = { content: `❌ ${error}`, ephemeral: true };

		try {
			if (isSlash) {
				if (context.deferred) {
					await context.editReply(content);
				} else if (context.replied) {
					await context.followUp(content);
				} else {
					await context.reply(content);
				}
			} else {
				await context.reply(`❌ ${error}`);
			}
		} catch (err) {
			logger.warn("Failed to send error message", {}, err);
		}
	}

	/**
	 * Get cooldown statistics
	 * @returns {Object} Cooldown stats
	 */
	getCooldownStats () {
		const stats = {
			commands: this.cooldowns.size,
			totalUsers: 0,
		};

		this.cooldowns.forEach((timestamps, commandName) => {
			stats[commandName] = timestamps.size;
			stats.totalUsers += timestamps.size;
		});

		// Update metrics
		if (metrics) {
			metrics.updateCommandCooldowns(stats.totalUsers);
		}

		return stats;
	}

	/**
	 * Clear expired cooldowns
	 */
	clearExpiredCooldowns () {
		const now = Date.now();
		let cleared = 0;

		for (const [commandName, timestamps] of this.cooldowns) {
			for (const [userId, timestamp] of timestamps) {
				// If cooldown has expired (assuming 1 hour max), remove it
				if (now - timestamp > 3600000) {
					timestamps.delete(userId);
					cleared++;
				}
			}

			// Remove empty collections
			if (timestamps.size === 0) {
				this.cooldowns.delete(commandName);
			}
		}

		return cleared;
	}
}

module.exports = CommandExecutor;
