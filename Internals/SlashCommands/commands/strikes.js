const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
	adminLevel: 1,
	data: new SlashCommandBuilder()
		.setName("strikes")
		.setDescription("View a user's strikes")
		.addUserOption(opt =>
			opt.setName("user")
				.setDescription("The user to check")
				.setRequired(true),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

	async execute (interaction, client, serverDocument) {
		const user = interaction.options.getUser("user");
		const memberDocument = serverDocument.members.id(user.id);

		if (!memberDocument || !memberDocument.strikes || memberDocument.strikes.length === 0) {
			return interaction.reply({
				content: `**@${user.tag}** has no strikes! ✨`,
				ephemeral: true,
			});
		}

		const strikes = memberDocument.strikes.slice(-10).map((s, i) => {
			const date = s.timestamp ? `<t:${Math.floor(s.timestamp / 1000)}:R>` : "Unknown";
			return `**${i + 1}.** ${s.reason} (${date})`;
		}).join("\n");

		return interaction.reply({
			embeds: [{
				color: 0xFFFF00,
				title: `⚠️ Strikes for ${user.tag}`,
				description: strikes,
				footer: { text: `Total: ${memberDocument.strikes.length} strike(s)` },
			}],
			ephemeral: true,
		});
	},
};
