const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("emoji")
		.setDescription("Display enlarged emoji(s)")
		.addStringOption(opt =>
			opt.setName("emoji")
				.setDescription("The emoji(s) to enlarge")
				.setRequired(true),
		),

	async execute (interaction) {
		const input = interaction.options.getString("emoji");

		// Match custom emojis
		const customEmojiRegex = /<(a)?:(\w+):(\d+)>/g;
		const matches = [...input.matchAll(customEmojiRegex)];

		if (matches.length === 0) {
			return interaction.reply({
				content: "No custom emojis found! I can only enlarge custom server emojis.",
				ephemeral: true,
			});
		}

		const embeds = matches.slice(0, 6).map(match => {
			const animated = match[1] === "a";
			const name = match[2];
			const id = match[3];
			const ext = animated ? "gif" : "png";
			const url = `https://cdn.discordapp.com/emojis/${id}.${ext}?size=256`;

			return {
				color: 0x3669FA,
				title: `:${name}:`,
				image: { url },
			};
		});

		return interaction.reply({ embeds });
	},
};
