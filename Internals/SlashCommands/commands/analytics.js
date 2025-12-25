const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require("discord.js");
const TierManager = require("../../../Modules/TierManager");
const { AnalyticsCollector, AnalyticsExporter } = require("../../../Modules/Analytics");

module.exports = {
	adminLevel: 3,
	data: new SlashCommandBuilder()
		.setName("analytics")
		.setDescription("Advanced server analytics (Premium Tier 2)")
		.addSubcommand(sub =>
			sub.setName("members")
				.setDescription("View member activity statistics")
				.addIntegerOption(opt =>
					opt.setName("days")
						.setDescription("Activity period in days (default: 7)")
						.setMinValue(1)
						.setMaxValue(90)
						.setRequired(false),
				)
				.addIntegerOption(opt =>
					opt.setName("limit")
						.setDescription("Number of members to show (default: 10)")
						.setMinValue(5)
						.setMaxValue(25)
						.setRequired(false),
				),
		)
		.addSubcommand(sub =>
			sub.setName("channels")
				.setDescription("View channel activity statistics")
				.addIntegerOption(opt =>
					opt.setName("limit")
						.setDescription("Number of channels to show (default: 10)")
						.setMinValue(5)
						.setMaxValue(25)
						.setRequired(false),
				),
		)
		.addSubcommand(sub =>
			sub.setName("roles")
				.setDescription("View role engagement statistics")
				.addIntegerOption(opt =>
					opt.setName("days")
						.setDescription("Activity period in days (default: 7)")
						.setMinValue(1)
						.setMaxValue(90)
						.setRequired(false),
				),
		)
		.addSubcommand(sub =>
			sub.setName("joins")
				.setDescription("View join/leave analytics")
				.addIntegerOption(opt =>
					opt.setName("days")
						.setDescription("Period in days (default: 30)")
						.setMinValue(1)
						.setMaxValue(90)
						.setRequired(false),
				),
		)
		.addSubcommand(sub =>
			sub.setName("commands")
				.setDescription("View command usage statistics")
				.addIntegerOption(opt =>
					opt.setName("limit")
						.setDescription("Number of commands to show (default: 15)")
						.setMinValue(5)
						.setMaxValue(50)
						.setRequired(false),
				),
		)
		.addSubcommand(sub =>
			sub.setName("heatmap")
				.setDescription("View activity heatmap by day/hour"),
		)
		.addSubcommand(sub =>
			sub.setName("export")
				.setDescription("Export analytics data to CSV")
				.addStringOption(opt =>
					opt.setName("type")
						.setDescription("Type of data to export")
						.setRequired(true)
						.addChoices(
							{ name: "Member Activity", value: "members" },
							{ name: "Channel Activity", value: "channels" },
							{ name: "Command Usage", value: "commands" },
							{ name: "Role Engagement", value: "roles" },
							{ name: "Join/Leave Data", value: "joins" },
							{ name: "Full Report", value: "full" },
						),
				),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	async execute (interaction, client, serverDocument) {
		// Check Tier 2 requirement
		const hasTier = await TierManager.hasMinimumTierLevel(interaction.guild.id, 2);
		if (!hasTier) {
			return interaction.reply({
				embeds: [{
					color: 0xFF6B6B,
					title: "⭐ Premium Feature",
					description: "Advanced Analytics requires **Tier 2 (Premium)** subscription.\n\nUpgrade your server to unlock detailed analytics and insights!",
					footer: { text: "Visit the dashboard to upgrade" },
				}],
				ephemeral: true,
			});
		}

		await interaction.deferReply({ ephemeral: true });

		const subcommand = interaction.options.getSubcommand();
		const guild = interaction.guild;

		try {
			switch (subcommand) {
				case "members": {
					const days = interaction.options.getInteger("days") || 7;
					const limit = interaction.options.getInteger("limit") || 10;

					const data = await AnalyticsCollector.getMemberActivity(
						serverDocument, guild, { days, limit },
					);

					const topMembers = await Promise.all(
						data.topByMessages.slice(0, limit).map(async (m, i) => {
							const user = await client.users.fetch(m.id).catch(() => null);
							const name = user ? user.username : `User ${m.id.slice(-4)}`;
							return `**${i + 1}.** ${name} - ${m.messages.toLocaleString()} msgs`;
						}),
					);

					return interaction.editReply({
						embeds: [{
							color: 0x5865F2,
							title: "📊 Member Activity Analytics",
							description: `Activity over the last **${days} days**`,
							fields: [
								{
									name: "Overview",
									value: [
										`👥 **Tracked Members:** ${data.overview.totalTracked.toLocaleString()}`,
										`✅ **Active:** ${data.overview.activeCount.toLocaleString()} (${data.overview.activityRate}%)`,
										`😴 **Inactive:** ${data.overview.inactiveCount.toLocaleString()}`,
										`💬 **Total Messages:** ${data.totalMessages.toLocaleString()}`,
									].join("\n"),
									inline: false,
								},
								{
									name: "Message Distribution",
									value: [
										`📭 No messages: ${data.messageDistribution.none}`,
										`📫 1-50: ${data.messageDistribution.low}`,
										`📬 51-200: ${data.messageDistribution.medium}`,
										`📮 201-500: ${data.messageDistribution.high}`,
										`🏆 500+: ${data.messageDistribution.veryHigh}`,
									].join("\n"),
									inline: true,
								},
								{
									name: `Top ${limit} by Messages`,
									value: topMembers.length > 0 ? topMembers.join("\n") : "No data",
									inline: true,
								},
							],
							footer: { text: "Use /analytics export members for full data" },
						}],
					});
				}

				case "channels": {
					const limit = interaction.options.getInteger("limit") || 10;

					const data = await AnalyticsCollector.getChannelActivity(
						serverDocument, guild, { limit },
					);

					const topChannels = data.topChannels.slice(0, limit).map((c, i) =>
						`**${i + 1}.** #${c.name} - ${c.messages.toLocaleString()} (${c.percentage}%)`,
					);

					return interaction.editReply({
						embeds: [{
							color: 0x57F287,
							title: "📈 Channel Activity Analytics",
							fields: [
								{
									name: "Overview",
									value: [
										`📺 **Channels Tracked:** ${data.overview.totalChannels}`,
										`💬 **Total Messages:** ${data.overview.totalMessages.toLocaleString()}`,
										`📊 **Avg per Channel:** ${data.overview.averageMessagesPerChannel.toLocaleString()}`,
									].join("\n"),
									inline: false,
								},
								{
									name: "Channel Types",
									value: [
										`💬 Text: ${data.typeDistribution.text}`,
										`🔊 Voice: ${data.typeDistribution.voice}`,
										`📁 Categories: ${data.typeDistribution.category}`,
										`📋 Forums: ${data.typeDistribution.forum}`,
									].join("\n"),
									inline: true,
								},
								{
									name: `Top ${limit} Channels`,
									value: topChannels.length > 0 ? topChannels.join("\n") : "No data",
									inline: true,
								},
							],
							footer: { text: "Use /analytics export channels for full data" },
						}],
					});
				}

				case "roles": {
					const days = interaction.options.getInteger("days") || 7;

					const data = await AnalyticsCollector.getRoleEngagement(
						serverDocument, guild, { days, limit: 10 },
					);

					const topBySize = data.topBySize.slice(0, 8).map((r, i) =>
						`**${i + 1}.** ${r.name} - ${r.memberCount} members (${r.engagementRate}% active)`,
					);

					const topByEngagement = data.topByEngagement.slice(0, 5).map((r, i) =>
						`**${i + 1}.** ${r.name} - ${r.engagementRate}% engagement`,
					);

					return interaction.editReply({
						embeds: [{
							color: 0xFEE75C,
							title: "🎭 Role Engagement Analytics",
							description: `Activity over the last **${days} days**`,
							fields: [
								{
									name: "Overview",
									value: [
										`🏷️ **Total Roles:** ${data.overview.totalRoles}`,
										`👥 **Server Members:** ${data.overview.totalMembers.toLocaleString()}`,
									].join("\n"),
									inline: false,
								},
								{
									name: "Largest Roles",
									value: topBySize.length > 0 ? topBySize.join("\n") : "No data",
									inline: false,
								},
								{
									name: "Most Engaged Roles",
									value: topByEngagement.length > 0 ? topByEngagement.join("\n") : "Need 3+ members per role",
									inline: false,
								},
							],
							footer: { text: "Use /analytics export roles for full data" },
						}],
					});
				}

				case "joins": {
					const days = interaction.options.getInteger("days") || 30;

					const data = await AnalyticsCollector.getJoinLeaveAnalytics(
						serverDocument, guild, { days },
					);

					const recentJoins = data.recentJoins.slice(0, 10).map((j, i) => {
						const date = new Date(j.joinedAt).toLocaleDateString();
						return `**${i + 1}.** ${j.username} - ${date} (${j.accountAge}d old)`;
					});

					return interaction.editReply({
						embeds: [{
							color: 0xEB459E,
							title: "📥 Join/Leave Analytics",
							description: `Data for the last **${days} days**`,
							fields: [
								{
									name: "Overview",
									value: [
										`📥 **Total Joins:** ${data.overview.totalJoins}`,
										`📊 **Daily Average:** ${data.overview.avgDailyJoins}`,
										`👥 **Current Members:** ${data.overview.currentMembers.toLocaleString()}`,
									].join("\n"),
									inline: false,
								},
								{
									name: "Account Age Distribution",
									value: [
										`🆕 New (<7 days): ${data.accountAgeDistribution.new}`,
										`📅 Recent (7-30 days): ${data.accountAgeDistribution.recent}`,
										`✅ Established (1-6 mo): ${data.accountAgeDistribution.established}`,
										`🏆 Veteran (6+ mo): ${data.accountAgeDistribution.veteran}`,
									].join("\n"),
									inline: true,
								},
								{
									name: "Recent Joins",
									value: recentJoins.length > 0 ? recentJoins.join("\n") : "No recent joins",
									inline: true,
								},
							],
							footer: { text: "Use /analytics export joins for full data" },
						}],
					});
				}

				case "commands": {
					const limit = interaction.options.getInteger("limit") || 15;

					const data = await AnalyticsCollector.getCommandStats(
						serverDocument, { limit },
					);

					const topCommands = data.topCommands.slice(0, limit).map((c, i) =>
						`**${i + 1}.** \`${c.name}\` - ${c.count.toLocaleString()} (${c.percentage}%)`,
					);

					return interaction.editReply({
						embeds: [{
							color: 0x5865F2,
							title: "⌨️ Command Usage Analytics",
							fields: [
								{
									name: "Overview",
									value: [
										`📋 **Commands Used:** ${data.overview.totalCommands}`,
										`🔢 **Total Usage:** ${data.overview.totalUsage.toLocaleString()}`,
										`📊 **Avg per Command:** ${data.overview.avgUsagePerCommand.toLocaleString()}`,
									].join("\n"),
									inline: false,
								},
								{
									name: `Top ${Math.min(limit, data.topCommands.length)} Commands`,
									value: topCommands.length > 0 ? topCommands.join("\n") : "No command usage data",
									inline: false,
								},
							],
							footer: { text: "Use /analytics export commands for full data" },
						}],
					});
				}

				case "heatmap": {
					const data = await AnalyticsCollector.getActivityHeatmap(serverDocument, []);

					// Create text-based heatmap visualization
					const heatmapRows = data.dayNames.map((day, dayIndex) => {
						const dayData = data.heatmap[dayIndex];
						const maxVal = Math.max(...dayData, 1);
						const blocks = dayData.map(val => {
							const intensity = val / maxVal;
							if (intensity === 0) return "⬜";
							if (intensity < 0.25) return "🟦";
							if (intensity < 0.5) return "🟩";
							if (intensity < 0.75) return "🟨";
							return "🟥";
						}).join("");
						return `${day.slice(0, 3)}: ${blocks}`;
					});

					return interaction.editReply({
						embeds: [{
							color: 0xED4245,
							title: "🔥 Activity Heatmap",
							description: "Activity by day and hour (0-23h)\n⬜ None 🟦 Low 🟩 Medium 🟨 High 🟥 Peak",
							fields: [
								{
									name: "Weekly Pattern",
									value: `\`\`\`\n${heatmapRows.join("\n")}\n\`\`\``,
									inline: false,
								},
								{
									name: "Peak Activity",
									value: data.peak.activity > 0 ?
										`📍 **${data.peak.day}** at **${data.peak.hour}:00**` :
										"Not enough data yet",
									inline: true,
								},
								{
									name: "Busiest Day",
									value: data.dailyTotals.length > 0 ?
										`📅 **${data.dailyTotals.sort((a, b) => b.total - a.total)[0].day}**` :
										"Not enough data",
									inline: true,
								},
							],
							footer: { text: "Heatmap updates as more data is collected" },
						}],
					});
				}

				case "export": {
					const exportType = interaction.options.getString("type");

					let csvData;
					let filename;

					switch (exportType) {
						case "members": {
							const memberData = await AnalyticsCollector.getMemberActivity(serverDocument, guild, { limit: 100 });
							csvData = AnalyticsExporter.exportMemberActivity(memberData);
							filename = `member-activity-${guild.id}.csv`;
							break;
						}
						case "channels": {
							const channelData = await AnalyticsCollector.getChannelActivity(serverDocument, guild, { limit: 100 });
							csvData = AnalyticsExporter.exportChannelActivity(channelData);
							filename = `channel-activity-${guild.id}.csv`;
							break;
						}
						case "commands": {
							const commandData = await AnalyticsCollector.getCommandStats(serverDocument, { limit: 100 });
							csvData = AnalyticsExporter.exportCommandStats(commandData);
							filename = `command-usage-${guild.id}.csv`;
							break;
						}
						case "roles": {
							const roleData = await AnalyticsCollector.getRoleEngagement(serverDocument, guild, { limit: 100 });
							csvData = AnalyticsExporter.exportRoleEngagement(roleData);
							filename = `role-engagement-${guild.id}.csv`;
							break;
						}
						case "joins": {
							const joinData = await AnalyticsCollector.getJoinLeaveAnalytics(serverDocument, guild, { days: 90 });
							csvData = AnalyticsExporter.exportJoinLeave(joinData);
							filename = `join-data-${guild.id}.csv`;
							break;
						}
						case "full": {
							const allData = {
								memberActivity: await AnalyticsCollector.getMemberActivity(serverDocument, guild, { limit: 100 }),
								channelActivity: await AnalyticsCollector.getChannelActivity(serverDocument, guild, { limit: 100 }),
								commandStats: await AnalyticsCollector.getCommandStats(serverDocument, { limit: 100 }),
								roleEngagement: await AnalyticsCollector.getRoleEngagement(serverDocument, guild, { limit: 100 }),
								joinLeave: await AnalyticsCollector.getJoinLeaveAnalytics(serverDocument, guild, { days: 90 }),
							};
							csvData = JSON.stringify(allData, null, 2);
							filename = `full-analytics-${guild.id}.json`;
							break;
						}
					}

					const attachment = new AttachmentBuilder(Buffer.from(csvData), { name: filename });

					return interaction.editReply({
						content: `📊 Here's your ${exportType} analytics export:`,
						files: [attachment],
					});
				}

				default:
					return interaction.editReply({ content: "Unknown subcommand" });
			}
		} catch (error) {
			logger.error("Analytics command error", { subcommand, guildId: guild.id }, error);
			return interaction.editReply({
				content: "❌ An error occurred while fetching analytics data. Please try again.",
			});
		}
	},
};
