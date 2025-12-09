const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("avatar")
		.setDescription("Display a user's avatar")
		.addUserOption(opt =>
			opt.setName("user")
				.setDescription("The user to get the avatar of")
				.setRequired(false),
		),

	async execute (interaction) {
		const user = interaction.options.getUser("user") || interaction.user;
		const member = await interaction.guild.members.fetch(user.id).catch(() => null);

		const globalAvatar = user.displayAvatarURL({ size: 4096, dynamic: true });
		const serverAvatar = member ? member.displayAvatarURL({ size: 4096, dynamic: true }) : null;

		const embeds = [{
			color: 0x3669FA,
			title: `${user.tag}'s Avatar`,
			image: { url: globalAvatar },
			footer: { text: "Global Avatar" },
		}];

		if (serverAvatar && serverAvatar !== globalAvatar) {
			embeds.push({
				color: 0x3669FA,
				title: `${user.tag}'s Server Avatar`,
				image: { url: serverAvatar },
				footer: { text: "Server Avatar" },
			});
		}

		return interaction.reply({ embeds });
	},
};
