const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("countdown")
		.setDescription("Set a countdown to an event")
		.addStringOption(opt =>
			opt.setName("event")
				.setDescription("Event name")
				.setRequired(true),
		)
		.addStringOption(opt =>
			opt.setName("time")
				.setDescription("Time until event (e.g., 1h, 1d, 1w)")
				.setRequired(true),
		),

	async execute (interaction) {
		const event = interaction.options.getString("event");
		const timeStr = interaction.options.getString("time");

		const durationMs = parseDuration(timeStr);
		if (!durationMs || durationMs <= 0) {
			return interaction.reply({
				content: "Invalid time format! Use formats like: 1h, 1d, 1w",
				ephemeral: true,
			});
		}

		const targetTime = new Date(Date.now() + durationMs);
		const timestamp = Math.floor(targetTime.getTime() / 1000);

		return interaction.reply({
			embeds: [{
				color: 0x3669FA,
				title: `⏰ Countdown: ${event}`,
				description: [
					`**Time:** <t:${timestamp}:F>`,
					`**Remaining:** <t:${timestamp}:R>`,
				].join("\n"),
				footer: { text: `Set by ${interaction.user.tag}` },
			}],
		});
	},
};

function parseDuration (str) {
	const match = str.match(/^(\d+)\s*(m|min|h|hr|d|day|w|week)s?$/i);
	if (!match) return null;

	const value = parseInt(match[1]);
	const unit = match[2].toLowerCase();

	if (unit.startsWith("m")) return value * 60 * 1000;
	if (unit.startsWith("h")) return value * 60 * 60 * 1000;
	if (unit.startsWith("d")) return value * 24 * 60 * 60 * 1000;
	if (unit.startsWith("w")) return value * 7 * 24 * 60 * 60 * 1000;
	return null;
}
