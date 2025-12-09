const { SlashCommandBuilder } = require("discord.js");

const gifs = [
	"https://media.giphy.com/media/Zau0yrl17uzdK/giphy.gif",
	"https://media.giphy.com/media/jLeyZWgtwgr2U/giphy.gif",
	"https://media.giphy.com/media/RXGNsyRb1hDJm/giphy.gif",
	"https://media.giphy.com/media/Gf3AUz3eBNbTW/giphy.gif",
	"https://media.giphy.com/media/tXWfj6dUjs0Zy/giphy.gif",
	"https://media.giphy.com/media/uG3lKkAuh53wc/giphy.gif",
	"https://media.giphy.com/media/xUO4t2gkWBxDi/giphy.gif",
	"https://media.giphy.com/media/l3YSimA8CV1k11QRy/giphy.gif",
	"https://media.giphy.com/media/WLXO8OZmq0JK8/giphy.gif",
	"https://media.giphy.com/media/3XlEk2RxPS1m8/giphy.gif",
];

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("slap")
		.setDescription("Slap someone (playfully)!")
		.addUserOption(opt =>
			opt.setName("user")
				.setDescription("The user to slap")
				.setRequired(false),
		),

	async execute (interaction, client, serverDocument) {
		const target = interaction.options.getUser("user");
		const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

		const authorMember = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
		const authorName = client.getName(serverDocument, authorMember) || interaction.user.username;

		let description;
		if (target) {
			const targetMember = await interaction.guild.members.fetch(target.id).catch(() => null);
			const targetName = client.getName(serverDocument, targetMember) || target.username;

			if (target.id === interaction.user.id) {
				description = `**${authorName}** slaps themselves... why though? 🤔`;
			} else if (target.id === client.user.id) {
				description = `**${authorName}** tries to slap me! Nice try! 😏`;
			} else {
				description = `**${authorName}** slaps **${targetName}**! 👋💥`;
			}
		} else {
			description = `**${authorName}** slaps the air menacingly! 👋`;
		}

		return interaction.reply({
			embeds: [{
				color: 0xE55B0A,
				description,
				image: { url: randomGif },
				footer: { text: "💥" },
			}],
		});
	},
};
