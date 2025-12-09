const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { create: CreateModLog } = require("../../../Modules/ModLog");

module.exports = {
	adminLevel: 3,
	data: new SlashCommandBuilder()
		.setName("unban")
		.setDescription("Unban a user from the server")
		.addStringOption(opt =>
			opt.setName("user_id")
				.setDescription("The user ID to unban")
				.setRequired(true),
		)
		.addStringOption(opt =>
			opt.setName("reason")
				.setDescription("Reason for the unban")
				.setRequired(false),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

	async execute (interaction) {
		const userId = interaction.options.getString("user_id");
		const reason = interaction.options.getString("reason") || "No reason specified";

		try {
			const ban = await interaction.guild.bans.fetch(userId);
			if (!ban) {
				return interaction.reply({
					content: "This user is not banned!",
					ephemeral: true,
				});
			}

			await interaction.guild.members.unban(userId, `${reason} | By @${interaction.user.tag}`);

			await CreateModLog(interaction.guild, "Unban", ban.user, interaction.user, reason);

			return interaction.reply({
				embeds: [{
					color: 0x00FF00,
					description: `**@${ban.user.tag}** has been unbanned! ✅`,
					fields: [
						{ name: "Reason", value: reason, inline: true },
					],
				}],
			});
		} catch (err) {
			return interaction.reply({
				content: `Failed to unban the user: ${err.message}`,
				ephemeral: true,
			});
		}
	},
};
