const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("snipe")
		.setDescription("Shows the last deleted message in the channel"),

	async execute (interaction, client) {
		const snipeData = client.snipes ? client.snipes.get(interaction.channel.id) : null;

		if (!snipeData) {
			return interaction.reply({
				content: "There's nothing to snipe! 🔍",
				ephemeral: true,
			});
		}

		const { content, author, attachments, deletedAt } = snipeData;

		const embed = {
			color: 0x3669FA,
			author: {
				name: author.tag,
				iconURL: author.displayAvatarURL(),
			},
			description: content || "*No text content*",
			footer: { text: "Deleted" },
			timestamp: deletedAt.toISOString(),
		};

		// Add attachment info if present
		if (attachments && attachments.length > 0) {
			const attachmentInfo = attachments.map(a => `[${a.name}](${a.proxyURL || a.url})`).join("\n");
			embed.fields = [{
				name: "📎 Attachments",
				value: attachmentInfo.substring(0, 1024),
			}];

			const imageAttachment = attachments.find(a =>
				a.contentType && a.contentType.startsWith("image/"),
			);
			if (imageAttachment) {
				embed.image = { url: imageAttachment.proxyURL || imageAttachment.url };
			}
		}

		return interaction.reply({ embeds: [embed] });
	},
};
