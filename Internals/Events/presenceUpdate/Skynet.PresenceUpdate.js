const BaseEvent = require("../BaseEvent.js");
const { StatusMessages } = require("../../Constants");
const GameActivityTracker = require("../../../Modules/GameActivityTracker");

class PresenceUpdate extends BaseEvent {
	requirements (oldPresence, presence) {
		// Discord.js v14: activities is an array, not a single activity
		const currentActivity = presence?.activities?.[0];
		const oldActivity = oldPresence?.activities?.[0];
		return presence && currentActivity && (!oldPresence || !oldActivity || oldActivity.name !== currentActivity.name);
	}

	async handle (oldPresence, presence) {
		// Track game activity regardless of status message settings
		GameActivityTracker.handlePresenceUpdate(oldPresence, presence).catch(err => {
			logger.debug(`Failed to track game activity`, { svrid: presence?.guild?.id, usrid: presence?.user?.id }, err);
		});

		const serverDocument = await Servers.findOne(presence.guild.id);
		if (!serverDocument) {
			// Silently skip - guild may not have initialized yet or status messages aren't configured
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
