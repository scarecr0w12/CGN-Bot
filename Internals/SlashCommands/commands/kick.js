const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { create: CreateModLog } = require("../../../Modules/ModLog");

module.exports = {
	adminLevel: 1,
	data: new SlashCommandBuilder()
		.setName("kick")
		.setDescription("Kick a member from the server")
		.addUserOption(opt =>
			opt.setName("user")
				.setDescription("The user to kick")
				.setRequired(true),
		)
		.addStringOption(opt =>
			opt.setName("reason")
				.setDescription("Reason for the kick")
				.setRequired(false),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

	async execute (interaction, client) {
		const user = interaction.options.getUser("user");
		const reason = interaction.options.getString("reason") || "No reason specified";

		const member = await interaction.guild.members.fetch(user.id).catch(() => null);

		if (!member) {
			return interaction.reply({
				content: "Could not find that user in this server!",
				ephemeral: true,
			});
		}

		const { canClientKick, memberAboveAffected } = client.canDoActionOnMember(
			interaction.guild,
			interaction.member,
			member,
			"kick",
		);

		if (!canClientKick) {
			return interaction.reply({
				content: "I don't have permission to kick this user!",
				ephemeral: true,
			});
		}

		if (!memberAboveAffected) {
			return interaction.reply({
				content: "You cannot kick someone with a higher or equal role!",
				ephemeral: true,
			});
		}

		try {
			// DM the user
			try {
				await user.send({
					embeds: [{
						color: 0xE55B0A,
						description: `You've been kicked from \`${interaction.guild.name}\`! 👢`,
						fields: [
							{ name: "Reason", value: reason, inline: true },
							{ name: "Moderator", value: `@${interaction.user.tag}`, inline: true },
						],
					}],
				});
			} catch (_) {
				// DMs disabled
			}

			await member.kick(`${reason} | By @${interaction.user.tag}`);

			await CreateModLog(interaction.guild, "Kick", member, interaction.user, reason);

			return interaction.reply({
				embeds: [{
					color: 0x00FF00,
					description: `**@${user.tag}** has been kicked! 👢`,
					fields: [
						{ name: "Reason", value: reason, inline: true },
					],
				}],
			});
		} catch (err) {
			return interaction.reply({
				content: `Failed to kick the user: ${err.message}`,
				ephemeral: true,
			});
		}
	},
};
