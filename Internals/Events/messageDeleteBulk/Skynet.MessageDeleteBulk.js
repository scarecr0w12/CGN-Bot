const BaseEvent = require("../BaseEvent.js");
const ModLog = require("../../../Modules/ModLog");

class MessageDeleteBulk extends BaseEvent {
	requirements (msgs) {
		return msgs && msgs.size > 0;
	}

	async handle (msgs) {
		if (!msgs.first().guild) return;

		const guild = msgs.first().guild;
		const serverDocument = await Servers.findOne(guild.id);
		if (!serverDocument) {
			return logger.debug("Failed to find server data for bulk message deletion.", { svrid: guild.id });
		}

		const count = msgs.size;
		const userIds = new Set();
		let totalContent = "";

		msgs.forEach(msg => {
			if (msg.author) userIds.add(msg.author.id);
			totalContent += `${msg.author?.tag || "Unknown"}: ${msg.content}\n`;
		});

		// Log bulk deletion to modlog
		try {
			const reason = `Bulk deleted ${count} messages from ${userIds.size} user(s).\nPreview: ${totalContent.substring(0, 200)}${totalContent.length > 200 ? "..." : ""}`;
			const result = await ModLog.create(guild, "Bulk Delete", null, null, reason);
			if (result instanceof Error) {
				logger.debug("ModLog.create returned error for bulk delete", { svrid: guild.id, error: result.message });
			} else {
				logger.debug("Bulk deletion logged to modlog", { svrid: guild.id, count, caseId: result });
			}
		} catch (err) {
			logger.debug("Failed to log bulk deletion to modlog", { svrid: guild.id }, err);
		}

		// Update message counts
		const serverQueryDocument = serverDocument.query;
		if (serverDocument.messages_today > 0) {
			serverQueryDocument.inc("messages_today", -count);
		}

		await serverDocument.save().catch(err => {
			logger.warn("Failed to save server data for bulk message deletion.", { svrid: guild.id }, err);
		});
	}
}

module.exports = MessageDeleteBulk;
