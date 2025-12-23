const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("remindme")
		.setDescription("Set a reminder")
		.addStringOption(opt =>
			opt.setName("reminder")
				.setDescription("What to remind you about")
				.setRequired(true),
		)
		.addStringOption(opt =>
			opt.setName("time")
				.setDescription("When to remind you (e.g., 1h, 30m, 1d)")
				.setRequired(true),
		),

	async execute (interaction) {
		const reminder = interaction.options.getString("reminder");
		const timeStr = interaction.options.getString("time");

		const durationMs = parseDuration(timeStr);
		if (!durationMs || durationMs <= 0) {
			return interaction.reply({
				content: "Invalid time! Use formats like: 30m, 1h, 1d, 1w",
				ephemeral: true,
			});
		}

		// Max 30 days
		if (durationMs > 30 * 24 * 60 * 60 * 1000) {
			return interaction.reply({
				content: "Reminders cannot be set for more than 30 days!",
				ephemeral: true,
			});
		}

		const remindAt = new Date(Date.now() + durationMs);

		// Note: In production, this should be stored in database for persistence
		interaction.client.setTimeout(async () => {
			try {
				await interaction.user.send({
					embeds: [{
						color: 0x3669FA,
						title: "⏰ Reminder!",
						description: reminder,
						footer: { text: `Reminder from ${interaction.guild.name}` },
					}],
				});
			} catch (_) {
				// DMs disabled
			}
		}, durationMs, `reminder-${interaction.user.id}-${Date.now()}`);

		return interaction.reply({
			embeds: [{
				color: 0x3669FA,
				title: "⏰ Reminder Set!",
				description: reminder,
				fields: [
					{ name: "When", value: `<t:${Math.floor(remindAt.getTime() / 1000)}:R>`, inline: true },
				],
			}],
			ephemeral: true,
		});
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
