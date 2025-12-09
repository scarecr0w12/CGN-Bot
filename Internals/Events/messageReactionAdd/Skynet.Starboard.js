const BaseEvent = require("../BaseEvent.js");

class StarboardReaction extends BaseEvent {
	requirements (reaction, user) {
		// Ensure it's in a guild and not from a bot
		return reaction.message.guild && !user.bot;
	}

	async handle (reaction) {
		// Fetch the message if it's partial
		if (reaction.partial) {
			try {
				await reaction.fetch();
			} catch (err) {
				logger.debug("Failed to fetch partial reaction", { msgid: reaction.message.id }, err);
				return;
			}
		}

		if (reaction.message.partial) {
			try {
				await reaction.message.fetch();
			} catch (err) {
				logger.debug("Failed to fetch partial message for starboard", { msgid: reaction.message.id }, err);
				return;
			}
		}

		const { message } = reaction;
		const { guild } = message;

		// Get server document
		const serverDocument = await Servers.findOne(guild.id);
		if (!serverDocument) return;

		// Check if starboard is configured and enabled
		const starboardConfig = serverDocument.config.starboard;
		if (!starboardConfig || !starboardConfig.isEnabled || !starboardConfig.channel_id) return;

		const starboardEmoji = starboardConfig.emoji || "⭐";
		const threshold = starboardConfig.threshold || 3;
		const starboardChannelId = starboardConfig.channel_id;

		// Check if this is the starboard emoji
		const reactionEmoji = reaction.emoji.name;
		if (reactionEmoji !== starboardEmoji && reaction.emoji.toString() !== starboardEmoji) return;

		// Don't star messages from the starboard channel itself
		if (message.channel.id === starboardChannelId) return;

		// Get the starboard channel
		const starboardChannel = guild.channels.cache.get(starboardChannelId);
		if (!starboardChannel) return;

		// Get reaction count
		const reactionCount = reaction.count;

		// Check if threshold is met
		if (reactionCount < threshold) return;

		// Check if this message has already been starred
		const starredMessages = serverDocument.starred_messages || [];
		const existingEntry = starredMessages.find(s => s.original_id === message.id);

		const starEmbed = {
			color: 0xFFD700,
			author: {
				name: message.author.tag,
				iconURL: message.author.displayAvatarURL(),
			},
			description: message.content || null,
			fields: [
				{
					name: "Source",
					value: `[Jump to message](${message.url})`,
					inline: true,
				},
			],
			footer: { text: `${starboardEmoji} ${reactionCount} | ${message.id}` },
			timestamp: message.createdAt.toISOString(),
		};

		// Add image if present
		if (message.attachments.size > 0) {
			const imageAttachment = message.attachments.find(a =>
				a.contentType && a.contentType.startsWith("image/"),
			);
			if (imageAttachment) {
				starEmbed.image = { url: imageAttachment.url };
			}
		}

		// Add embed image if original message had an embed with image
		if (message.embeds.length > 0 && message.embeds[0].image) {
			starEmbed.image = { url: message.embeds[0].image.url };
		}

		try {
			if (existingEntry && existingEntry.starboard_id) {
				// Update existing starboard message
				const starboardMsg = await starboardChannel.messages.fetch(existingEntry.starboard_id).catch(() => null);
				if (starboardMsg) {
					await starboardMsg.edit({ embeds: [starEmbed] });
				}
			} else if (reactionCount >= threshold) {
				// Create new starboard entry
				const starboardMsg = await starboardChannel.send({ embeds: [starEmbed] });

				// Save to database
				const serverQueryDocument = serverDocument.query;
				if (!serverDocument.starred_messages) {
					serverQueryDocument.set("starred_messages", []);
				}
				serverQueryDocument.push("starred_messages", {
					original_id: message.id,
					starboard_id: starboardMsg.id,
					channel_id: message.channel.id,
					author_id: message.author.id,
					stars: reactionCount,
				});

				await serverDocument.save().catch(err => {
					logger.warn("Failed to save starboard entry", { svrid: guild.id, msgid: message.id }, err);
				});
			}
		} catch (err) {
			logger.debug("Failed to handle starboard reaction", { svrid: guild.id, msgid: message.id }, err);
		}
	}
}

module.exports = StarboardReaction;
