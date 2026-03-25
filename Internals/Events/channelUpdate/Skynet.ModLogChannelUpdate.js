const BaseEvent = require("../BaseEvent.js");
const ModLog = require("../../../Modules/ModLog");

class ModLogChannelUpdate extends BaseEvent {
	requirements (oldChannel, newChannel) {
		return oldChannel && newChannel && oldChannel.guild && newChannel.guild;
	}

	async handle (oldChannel, newChannel) {
		const changes = [];

		if (oldChannel.name !== newChannel.name) {
			changes.push(`Name: ${oldChannel.name} → ${newChannel.name}`);
		}
		if (oldChannel.topic !== newChannel.topic) {
			changes.push(`Topic changed`);
		}
		if (oldChannel.nsfw !== newChannel.nsfw) {
			changes.push(`NSFW: ${oldChannel.nsfw} → ${newChannel.nsfw}`);
		}
		if (oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
			changes.push(`Slowmode: ${oldChannel.rateLimitPerUser}s → ${newChannel.rateLimitPerUser}s`);
		}

		if (changes.length === 0) return;

		try {
			const reason = `Channel modified: ${changes.join(", ")}`;
			await ModLog.create(newChannel.guild, "Channel Modified", null, this.client.user, reason);
		} catch (err) {
			logger.debug("Failed to log channel modification to modlog", { svrid: newChannel.guild.id, chid: newChannel.id }, err);
		}
	}
}

module.exports = ModLogChannelUpdate;
