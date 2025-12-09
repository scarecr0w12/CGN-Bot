const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { create: CreateModLog } = require("../../../Modules/ModLog");

module.exports = {
	adminLevel: 2,
	data: new SlashCommandBuilder()
		.setName("tempban")
		.setDescription("Temporarily ban a user for a specified duration")
		.addUserOption(opt =>
			opt.setName("user")
				.setDescription("The user to temporarily ban")
				.setRequired(true),
		)
		.addStringOption(opt =>
			opt.setName("duration")
				.setDescription("Duration (e.g., 1h, 1d, 1w)")
				.setRequired(true),
		)
		.addStringOption(opt =>
			opt.setName("reason")
				.setDescription("Reason for the ban")
				.setRequired(false),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

	async execute (interaction, client, serverDocument) {
		const user = interaction.options.getUser("user");
		const durationStr = interaction.options.getString("duration");
		const reason = interaction.options.getString("reason") || "No reason specified";

		// Parse duration
		const durationMs = parseDuration(durationStr);
		if (!durationMs || durationMs <= 0) {
			return interaction.reply({
				content: "Invalid duration! Use formats like: 30m, 1h, 1d, 1w",
				ephemeral: true,
			});
		}

		// Max 28 days
		if (durationMs > 28 * 24 * 60 * 60 * 1000) {
			return interaction.reply({
				content: "Temporary ban cannot exceed 28 days!",
				ephemeral: true,
			});
		}

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
					content: "You cannot tempban someone who's above you!",
					ephemeral: true,
				});
			}
		}

		const unbanDate = new Date(Date.now() + durationMs);
		const durationFormatted = formatDuration(durationMs);

		try {
			// DM the user
			try {
				await user.send({
					embeds: [{
						color: 0xFF0000,
						description: `You've been temporarily banned from \`${interaction.guild.name}\`! ⏰🔨`,
						fields: [
							{ name: "Duration", value: durationFormatted, inline: true },
							{ name: "Reason", value: reason, inline: true },
							{ name: "Moderator", value: `@${interaction.user.tag}`, inline: true },
							{ name: "Unban Date", value: unbanDate.toUTCString(), inline: false },
						],
					}],
				});
			} catch (_) {
				// DMs disabled
			}

			// Ban the user
			await interaction.guild.members.ban(user.id, {
				deleteMessageSeconds: 86400,
				reason: `[Tempban: ${durationFormatted}] ${reason} | By @${interaction.user.tag}`,
			});

			// Store tempban for auto-unban
			const serverQueryDocument = serverDocument.query;
			if (!serverDocument.tempbans) {
				serverQueryDocument.set("tempbans", []);
			}
			serverQueryDocument.push("tempbans", {
				user_id: user.id,
				unban_at: unbanDate.getTime(),
				reason: reason,
				moderator_id: interaction.user.id,
			});
			await serverDocument.save();

			// Create ModLog
			await CreateModLog(interaction.guild, "Temp Ban", member || user, interaction.user, `[${durationFormatted}] ${reason}`);

			return interaction.reply({
				embeds: [{
					color: 0x00FF00,
					description: `**@${user.tag}** has been temporarily banned! ⏰🔨`,
					fields: [
						{ name: "Duration", value: durationFormatted, inline: true },
						{ name: "Unban Date", value: `<t:${Math.floor(unbanDate.getTime() / 1000)}:F>`, inline: true },
					],
				}],
			});
		} catch (err) {
			return interaction.reply({
				content: `Failed to tempban the user: ${err.message}`,
				ephemeral: true,
			});
		}
	},
};

function parseDuration (str) {
	const match = str.match(/^(\d+)\s*(m|min|minutes?|h|hr|hours?|d|days?|w|weeks?)$/i);
	if (!match) return null;

	const value = parseInt(match[1]);
	const unit = match[2].toLowerCase();

	if (unit.startsWith("m")) return value * 60 * 1000;
	if (unit.startsWith("h")) return value * 60 * 60 * 1000;
	if (unit.startsWith("d")) return value * 24 * 60 * 60 * 1000;
	if (unit.startsWith("w")) return value * 7 * 24 * 60 * 60 * 1000;
	return null;
}

function formatDuration (ms) {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	const weeks = Math.floor(days / 7);

	if (weeks > 0) return `${weeks} week${weeks !== 1 ? "s" : ""}`;
	if (days > 0) return `${days} day${days !== 1 ? "s" : ""}`;
	if (hours > 0) return `${hours} hour${hours !== 1 ? "s" : ""}`;
	if (minutes > 0) return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
	return `${seconds} second${seconds !== 1 ? "s" : ""}`;
}
