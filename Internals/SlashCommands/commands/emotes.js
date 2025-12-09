const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("emotes")
		.setDescription("List server emojis"),

	async execute (interaction) {
		const emojis = interaction.guild.emojis.cache;

		if (emojis.size === 0) {
			return interaction.reply({
				content: "This server has no custom emojis!",
				ephemeral: true,
			});
		}

		const static_ = emojis.filter(e => !e.animated);
		const animated = emojis.filter(e => e.animated);

		const staticList = static_.map(e => e.toString()).join(" ");
		const animatedList = animated.map(e => e.toString()).join(" ");

		const fields = [];
		if (static_.size > 0) {
			fields.push({
				name: `Static Emojis (${static_.size})`,
				value: staticList.substring(0, 1024) || "None",
			});
		}
		if (animated.size > 0) {
			fields.push({
				name: `Animated Emojis (${animated.size})`,
				value: animatedList.substring(0, 1024) || "None",
			});
		}

		return interaction.reply({
			embeds: [{
				color: 0x3669FA,
				title: `${interaction.guild.name}'s Emojis`,
				fields,
				footer: { text: `Total: ${emojis.size} emojis` },
			}],
		});
	},
};
