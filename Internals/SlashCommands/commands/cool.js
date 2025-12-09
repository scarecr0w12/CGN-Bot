const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
	adminLevel: 1,
	data: new SlashCommandBuilder()
		.setName("cool")
		.setDescription("Set a command cooldown for the channel")
		.addIntegerOption(opt =>
			opt.setName("seconds")
				.setDescription("Cooldown duration in seconds (0 to clear)")
				.setMinValue(0)
				.setMaxValue(3600)
				.setRequired(true),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

	async execute (interaction, client, serverDocument) {
		const seconds = interaction.options.getInteger("seconds");
		const serverQueryDocument = serverDocument.query;
		const channelDocument = serverDocument.channels.id(interaction.channel.id);

		if (!channelDocument) {
			return interaction.reply({
				content: "Could not find channel configuration!",
				ephemeral: true,
			});
		}

		if (seconds === 0) {
			serverQueryDocument.id("channels", channelDocument._id).set("command_cooldown", 0);
			await serverDocument.save();
			return interaction.reply({
				content: "❄️ Command cooldown has been cleared!",
				ephemeral: true,
			});
		}

		serverQueryDocument.id("channels", channelDocument._id).set("command_cooldown", seconds * 1000);
		await serverDocument.save();

		return interaction.reply({
			content: `❄️ Command cooldown set to **${seconds}** seconds!`,
			ephemeral: true,
		});
	},
};
