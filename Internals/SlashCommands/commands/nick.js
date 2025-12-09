const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
	adminLevel: 3,
	data: new SlashCommandBuilder()
		.setName("nick")
		.setDescription("Change a member's nickname")
		.addUserOption(opt =>
			opt.setName("user")
				.setDescription("The user to change nickname for")
				.setRequired(true),
		)
		.addStringOption(opt =>
			opt.setName("nickname")
				.setDescription("The new nickname (leave empty to reset)")
				.setRequired(false)
				.setMaxLength(32),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),

	async execute (interaction) {
		const user = interaction.options.getUser("user");
		const nickname = interaction.options.getString("nickname");

		const member = await interaction.guild.members.fetch(user.id).catch(() => null);

		if (!member) {
			return interaction.reply({
				content: "Could not find that user in this server!",
				ephemeral: true,
			});
		}

		try {
			await member.setNickname(nickname, `Changed by @${interaction.user.tag}`);

			const desc = nickname ?
				`Changed **@${user.tag}**'s nickname to **${nickname}**` :
				`Reset **@${user.tag}**'s nickname`;

			return interaction.reply({
				embeds: [{
					color: 0x00FF00,
					description: desc,
				}],
			});
		} catch (err) {
			return interaction.reply({
				content: `Failed to change nickname: ${err.message}`,
				ephemeral: true,
			});
		}
	},
};
