const { SlashCommandBuilder } = require("discord.js");

const gifs = [
	"https://media.giphy.com/media/l2QDM9Jnim1YVILXa/giphy.gif",
	"https://media.giphy.com/media/3oEdv4hwWTzBhWvaU0/giphy.gif",
	"https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif",
	"https://media.giphy.com/media/ZQN9jsRWp1M76/giphy.gif",
	"https://media.giphy.com/media/lrr9rHuoJOE0w/giphy.gif",
	"https://media.giphy.com/media/wnsgren9NtITS/giphy.gif",
	"https://media.giphy.com/media/PHZ7v9tfQu0o0/giphy.gif",
	"https://media.giphy.com/media/IRUb7GTCaPU8E/giphy.gif",
	"https://media.giphy.com/media/EvYHHSntaIl5m/giphy.gif",
	"https://media.giphy.com/media/xUPGcCh4nUHyCkyuti/giphy.gif",
];

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("hug")
		.setDescription("Give someone a virtual hug!")
		.addUserOption(opt =>
			opt.setName("user")
				.setDescription("The user to hug")
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
				description = `**${authorName}** hugs themselves... 🥺`;
			} else if (target.id === client.user.id) {
				description = `**${authorName}** hugs me! Thanks! 💕`;
			} else {
				description = `**${authorName}** hugs **${targetName}**! 🤗`;
			}
		} else {
			description = `**${authorName}** wants a hug! 🤗`;
		}

		return interaction.reply({
			embeds: [{
				color: 0x43B581,
				description,
				image: { url: randomGif },
				footer: { text: "💕" },
			}],
		});
	},
};
