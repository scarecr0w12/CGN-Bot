const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("expand")
		.setDescription("Expand a shortened URL to see where it leads")
		.addStringOption(opt =>
			opt.setName("url")
				.setDescription("The URL to expand")
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
			const response = await fetch(url, {
				method: "HEAD",
				redirect: "follow",
			});

			const finalUrl = response.url;

			return interaction.editReply({
				embeds: [{
					color: 0x3669FA,
					title: "🔗 URL Expansion",
					fields: [
						{ name: "Original URL", value: url.substring(0, 1024), inline: false },
						{ name: "Final URL", value: finalUrl.substring(0, 1024), inline: false },
						{ name: "Same URL?", value: url === finalUrl ? "Yes ✅" : "No - redirected", inline: true },
					],
				}],
			});
		} catch (err) {
			return interaction.editReply({
				content: "Failed to expand that URL. It may be invalid or inaccessible.",
				ephemeral: true,
			});
		}
	},
};
