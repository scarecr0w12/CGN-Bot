const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
	adminLevel: 1,
	data: new SlashCommandBuilder()
		.setName("nuke")
		.setDescription("Bulk delete messages in the channel")
		.addIntegerOption(opt =>
			opt.setName("amount")
				.setDescription("Number of messages to delete (1-100)")
				.setMinValue(1)
				.setMaxValue(100)
				.setRequired(true),
		)
		.addUserOption(opt =>
			opt.setName("user")
				.setDescription("Only delete messages from this user")
				.setRequired(false),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

	async execute (interaction) {
		const amount = interaction.options.getInteger("amount");
		const user = interaction.options.getUser("user");

		await interaction.deferReply({ ephemeral: true });

		try {
			let messages = await interaction.channel.messages.fetch({ limit: amount });

			if (user) {
				messages = messages.filter(m => m.author.id === user.id);
			}

			// Filter out messages older than 14 days
			const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
			messages = messages.filter(m => m.createdTimestamp > twoWeeksAgo);

			if (messages.size === 0) {
				return interaction.editReply("No messages to delete!");
			}

			const deleted = await interaction.channel.bulkDelete(messages, true);

			return interaction.editReply({
				content: `🗑️ Deleted **${deleted.size}** message${deleted.size !== 1 ? "s" : ""}!${user ? ` (from @${user.tag})` : ""}`,
			});
		} catch (err) {
			return interaction.editReply(`Failed to delete messages: ${err.message}`);
		}
	},
};
