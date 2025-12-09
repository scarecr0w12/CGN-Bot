const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("archive")
		.setDescription("Archive messages from this channel to a JSON file")
		.addIntegerOption(opt =>
			opt.setName("count")
				.setDescription("Number of messages to archive (1-100)")
				.setMinValue(1)
				.setMaxValue(100)
				.setRequired(true),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

	async execute (interaction) {
		const count = interaction.options.getInteger("count");

		await interaction.deferReply({ ephemeral: true });

		try {
			const messages = await interaction.channel.messages.fetch({ limit: count });

			const archive = messages.map(msg => ({
				id: msg.id,
				author: {
					id: msg.author.id,
					username: msg.author.username,
					tag: msg.author.tag,
				},
				content: msg.content,
				timestamp: msg.createdTimestamp,
				attachments: msg.attachments.map(a => ({ name: a.name, url: a.url })),
			}));

			const jsonData = JSON.stringify(archive, null, 2);
			const buffer = Buffer.from(jsonData, "utf-8");
			const attachment = new AttachmentBuilder(buffer, {
				name: `archive-${interaction.channel.name}-${Date.now()}.json`,
			});

			return interaction.editReply({
				content: `📦 Archived ${messages.size} messages!`,
				files: [attachment],
			});
		} catch (err) {
			return interaction.editReply(`Failed to archive messages: ${err.message}`);
		}
	},
};
