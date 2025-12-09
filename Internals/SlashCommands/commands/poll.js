const { SlashCommandBuilder } = require("discord.js");

const numberEmojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("poll")
		.setDescription("Create a poll")
		.addStringOption(opt =>
			opt.setName("question")
				.setDescription("The poll question")
				.setRequired(true),
		)
		.addStringOption(opt =>
			opt.setName("options")
				.setDescription("Poll options separated by | (leave empty for yes/no)")
				.setRequired(false),
		),

	async execute (interaction) {
		const question = interaction.options.getString("question");
		const optionsStr = interaction.options.getString("options");

		let options = [];
		let reactions = [];

		if (optionsStr) {
			options = optionsStr.split("|").map(o => o.trim()).filter(o => o.length > 0);
			if (options.length < 2 || options.length > 10) {
				return interaction.reply({
					content: "Please provide 2-10 options!",
					ephemeral: true,
				});
			}
			reactions = numberEmojis.slice(0, options.length);
		} else {
			options = ["Yes", "No"];
			reactions = ["👍", "👎"];
		}

		const optionsList = options.map((opt, i) => `${reactions[i]} ${opt}`).join("\n");

		const pollMsg = await interaction.reply({
			embeds: [{
				color: 0x3669FA,
				title: `📊 ${question}`,
				description: optionsList,
				footer: { text: `Poll by ${interaction.user.tag}` },
				timestamp: new Date().toISOString(),
			}],
			fetchReply: true,
		});

		for (const emoji of reactions) {
			await pollMsg.react(emoji);
		}
	},
};
