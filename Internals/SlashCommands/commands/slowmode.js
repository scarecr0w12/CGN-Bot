const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
	adminLevel: 1,
	data: new SlashCommandBuilder()
		.setName("slowmode")
		.setDescription("Set or remove slowmode for the current channel")
		.addIntegerOption(opt =>
			opt.setName("seconds")
				.setDescription("Slowmode duration in seconds (0 to disable, max 21600)")
				.setMinValue(0)
				.setMaxValue(21600)
				.setRequired(false),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

	async execute (interaction) {
		const seconds = interaction.options.getInteger("seconds");

		// If no seconds provided, show current status
		if (seconds === null) {
			const current = interaction.channel.rateLimitPerUser;
			if (current === 0) {
				return interaction.reply({
					content: "🐌 This channel has no slowmode.",
					ephemeral: true,
				});
			}
			return interaction.reply({
				content: `🐌 Current slowmode: **${formatDuration(current)}**`,
				ephemeral: true,
			});
		}

		try {
			await interaction.channel.setRateLimitPerUser(
				seconds,
				`Slowmode ${seconds === 0 ? "disabled" : "set"} by ${interaction.user.tag}`,
			);

			if (seconds === 0) {
				return interaction.reply({
					content: "🐌 Slowmode has been **disabled** for this channel!",
				});
			}

			return interaction.reply({
				content: `🐌 Slowmode set to **${formatDuration(seconds)}** for this channel!`,
			});
		} catch (err) {
			return interaction.reply({
				content: "Failed to set slowmode!",
				ephemeral: true,
			});
		}
	},
};

function formatDuration (seconds) {
	if (seconds < 60) return `${seconds} second${seconds !== 1 ? "s" : ""}`;
	if (seconds < 3600) {
		const minutes = Math.floor(seconds / 60);
		return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
	}
	const hours = Math.floor(seconds / 3600);
	return `${hours} hour${hours !== 1 ? "s" : ""}`;
}
