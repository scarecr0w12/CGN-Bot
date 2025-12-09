const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
	adminLevel: 1,
	data: new SlashCommandBuilder()
		.setName("say")
		.setDescription("Make the bot say something")
		.addStringOption(opt =>
			opt.setName("message")
				.setDescription("The message to say")
				.setRequired(true),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

	async execute (interaction) {
		const message = interaction.options.getString("message");

		await interaction.reply({ content: "Message sent!", ephemeral: true });
		await interaction.channel.send(message);
	},
};
