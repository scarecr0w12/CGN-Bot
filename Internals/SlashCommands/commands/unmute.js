const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { create: CreateModLog } = require("../../../Modules/ModLog");

module.exports = {
	adminLevel: 1,
	data: new SlashCommandBuilder()
		.setName("unmute")
		.setDescription("Unmute a member in the server")
		.addUserOption(opt =>
			opt.setName("user")
				.setDescription("The user to unmute")
				.setRequired(true),
		)
		.addStringOption(opt =>
			opt.setName("reason")
				.setDescription("Reason for the unmute")
				.setRequired(false),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

	async execute (interaction) {
		const user = interaction.options.getUser("user");
		const reason = interaction.options.getString("reason") || "No reason specified";

		const member = await interaction.guild.members.fetch(user.id).catch(() => null);

		if (!member) {
			return interaction.reply({
				content: "Could not find that user in this server!",
				ephemeral: true,
			});
		}

		if (!member.isCommunicationDisabled()) {
			return interaction.reply({
				content: "This user is not muted!",
				ephemeral: true,
			});
		}

		try {
			await member.timeout(null, `${reason} | By @${interaction.user.tag}`);

			await CreateModLog(interaction.guild, "Unmute", member, interaction.user, reason);

			return interaction.reply({
				embeds: [{
					color: 0x00FF00,
					description: `**@${user.tag}** has been unmuted! 🔊`,
					fields: [
						{ name: "Reason", value: reason, inline: true },
					],
				}],
			});
		} catch (err) {
			return interaction.reply({
				content: `Failed to unmute the user: ${err.message}`,
				ephemeral: true,
			});
		}
	},
};
