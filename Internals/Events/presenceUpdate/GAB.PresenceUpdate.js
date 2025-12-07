const BaseEvent = require("../BaseEvent.js");
const { StatusMessages } = require("../../Constants");

class PresenceUpdate extends BaseEvent {
	requirements (oldPresence, presence) {
		// Discord.js v14: activities is an array, not a single activity
		const currentActivity = presence?.activities?.[0];
		const oldActivity = oldPresence?.activities?.[0];
		return presence && currentActivity && (!oldPresence || !oldActivity || oldActivity.name !== currentActivity.name);
	}

	async handle (oldPresence, presence) {
		const serverDocument = await Servers.findOne(presence.guild.id);
		if (!serverDocument) {
			logger.warn(`Could not satisfy PresenceUpdate because ${presence.guild.id} is missing a Document.`, { svrid: presence.guild.id });
			return;
		}
		const streamingStatusMessageDocument = serverDocument.config.moderation.status_messages.member_streaming_message;
		const gameStatusMessageDocument = serverDocument.config.moderation.status_messages.member_game_updated_message;
		// Discord.js v14: activities is an array
		const currentActivity = presence.activities?.[0];
		if (currentActivity && currentActivity.url &&
			streamingStatusMessageDocument.isEnabled && (streamingStatusMessageDocument.enabled_user_ids.includes(presence.id) || streamingStatusMessageDocument.enabled_user_ids.length === 0)) {
			const channel = presence.guild.channels.cache.get(streamingStatusMessageDocument.channel_id);
			if (channel) {
				const channelDocument = serverDocument.channels[channel.id];
				if (!channelDocument || channelDocument.bot_enabled) {
					await channel.send({ embeds: [StatusMessages.GAME_STREAMING(this.client.getName(serverDocument, presence.member), currentActivity)] }).catch(err => {
						logger.debug(`Failed to send StatusMessage for GAME_STREAMING.`, { svrid: presence.guild.id, chid: channel.id }, err);
					});
				}
			}
		} else if (gameStatusMessageDocument.isEnabled) {
			const channel = presence.guild.channels.cache.get(gameStatusMessageDocument.channel_id);
			if (channel) {
				const channelDocument = serverDocument.channels[channel.id];
				if (!channelDocument || channelDocument.bot_enabled) {
					await channel.send({ embeds: [StatusMessages.GAME_UPDATE(this.client.getName(serverDocument, presence.member), currentActivity)] }).catch(err => {
						logger.debug(`Failed to send StatusMessage for GAME_UPDATE.`, { svrid: presence.guild.id, chid: channel.id }, err);
					});
				}
			}
		}
	}
}

module.exports = PresenceUpdate;
