const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { create: CreateModLog } = require("../../../Modules/ModLog");

module.exports = {
	adminLevel: 1,
	data: new SlashCommandBuilder()
		.setName("mute")
		.setDescription("Mute a member in the server")
		.addUserOption(opt =>
			opt.setName("user")
				.setDescription("The user to mute")
				.setRequired(true),
		)
		.addStringOption(opt =>
			opt.setName("duration")
				.setDescription("Mute duration (e.g., 10m, 1h, 1d)")
				.setRequired(false),
		)
		.addStringOption(opt =>
			opt.setName("reason")
				.setDescription("Reason for the mute")
				.setRequired(false),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

	async execute (interaction) {
		const user = interaction.options.getUser("user");
		const durationStr = interaction.options.getString("duration");
		const reason = interaction.options.getString("reason") || "No reason specified";

		const member = await interaction.guild.members.fetch(user.id).catch(() => null);

		if (!member) {
			return interaction.reply({
				content: "Could not find that user in this server!",
				ephemeral: true,
			});
		}

		// Parse duration - default 10 minutes
		let durationMs = 10 * 60 * 1000;
		if (durationStr) {
			const parsed = parseDuration(durationStr);
			if (parsed) durationMs = parsed;
		}

		// Max 28 days for timeout
		if (durationMs > 28 * 24 * 60 * 60 * 1000) {
			durationMs = 28 * 24 * 60 * 60 * 1000;
		}

		try {
			await member.timeout(durationMs, `${reason} | By @${interaction.user.tag}`);

			await CreateModLog(interaction.guild, "Mute", member, interaction.user, reason);

			return interaction.reply({
				embeds: [{
					color: 0x00FF00,
					description: `**@${user.tag}** has been muted! 🔇`,
					fields: [
						{ name: "Duration", value: formatDuration(durationMs), inline: true },
						{ name: "Reason", value: reason, inline: true },
					],
				}],
			});
		} catch (err) {
			return interaction.reply({
				content: `Failed to mute the user: ${err.message}`,
				ephemeral: true,
			});
		}
	},
};

function parseDuration (str) {
	const match = str.match(/^(\d+)\s*(s|sec|m|min|h|hr|d|day|w|week)s?$/i);
	if (!match) return null;

	const value = parseInt(match[1]);
	const unit = match[2].toLowerCase();

	if (unit.startsWith("s")) return value * 1000;
	if (unit.startsWith("m")) return value * 60 * 1000;
	if (unit.startsWith("h")) return value * 60 * 60 * 1000;
	if (unit.startsWith("d")) return value * 24 * 60 * 60 * 1000;
	if (unit.startsWith("w")) return value * 7 * 24 * 60 * 60 * 1000;
	return null;
}

function formatDuration (ms) {
	const minutes = Math.floor(ms / 60000);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) return `${days} day${days !== 1 ? "s" : ""}`;
	if (hours > 0) return `${hours} hour${hours !== 1 ? "s" : ""}`;
	return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
}
