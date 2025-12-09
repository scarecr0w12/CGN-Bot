const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
	adminLevel: 3,
	data: new SlashCommandBuilder()
		.setName("prefix")
		.setDescription("Change the command prefix for this server")
		.addStringOption(opt =>
			opt.setName("prefix")
				.setDescription("The new prefix (or @mention)")
				.setRequired(true)
				.setMaxLength(10),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

	async execute (interaction, client, serverDocument) {
		const newPrefix = interaction.options.getString("prefix");
		const serverQueryDocument = serverDocument.query;

		serverQueryDocument.set("config.command_prefix", newPrefix);
		await serverDocument.save();

		return interaction.reply({
			embeds: [{
				color: 0x00FF00,
				description: newPrefix === "@mention" ?
					`Command prefix set to **@${client.user.username}**` :
					`Command prefix set to \`${newPrefix}\``,
			}],
		});
	},
};
