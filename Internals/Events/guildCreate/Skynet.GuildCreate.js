const BaseEvent = require("../BaseEvent.js");
const { NewServer: getNewServerData, PostShardedData } = require("../../../Modules/");
const ConfigManager = require("../../../Modules/ConfigManager");
const ReferralManager = require("../../../Modules/ReferralManager");
const Onboarding = require("./Skynet.Onboarding.js");
// const { LoggingLevels } = require("../../Constants"); // Disabled: server join messages removed

class GuildCreate extends BaseEvent {
	async handle (guild) {
		const settings = await ConfigManager.get();
		if (settings.guildBlocklist.includes(guild.id)) {
			logger.info(`Left "${guild}" due to it being blocklisted!`, { guild: guild.id });
			guild.leave();
		} else {
			this.client.IPC.send("sendAllGuilds", {});
			await Promise.all([guild.members.fetch(), PostShardedData(this.client)]);
			let serverDocument, shouldMakeDocument = false;
			try {
				serverDocument = await Servers.findOne(guild.id);
			} catch (err) {
				shouldMakeDocument = true;
			}
			if (serverDocument) {
				logger.info(`Rejoined server ${guild}`, { svrid: guild.id });
				// Disabled: Don't send message to server owners/moderators on rejoin
				// this.client.logMessage(serverDocument, LoggingLevels.INFO, "I've been re-added to your server! (^-^)");
			} else if (shouldMakeDocument || !serverDocument) {
				logger.info(`Joined server ${guild}`, { svrid: guild.id });
				try {
					const newServerDocument = await getNewServerData(this.client, guild, Servers.new({ _id: guild.id }));
					await newServerDocument.save();

					// Process referral if a pending referral code exists for this guild
					// Check for referral code stored in Redis or pending referrals
					await this.processReferral(guild);

					// Send onboarding DMs to server owner and top admin role
					const onboarding = new Onboarding(this.client);
					await onboarding.handle(guild, true);
				} catch (err) {
					logger.warn(`Failed to create a new server document for new server >.>`, { svrid: guild.id }, err);
				}
			}
		}
	}

	/**
	 * Process referral for a newly joined guild
	 * Checks Redis for pending referral codes and awards points to referrer
	 */
	async processReferral (guild) {
		try {
			// Check Redis for pending referral code
			const redis = this.client.cache;
			if (!redis) return;

			// First check if there's a direct pending referral for this guild
			let referralCode = await redis.get(`referral:pending:${guild.id}`);

			// If not, check if the guild owner clicked a referral link recently
			if (!referralCode && guild.ownerId) {
				referralCode = await redis.get(`referral:clicker:${guild.ownerId}`);
				if (referralCode) {
					// Clear the clicker referral so it's only used once
					await redis.del(`referral:clicker:${guild.ownerId}`);
				}
			}

			if (!referralCode) return;

			// Process the referral
			const result = await ReferralManager.processReferral(guild, referralCode);

			if (result.success) {
				logger.info(`Referral processed for guild ${guild.name}`, {
					svrid: guild.id,
					referrerId: result.referrerId,
					pointsAwarded: result.pointsAwarded,
				});

				// Notify the referrer via DM if possible
				try {
					const referrer = await this.client.users.fetch(result.referrerId);
					if (referrer) {
						await referrer.send({
							embeds: [{
								color: 0x14b8a6,
								title: "🎉 Referral Successful!",
								description: `**${result.serverName}** joined Skynet using your referral link!\n\nYou earned **${result.pointsAwarded} Vote Points**!`,
								footer: { text: "If they stay active for 7 days, you'll earn a bonus!" },
							}],
						}).catch(() => null);
					}
				} catch (err) {
					// Ignore DM errors
				}
			} else {
				logger.debug(`Referral not processed: ${result.reason}`, { svrid: guild.id });
			}

			// Remove pending referral from Redis
			await redis.del(`referral:pending:${guild.id}`);
		} catch (err) {
			logger.warn("Error processing referral", { svrid: guild.id }, err);
		}
	}
}

module.exports = GuildCreate;
