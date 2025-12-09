const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("afk")
		.setDescription("Set an AFK message displayed when you're mentioned")
		.addStringOption(opt =>
			opt.setName("message")
				.setDescription("Your AFK message (leave empty to clear)")
				.setRequired(false),
		),

	async execute (interaction, client, serverDocument) {
		const message = interaction.options.getString("message");
		const memberDocument = serverDocument.members.id(interaction.user.id);

		if (!memberDocument) {
			return interaction.reply({
				content: "Could not find your member data!",
				ephemeral: true,
			});
		}

		if (!message || message === ".") {
			memberDocument.afk_message = null;
			await serverDocument.save();
			return interaction.reply({
				content: "Your AFK status has been cleared! 👋",
				ephemeral: true,
			});
		}

		memberDocument.afk_message = message;
		await serverDocument.save();

		return interaction.reply({
			content: `You're now AFK: **${message}**\nI'll let people know when they mention you! 💤`,
			ephemeral: true,
		});
	},
};
