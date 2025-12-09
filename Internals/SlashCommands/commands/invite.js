const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("invite")
		.setDescription("Get the bot invite link"),

	async execute (interaction, client) {
		const inviteLink = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;

		return interaction.reply({
			embeds: [{
				color: 0x43B581,
				title: "Invite SkynetBot! 🤖",
				description: [
					`[Click here to invite me to your server!](${inviteLink})`,
					"",
					"The link includes all permissions needed for full functionality.",
					"Feel free to uncheck permissions you don't need!",
				].join("\n"),
				thumbnail: { url: client.user.displayAvatarURL() },
			}],
			ephemeral: true,
		});
	},
};
