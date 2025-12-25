const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("shorten")
		.setDescription("Shorten a URL")
		.addStringOption(opt =>
			opt.setName("url")
				.setDescription("The URL to shorten")
				.setRequired(true),
		),

	async execute (interaction) {
		const url = interaction.options.getString("url");

		if (!url.startsWith("http://") && !url.startsWith("https://")) {
			return interaction.reply({
				content: "Please provide a valid URL starting with http:// or https://",
				ephemeral: true,
			});
		}

		await interaction.deferReply();

		try {
			const response = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`);
			const data = await response.json();

			if (data.errorcode) {
				return interaction.editReply(`Failed to shorten URL: ${data.errormessage}`);
			}

			return interaction.editReply({
				embeds: [{
					color: 0x3669FA,
					title: "🔗 URL Shortened!",
					fields: [
						{ name: "Original", value: url.substring(0, 1024), inline: false },
						{ name: "Shortened", value: data.shorturl, inline: false },
					],
				}],
			});
		} catch (err) {
			return interaction.editReply("Failed to shorten URL!");
		}
	},
};
