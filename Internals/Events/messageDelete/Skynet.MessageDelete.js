const BaseEvent = require("../BaseEvent.js");
const { StatusMessages } = require("../../Constants");
const ModLog = require("../../../Modules/ModLog");

class MessageDelete extends BaseEvent {
	requirements (msg) {
		return msg && msg.guild && msg.author && msg.author.id !== this.client.user.id && !msg.author.bot;
	}

	async handle (msg) {
		// Cache message for snipe command
		if (!this.client.snipes) {
			this.client.snipes = new Map();
		}
		this.client.snipes.set(msg.channel.id, {
			content: msg.content,
			author: msg.author,
			attachments: Array.from(msg.attachments.values()),
			deletedAt: new Date(),
		});
		// Auto-clear snipe after 5 minutes
		setTimeout(() => {
			const cached = this.client.snipes.get(msg.channel.id);
			if (cached && cached.deletedAt.getTime() === this.client.snipes.get(msg.channel.id).deletedAt.getTime()) {
				this.client.snipes.delete(msg.channel.id);
			}
		}, 300000);

		// Log message deletion to modlog
		try {
			const reason = `Message content: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? "..." : ""}`;
			const result = await ModLog.create(msg.guild, "Message Deleted", msg.author, null, reason);
			if (result instanceof Error) {
				logger.debug("ModLog.create returned error", { svrid: msg.guild.id, chid: msg.channel.id, error: result.message });
			} else {
				logger.debug("Message deletion logged to modlog", { svrid: msg.guild.id, chid: msg.channel.id, caseId: result });
			}
		} catch (err) {
			logger.debug("Failed to log message deletion to modlog", { svrid: msg.guild.id, chid: msg.channel.id }, err);
		}

		const serverDocument = await Servers.findOne(msg.guild.id);
		if (!serverDocument) {
			return logger.debug("Failed to find server data for message deletion.", { svrid: msg.guild.id, chid: msg.channel.id, usrid: msg.author.id });
		}
		const serverQueryDocument = serverDocument.query;

		let channelDocument = serverDocument.channels[msg.channel.id];
		if (!channelDocument) {
			serverQueryDocument.push("channels", { _id: msg.channel.id });
			channelDocument = serverDocument.channels[msg.channel.id];
		}

		// Decrement today's message count for server
		if (serverDocument.messages_today > 0) serverQueryDocument.inc("messages_today", -1);

		// Count server stats if enabled in this channel
		if (channelDocument.isStatsEnabled) {
			// Decrement this week's message count for member
			const memberDocument = serverDocument.members[msg.author.id];
			if (memberDocument && memberDocument.messages > 0 && msg.createdTimestamp > serverDocument.stats_timestamp) {
				serverQueryDocument.id("members", memberDocument._id).inc("messages", -1);

				serverDocument.save().catch(err => {
					logger.warn("Failed to save server data for message deletion.", { svrid: msg.guild.id }, err);
				});
			}
		}

		// Find upvoted message and decrement points
		const voteTriggers = configJS.voteTriggers || [];
		for (const voteTrigger of voteTriggers) {
			if (msg.content.startsWith(voteTrigger)) {
				const message = (await msg.channel.messages.fetch({
					limit: 1,
					before: msg.id,
				})).first();

				if (message && ![this.client.user.id, msg.author.id].includes(message.author.id) && !message.author.bot) {
					let userDocument = await Users.findOne(message.author.id);
					if (!userDocument) {
						try {
							userDocument = Users.new({ _id: message.author.id });
							await userDocument.save();
						} catch (err) {
							if (!/duplicate key|1062/.test(err.message)) {
								throw err;
							}
						}
						userDocument = await Users.findOne(message.author.id);
					}

					// Decrement points
					userDocument.query.inc("points", -1);

					userDocument.save().catch(err => {
						logger.warn("Failed to save user data for points decrementing", { usrid: message.author.id }, err);
					});
				}
			}
		}

		// Send message_deleted_message if necessary
		const statusMessageDocument = serverDocument.config.moderation.status_messages.message_deleted_message;
		if (serverDocument.config.moderation.isEnabled && statusMessageDocument.isEnabled && statusMessageDocument.enabled_channel_ids.includes(msg.channel.id)) {
			logger.verbose(`Message by member '${msg.author.tag}' on server '${msg.guild.name}' deleted`, { svrid: msg.guild.id, chid: msg.channel.id, usrid: msg.author.id, msgid: msg.id });

			// Send message in different channel
			if (statusMessageDocument.type === "single" && statusMessageDocument.channel_id) {
				const channel = msg.guild.channels.cache.get(statusMessageDocument.channel_id);
				if (channel) {
					const targetChannelDocument = serverDocument.channels[channel.id];
					if (!targetChannelDocument || targetChannelDocument.bot_enabled) {
						channel.send({
							embeds: [StatusMessages.MESSAGE_DELETED(statusMessageDocument.type, msg, serverDocument, this.client)],
							allowedMentions: { parse: [] },
						}).catch(err => {
							logger.debug(`Failed to send StatusMessage for MESSAGE_DELETED.`, { svrid: msg.guild.id, chid: channel.id }, err);
						});
					}
				}
				// Send message in same channel
			} else if (statusMessageDocument.type === "msg") {
				if (!channelDocument || channelDocument.bot_enabled) {
					msg.channel.send({
						embeds: [StatusMessages.MESSAGE_DELETED(statusMessageDocument.type, msg, serverDocument, this.client)],
						allowedMentions: { parse: [] },
					}).catch(err => {
						logger.debug(`Failed to send StatusMessage for MESSAGE_DELETED.`, { svrid: msg.guild.id, chid: msg.channel.id }, err);
					});
				}
			}
		}
	}
}

module.exports = MessageDelete;
