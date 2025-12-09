const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("lottery")
		.setDescription("Join the SkynetPoints lottery")
		.addSubcommand(sub =>
			sub.setName("join")
				.setDescription("Join the current lottery"),
		)
		.addSubcommand(sub =>
			sub.setName("status")
				.setDescription("Check lottery status"),
		),

	async execute (interaction, client, serverDocument) {
		const subcommand = interaction.options.getSubcommand();
		const { lottery } = serverDocument;

		switch (subcommand) {
			case "join": {
				if (!lottery || !lottery.isOpen) {
					return interaction.reply({
						content: "There's no active lottery right now!",
						ephemeral: true,
					});
				}

				if (lottery.participants && lottery.participants.includes(interaction.user.id)) {
					return interaction.reply({
						content: "You've already joined this lottery! 🎰",
						ephemeral: true,
					});
				}

				const serverQueryDocument = serverDocument.query;
				serverQueryDocument.push("lottery.participants", interaction.user.id);
				await serverDocument.save();

				return interaction.reply({
					content: "You've joined the lottery! 🎰 Good luck!",
					ephemeral: true,
				});
			}

			case "status": {
				if (!lottery || !lottery.isOpen) {
					return interaction.reply({
						content: "There's no active lottery right now!",
						ephemeral: true,
					});
				}

				const participants = lottery.participants ? lottery.participants.length : 0;
				const prize = lottery.prize || "Unknown";

				return interaction.reply({
					embeds: [{
						color: 0x3669FA,
						title: "🎰 Lottery Status",
						fields: [
							{ name: "Status", value: "Active 🟢", inline: true },
							{ name: "Participants", value: `${participants}`, inline: true },
							{ name: "Prize", value: `${prize} points`, inline: true },
						],
					}],
					ephemeral: true,
				});
			}

			default:
				return interaction.reply({ content: "Unknown subcommand", ephemeral: true });
		}
	},
};
