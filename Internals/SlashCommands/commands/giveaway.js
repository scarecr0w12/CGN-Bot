const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("giveaway")
		.setDescription("Join or manage giveaways")
		.addSubcommand(sub =>
			sub.setName("join")
				.setDescription("Join an active giveaway"),
		)
		.addSubcommand(sub =>
			sub.setName("status")
				.setDescription("Check giveaway status"),
		),

	async execute (interaction, client, serverDocument) {
		const subcommand = interaction.options.getSubcommand();
		const { giveaway } = serverDocument;

		switch (subcommand) {
			case "join": {
				if (!giveaway || !giveaway.isOpen) {
					return interaction.reply({
						content: "There's no active giveaway right now!",
						ephemeral: true,
					});
				}

				if (giveaway.participants && giveaway.participants.includes(interaction.user.id)) {
					return interaction.reply({
						content: "You've already joined this giveaway! 🎉",
						ephemeral: true,
					});
				}

				const serverQueryDocument = serverDocument.query;
				serverQueryDocument.push("giveaway.participants", interaction.user.id);
				await serverDocument.save();

				return interaction.reply({
					content: "You've joined the giveaway! 🎉 Good luck!",
					ephemeral: true,
				});
			}

			case "status": {
				if (!giveaway || !giveaway.isOpen) {
					return interaction.reply({
						content: "There's no active giveaway right now!",
						ephemeral: true,
					});
				}

				const participants = giveaway.participants ? giveaway.participants.length : 0;

				return interaction.reply({
					embeds: [{
						color: 0x3669FA,
						title: "🎁 Giveaway Status",
						fields: [
							{ name: "Status", value: "Active 🟢", inline: true },
							{ name: "Participants", value: `${participants}`, inline: true },
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
