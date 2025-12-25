const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("translate")
		.setDescription("Translate text between languages")
		.addStringOption(opt =>
			opt.setName("text")
				.setDescription("The text to translate")
				.setRequired(true),
		)
		.addStringOption(opt =>
			opt.setName("to")
				.setDescription("Target language (e.g., en, es, fr, de, ja)")
				.setRequired(true),
		)
		.addStringOption(opt =>
			opt.setName("from")
				.setDescription("Source language (auto-detect if not specified)")
				.setRequired(false),
		),

	async execute (interaction) {
		const text = interaction.options.getString("text");
		const to = interaction.options.getString("to");

		// Using Google Translate URL as fallback
		const encodedText = encodeURIComponent(text);
		const translateUrl = `https://translate.google.com/?sl=auto&tl=${to}&text=${encodedText}`;

		return interaction.reply({
			embeds: [{
				color: 0x4285F4,
				title: "🌐 Translation",
				description: `[Click here to translate on Google Translate](${translateUrl})`,
				fields: [
					{ name: "Text", value: text.substring(0, 1024), inline: false },
					{ name: "Target Language", value: to, inline: true },
				],
				footer: { text: "Powered by Google Translate" },
			}],
		});
	},
};
