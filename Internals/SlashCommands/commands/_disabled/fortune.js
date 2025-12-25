const { SlashCommandBuilder } = require("discord.js");

const fortunes = [
	"A beautiful, smart, and loving person will be coming into your life.",
	"A dubious friend may be an enemy in camouflage.",
	"A faithful friend is a strong defense.",
	"A fresh start will put you on your way.",
	"A golden egg of opportunity falls into your lap this month.",
	"A good time to finish up old tasks.",
	"A hunch is creativity trying to tell you something.",
	"A lifetime of happiness lies ahead of you.",
	"A light heart carries you through all the hard times.",
	"A new perspective will come with the new year.",
	"All your hard work will soon pay off.",
	"An important person will offer you support.",
	"Be careful or you could fall for some tricks today.",
	"Better ask a stranger than to let a fool advise you.",
	"Curiosity kills boredom. Nothing can kill curiosity.",
	"Determination is what you need now.",
	"Don't just spend time. Invest it.",
	"Don't let your limitations overshadow your talents.",
	"Embrace this love relationship you have!",
	"Every flower blooms in its own time.",
	"Fortune favors the brave.",
	"Good news will come to you by mail.",
	"Hard work pays off in the future, laziness pays off now.",
	"It takes courage to admit fault.",
	"Keep your eye out for someone special.",
	"Love is around the corner.",
	"New ideas could be profitable.",
	"Now is the time to try something new.",
	"Others can help you now.",
	"Patience is a virtue.",
	"Stay close to friends for warmth.",
	"The one that you love is closer than you think.",
	"There is a true and sincere friendship between you and your friends.",
	"Trust your intuition. The universe is guiding your life.",
	"You are talented in many ways.",
	"You will be successful in your work.",
	"Your hard work is about to pay off.",
	"Your heart is pure, and your mind clear.",
];

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("fortune")
		.setDescription("Get your fortune told! 🔮"),

	async execute (interaction) {
		const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];

		return interaction.reply({
			embeds: [{
				color: 0x9B59B6,
				title: "🔮 Your Fortune",
				description: fortune,
				footer: { text: "May your future be bright!" },
			}],
		});
	},
};
