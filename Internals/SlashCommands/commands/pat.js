const { SlashCommandBuilder } = require("discord.js");

const gifs = [
	"https://media.giphy.com/media/L2z7dnOduqEow/giphy.gif",
	"https://media.giphy.com/media/4HP0ddZnNVvKU/giphy.gif",
	"https://media.giphy.com/media/ARSp9T7wwxNcs/giphy.gif",
	"https://media.giphy.com/media/ye7OTQgwmVuVy/giphy.gif",
	"https://media.giphy.com/media/5tmRHwTlHAA9WkVxTU/giphy.gif",
	"https://media.giphy.com/media/Z7x24IHBcmV7W/giphy.gif",
	"https://media.giphy.com/media/osYdfUptPqV0s/giphy.gif",
	"https://media.giphy.com/media/N0CIxcyPLputW/giphy.gif",
	"https://media.giphy.com/media/4owjQaBmYuCze/giphy.gif",
	"https://media.giphy.com/media/xT9DPIBYf0pAviBLzO/giphy.gif",
];

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("pat")
		.setDescription("Give someone headpats!")
		.addUserOption(opt =>
			opt.setName("user")
				.setDescription("The user to pat")
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
				description = `**${authorName}** pats themselves... there there 😊`;
			} else if (target.id === client.user.id) {
				description = `**${authorName}** pats me! *happy bot noises* 💖`;
			} else {
				description = `**${authorName}** pats **${targetName}**! Good job! 👋`;
			}
		} else {
			description = `**${authorName}** wants headpats! 👋`;
		}

		return interaction.reply({
			embeds: [{
				color: 0x43B581,
				description,
				image: { url: randomGif },
				footer: { text: "👋" },
			}],
		});
	},
};
