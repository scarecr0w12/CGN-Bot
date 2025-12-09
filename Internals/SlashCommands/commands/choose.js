const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("choose")
		.setDescription("Randomly choose from options")
		.addStringOption(opt =>
			opt.setName("options")
				.setDescription("Options separated by | (e.g., 'pizza | burger | salad')")
				.setRequired(true),
		),

	async execute (interaction) {
		const input = interaction.options.getString("options");
		const options = input.split("|").map(o => o.trim()).filter(o => o.length > 0);

		if (options.length < 2) {
			return interaction.reply({
				content: "Please provide at least 2 options separated by |",
				ephemeral: true,
			});
		}

		const choice = options[Math.floor(Math.random() * options.length)];

		return interaction.reply({
			embeds: [{
				color: 0x3669FA,
				title: "🎲 I choose...",
				description: `**${choice}**`,
				footer: { text: `From ${options.length} options` },
			}],
		});
	},
};
