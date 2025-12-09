const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("trivia")
		.setDescription("Play a trivia game!")
		.addStringOption(opt =>
			opt.setName("category")
				.setDescription("Trivia category")
				.setRequired(false)
				.addChoices(
					{ name: "General Knowledge", value: "9" },
					{ name: "Science & Nature", value: "17" },
					{ name: "Computers", value: "18" },
					{ name: "Video Games", value: "15" },
					{ name: "Movies", value: "11" },
					{ name: "Music", value: "12" },
					{ name: "Sports", value: "21" },
					{ name: "History", value: "23" },
					{ name: "Geography", value: "22" },
					{ name: "Animals", value: "27" },
				),
		),

	async execute (interaction) {
		const category = interaction.options.getString("category") || "";

		await interaction.deferReply();

		try {
			const url = `https://opentdb.com/api.php?amount=1&type=multiple${category ? `&category=${category}` : ""}`;
			const response = await fetch(url);
			const data = await response.json();

			if (!data.results || data.results.length === 0) {
				return interaction.editReply("Couldn't fetch a trivia question!");
			}

			const question = data.results[0];
			const answers = [...question.incorrect_answers, question.correct_answer]
				.sort(() => Math.random() - 0.5);

			const correctIndex = answers.indexOf(question.correct_answer);
			const letters = ["A", "B", "C", "D"];

			const answerList = answers.map((a, i) => `**${letters[i]}.** ${decodeHTML(a)}`).join("\n");

			const msg = await interaction.editReply({
				embeds: [{
					color: 0x3669FA,
					title: "🎯 Trivia Time!",
					description: decodeHTML(question.question),
					fields: [
						{ name: "Answers", value: answerList },
						{ name: "Category", value: question.category, inline: true },
						{ name: "Difficulty", value: question.difficulty, inline: true },
					],
					footer: { text: "You have 30 seconds to answer!" },
				}],
			});

			// Add reaction options
			for (let i = 0; i < answers.length; i++) {
				await msg.react(["🇦", "🇧", "🇨", "🇩"][i]);
			}

			// Wait for answer
			const filter = (reaction, user) =>
				["🇦", "🇧", "🇨", "🇩"].includes(reaction.emoji.name) &&
				user.id === interaction.user.id;

			try {
				const collected = await msg.awaitReactions({ filter, max: 1, time: 30000 });
				const reaction = collected.first();

				if (!reaction) {
					return interaction.followUp({
						content: `⏰ Time's up! The correct answer was **${letters[correctIndex]}. ${decodeHTML(question.correct_answer)}**`,
					});
				}

				const userAnswer = ["🇦", "🇧", "🇨", "🇩"].indexOf(reaction.emoji.name);

				if (userAnswer === correctIndex) {
					return interaction.followUp({
						content: `✅ Correct! The answer was **${letters[correctIndex]}. ${decodeHTML(question.correct_answer)}**`,
					});
				} else {
					return interaction.followUp({
						content: `❌ Wrong! The correct answer was **${letters[correctIndex]}. ${decodeHTML(question.correct_answer)}**`,
					});
				}
			} catch (_) {
				return interaction.followUp({
					content: `⏰ Time's up! The correct answer was **${letters[correctIndex]}. ${decodeHTML(question.correct_answer)}**`,
				});
			}
		} catch (err) {
			return interaction.editReply("Failed to fetch trivia question!");
		}
	},
};

function decodeHTML (text) {
	const entities = {
		"&amp;": "&",
		"&lt;": "<",
		"&gt;": ">",
		"&quot;": '"',
		"&#039;": "'",
		"&apos;": "'",
	};
	return text.replace(/&[#\w]+;/g, match => entities[match] || match);
}
