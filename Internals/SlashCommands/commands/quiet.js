const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
	adminLevel: 3,
	data: new SlashCommandBuilder()
		.setName("quiet")
		.setDescription("Disable the bot in this channel")
		.addSubcommand(sub =>
			sub.setName("on")
				.setDescription("Turn quiet mode on"),
		)
		.addSubcommand(sub =>
			sub.setName("off")
				.setDescription("Turn quiet mode off"),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

	async execute (interaction, client, serverDocument) {
		const subcommand = interaction.options.getSubcommand();
		const serverQueryDocument = serverDocument.query;
		const channelDocument = serverDocument.channels.id(interaction.channel.id);

		if (!channelDocument) {
			return interaction.reply({
				content: "Could not find channel configuration!",
				ephemeral: true,
			});
		}

		switch (subcommand) {
			case "on": {
				serverQueryDocument.id("channels", channelDocument._id).set("bot_enabled", false);
				await serverDocument.save();

				return interaction.reply({
					content: "🤫 I'll be quiet in this channel now!",
					ephemeral: true,
				});
			}

			case "off": {
				serverQueryDocument.id("channels", channelDocument._id).set("bot_enabled", true);
				await serverDocument.save();

				return interaction.reply({
					content: "📢 I'm back! Commands are now enabled in this channel.",
				});
			}

			default:
				return interaction.reply({ content: "Unknown subcommand", ephemeral: true });
		}
	},
};
