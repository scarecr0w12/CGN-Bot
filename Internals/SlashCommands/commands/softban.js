const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { create: CreateModLog } = require("../../../Modules/ModLog");

module.exports = {
	adminLevel: 2,
	data: new SlashCommandBuilder()
		.setName("softban")
		.setDescription("Ban and immediately unban a user to delete their messages")
		.addUserOption(opt =>
			opt.setName("user")
				.setDescription("The user to softban")
				.setRequired(true),
		)
		.addIntegerOption(opt =>
			opt.setName("days")
				.setDescription("Days of messages to delete (1-7)")
				.setMinValue(1)
				.setMaxValue(7)
				.setRequired(false),
		)
		.addStringOption(opt =>
			opt.setName("reason")
				.setDescription("Reason for the softban")
				.setRequired(false),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

	async execute (interaction, client) {
		const user = interaction.options.getUser("user");
		const days = interaction.options.getInteger("days") || 1;
		const reason = interaction.options.getString("reason") || "No reason specified";

		const member = await interaction.guild.members.fetch(user.id).catch(() => null);

		// Check permissions
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
					content: "You cannot softban someone who's above you!",
					ephemeral: true,
				});
			}
		}

		try {
			// DM the user
			try {
				await user.send({
					embeds: [{
						color: 0xE55B0A,
						description: `You've been softbanned from \`${interaction.guild.name}\`!`,
						fields: [
							{ name: "Reason", value: reason, inline: true },
							{ name: "Moderator", value: `@${interaction.user.tag}`, inline: true },
						],
						footer: { text: "A softban means your messages were deleted but you can rejoin." },
					}],
				});
			} catch (_) {
				// DMs disabled
			}

			// Ban then unban
			await interaction.guild.members.ban(user.id, {
				deleteMessageSeconds: days * 86400,
				reason: `[Softban] ${reason} | By @${interaction.user.tag}`,
			});

			await interaction.guild.members.unban(user.id, `Softban unban | By @${interaction.user.tag}`);

			// Create ModLog
			await CreateModLog(interaction.guild, "Softban", member || user, interaction.user, reason);

			return interaction.reply({
				embeds: [{
					color: 0x00FF00,
					description: `**@${user.tag}** has been softbanned! 🔨`,
					footer: { text: `Deleted ${days} day(s) of messages` },
				}],
			});
		} catch (err) {
			return interaction.reply({
				content: `Failed to softban the user: ${err.message}`,
				ephemeral: true,
			});
		}
	},
};
