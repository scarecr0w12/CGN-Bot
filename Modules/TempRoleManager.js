/**
 * TempRoleManager - Manages temporary role assignments and expiry
 */
class TempRoleManager {
	constructor (client) {
		this.client = client;
		this.checkInterval = null;
		this.CHECK_INTERVAL_MS = 60000; // Check every minute
	}

	/**
	 * Start the temp role expiry checker
	 */
	start () {
		if (this.checkInterval) return;

		logger.info("TempRoleManager started");

		// Run immediately on start
		this.checkExpiredRoles().catch(err => {
			logger.error("Error in initial temp role check", {}, err);
		});

		// Then run periodically
		this.checkInterval = setInterval(() => {
			this.checkExpiredRoles().catch(err => {
				logger.error("Error checking expired temp roles", {}, err);
			});
		}, this.CHECK_INTERVAL_MS);
	}

	/**
	 * Stop the temp role expiry checker
	 */
	stop () {
		if (this.checkInterval) {
			clearInterval(this.checkInterval);
			this.checkInterval = null;
			logger.info("TempRoleManager stopped");
		}
	}

	/**
	 * Check for and remove expired temporary roles
	 */
	async checkExpiredRoles () {
		const now = new Date();

		// Find all expired temp roles
		const expiredRoles = await global.TempRoles.find({
			expires_at: { $lte: now },
		}).exec();

		if (!expiredRoles || expiredRoles.length === 0) return;

		logger.debug(`Found ${expiredRoles.length} expired temp roles to process`);

		for (const tempRole of expiredRoles) {
			try {
				await this.removeExpiredRole(tempRole);
			} catch (err) {
				logger.warn("Failed to remove expired temp role", {
					svrid: tempRole.server_id,
					usrid: tempRole.user_id,
					roleid: tempRole.role_id,
				}, err);
			}
		}
	}

	/**
	 * Remove an expired temporary role
	 * @param {Object} tempRole - Temp role document
	 */
	async removeExpiredRole (tempRole) {
		const guild = this.client.guilds.cache.get(tempRole.server_id);
		if (!guild) {
			// Guild not available, delete the record anyway
			await global.TempRoles.delete({ _id: tempRole._id });
			return;
		}

		const member = await guild.members.fetch(tempRole.user_id).catch(() => null);
		const role = guild.roles.cache.get(tempRole.role_id);

		if (member && role && member.roles.cache.has(role.id)) {
			await member.roles.remove(role, "Temporary role expired");
			logger.info(`Removed expired temp role ${role.name} from ${member.user.tag}`, {
				svrid: guild.id,
				usrid: member.id,
			});

			// Try to notify the user
			try {
				await member.send({
					embeds: [{
						color: 0xFEE75C,
						title: "⏱️ Temporary Role Expired",
						description: `Your temporary **${role.name}** role in **${guild.name}** has expired and been removed.`,
						timestamp: new Date().toISOString(),
					}],
				});
			} catch {
				// User has DMs disabled or blocked
			}
		}

		// Delete the temp role record
		await global.TempRoles.delete({ _id: tempRole._id });
	}

	/**
	 * Get all active temp roles for a guild
	 * @param {string} guildId - Guild ID
	 * @returns {Promise<Array>}
	 */
	async getGuildTempRoles (guildId) {
		return global.TempRoles.find({
			server_id: guildId,
			expires_at: { $gt: new Date() },
		}).exec();
	}

	/**
	 * Get all temp roles for a user in a guild
	 * @param {string} guildId - Guild ID
	 * @param {string} userId - User ID
	 * @returns {Promise<Array>}
	 */
	async getUserTempRoles (guildId, userId) {
		return global.TempRoles.find({
			server_id: guildId,
			user_id: userId,
			expires_at: { $gt: new Date() },
		}).exec();
	}

	/**
	 * Extend a temp role's expiry
	 * @param {string} tempRoleId - Temp role document ID
	 * @param {number} additionalMs - Additional milliseconds to add
	 * @returns {Promise<Object>}
	 */
	async extendTempRole (tempRoleId, additionalMs) {
		const tempRole = await global.TempRoles.findOne(tempRoleId);
		if (!tempRole) {
			throw new Error("Temporary role not found");
		}

		const newExpiry = new Date(new Date(tempRole.expires_at).getTime() + additionalMs);

		await global.TempRoles.update(
			{ _id: tempRoleId },
			{ $set: { expires_at: newExpiry } },
		);

		return { ...tempRole, expires_at: newExpiry };
	}
}

module.exports = TempRoleManager;
