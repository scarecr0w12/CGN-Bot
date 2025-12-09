const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("time")
		.setDescription("Get the current time in a timezone")
		.addStringOption(opt =>
			opt.setName("timezone")
				.setDescription("The timezone (e.g., UTC, EST, PST, Europe/London)")
				.setRequired(true),
		),

	async execute (interaction) {
		const tz = interaction.options.getString("timezone").toUpperCase();

		const timezoneMap = {
			UTC: "UTC",
			GMT: "UTC",
			EST: "America/New_York",
			EDT: "America/New_York",
			CST: "America/Chicago",
			CDT: "America/Chicago",
			MST: "America/Denver",
			MDT: "America/Denver",
			PST: "America/Los_Angeles",
			PDT: "America/Los_Angeles",
			JST: "Asia/Tokyo",
			KST: "Asia/Seoul",
			IST: "Asia/Kolkata",
			CET: "Europe/Paris",
			CEST: "Europe/Paris",
			BST: "Europe/London",
			AEST: "Australia/Sydney",
			AEDT: "Australia/Sydney",
		};

		const timezone = timezoneMap[tz] || interaction.options.getString("timezone");

		try {
			const now = new Date();
			const timeString = now.toLocaleString("en-US", {
				timeZone: timezone,
				weekday: "long",
				year: "numeric",
				month: "long",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
				timeZoneName: "short",
			});

			return interaction.reply({
				embeds: [{
					color: 0x3669FA,
					title: `🕐 Time in ${timezone}`,
					description: timeString,
				}],
			});
		} catch (err) {
			return interaction.reply({
				content: `Invalid timezone! Try common ones like: UTC, EST, PST, JST, CET`,
				ephemeral: true,
			});
		}
	},
};
