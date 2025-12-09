const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { create: CreateModLog } = require("../../../Modules/ModLog");

module.exports = {
	adminLevel: 3,
	data: new SlashCommandBuilder()
		.setName("ban")
		.setDescription("Ban a user from the server")
		.addUserOption(opt =>
			opt.setName("user")
				.setDescription("The user to ban")
				.setRequired(true),
		)
		.addIntegerOption(opt =>
			opt.setName("days")
				.setDescription("Days of messages to delete (0-7)")
				.setMinValue(0)
				.setMaxValue(7)
				.setRequired(false),
		)
		.addStringOption(opt =>
			opt.setName("reason")
				.setDescription("Reason for the ban")
				.setRequired(false),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

	async execute (interaction, client) {
		const user = interaction.options.getUser("user");
		const days = interaction.options.getInteger("days") || 1;
		const reason = interaction.options.getString("reason") || "No reason specified";

		const member = await interaction.guild.members.fetch(user.id).catch(() => null);

		if (member) {
			const { canClientBan, memberAboveAffected } = client.canDoActionOnMember(
				interaction.guild,
				interaction.member,
				member,
				"ban",
			);

			if (!canClientBan) {
				return interaction.reply({
					content: "I don't have permission to ban this user!",
					ephemeral: true,
				});
			}

			if (!memberAboveAffected) {
				return interaction.reply({
					content: "You cannot ban someone with a higher or equal role!",
					ephemeral: true,
				});
			}
		}

		try {
			// DM the user
			try {
				await user.send({
					embeds: [{
						color: 0xFF0000,
						description: `You've been banned from \`${interaction.guild.name}\`! 🔨`,
						fields: [
							{ name: "Reason", value: reason, inline: true },
							{ name: "Moderator", value: `@${interaction.user.tag}`, inline: true },
						],
					}],
				});
			} catch (_) {
				// DMs disabled
			}

			await interaction.guild.members.ban(user.id, {
				deleteMessageSeconds: days * 86400,
				reason: `${reason} | By @${interaction.user.tag}`,
			});

			await CreateModLog(interaction.guild, "Ban", member || user, interaction.user, reason);

			return interaction.reply({
				embeds: [{
					color: 0x00FF00,
					description: `**@${user.tag}** has been banned! 🔨`,
					fields: [
						{ name: "Reason", value: reason, inline: true },
					],
				}],
			});
		} catch (err) {
			return interaction.reply({
				content: `Failed to ban the user: ${err.message}`,
				ephemeral: true,
			});
		}
	},
};
