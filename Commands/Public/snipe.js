module.exports = async ({ client, Constants: { Colors } }, { serverDocument }, msg, commandData) => {
	// Get the snipe cache for this channel
	const snipeData = client.snipes ? client.snipes.get(msg.channel.id) : null;

	if (!snipeData) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "There's nothing to snipe! 🔍",
				footer: { text: "Deleted messages are only cached for a short time" },
			}],
		});
	}

	const { content, author, attachments, deletedAt } = snipeData;

	const embed = {
		color: Colors.INFO,
		author: {
			name: author.tag,
			iconURL: author.displayAvatarURL(),
		},
		description: content || "*No text content*",
		footer: { text: `Deleted` },
		timestamp: deletedAt.toISOString(),
	};

	// Add attachment info if present
	if (attachments && attachments.length > 0) {
		const attachmentInfo = attachments.map(a => `[${a.name}](${a.proxyURL || a.url})`).join("\n");
		embed.fields = [{
			name: "📎 Attachments",
			value: attachmentInfo.substring(0, 1024),
		}];

		// Try to show image if it was an image attachment
		const imageAttachment = attachments.find(a =>
			a.contentType && a.contentType.startsWith("image/"),
		);
		if (imageAttachment) {
			embed.image = { url: imageAttachment.proxyURL || imageAttachment.url };
		}
	}

	return msg.send({ embeds: [embed] });
};
