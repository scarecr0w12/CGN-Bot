const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const ModLog = require("../../../Modules/ModLog");

module.exports = {
	adminLevel: 3,
	data: new SlashCommandBuilder()
		.setName("modlog")
		.setDescription("Configure the moderation log")
		.addSubcommand(sub =>
			sub.setName("enable")
				.setDescription("Enable modlog in a channel")
				.addChannelOption(opt =>
					opt.setName("channel")
						.setDescription("The channel for modlogs")
						.addChannelTypes(ChannelType.GuildText)
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("disable")
				.setDescription("Disable modlog"),
		)
		.addSubcommand(sub =>
			sub.setName("status")
				.setDescription("View modlog status"),
		)
		.addSubcommand(sub =>
			sub.setName("test")
				.setDescription("Send a test entry to the modlog"),
		)
		.addSubcommand(sub =>
			sub.setName("events")
				.setDescription("Configure which events are logged")
				.addStringOption(opt =>
					opt.setName("event")
						.setDescription("Event type to toggle")
						.setRequired(true)
						.addChoices(
							{ name: "Strikes", value: "strikes" },
							{ name: "Kicks", value: "kicks" },
							{ name: "Bans", value: "bans" },
							{ name: "Mutes", value: "mutes" },
							{ name: "Filter Violations", value: "filter_violations" },
							{ name: "Raid Alerts", value: "raid_alerts" },
							{ name: "Alt Detection", value: "alt_detection" },
							{ name: "Message Deleted", value: "message_deleted" },
							{ name: "Message Edited", value: "message_edited" },
							{ name: "Member Joined", value: "member_joined" },
							{ name: "Member Left", value: "member_left" },
							{ name: "Role Created", value: "role_created" },
							{ name: "Role Deleted", value: "role_deleted" },
							{ name: "Role Modified", value: "role_modified" },
							{ name: "Channel Created", value: "channel_created" },
							{ name: "Channel Deleted", value: "channel_deleted" },
							{ name: "Channel Modified", value: "channel_modified" },
							{ name: "Bulk Delete", value: "bulk_delete" },
						),
				)
				.addBooleanOption(opt =>
					opt.setName("enabled")
						.setDescription("Enable or disable logging this event")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("history")
				.setDescription("View recent modlog entries")
				.addIntegerOption(opt =>
					opt.setName("count")
						.setDescription("Number of entries to show (1-25)")
						.setMinValue(1)
						.setMaxValue(25)
						.setRequired(false),
				),
		)
		.addSubcommand(sub =>
			sub.setName("search")
				.setDescription("Search modlog entries")
				.addStringOption(opt =>
					opt.setName("user")
						.setDescription("Filter by affected user ID")
						.setRequired(false),
				)
				.addStringOption(opt =>
					opt.setName("type")
						.setDescription("Filter by entry type")
						.setRequired(false),
				)
				.addStringOption(opt =>
					opt.setName("severity")
						.setDescription("Filter by severity level")
						.setRequired(false)
						.addChoices(
							{ name: "Low", value: "low" },
							{ name: "Medium", value: "medium" },
							{ name: "High", value: "high" },
							{ name: "Critical", value: "critical" },
						),
				),
		)
		.addSubcommand(sub =>
			sub.setName("stats")
				.setDescription("View modlog statistics"),
		)
		.addSubcommand(sub =>
			sub.setName("retention")
				.setDescription("Set log retention policy")
				.addIntegerOption(opt =>
					opt.setName("days")
						.setDescription("Number of days to retain logs (0 = unlimited)")
						.setMinValue(0)
						.setMaxValue(365)
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("export")
				.setDescription("Export modlog entries")
				.addStringOption(opt =>
					opt.setName("format")
						.setDescription("Export format")
						.setRequired(true)
						.addChoices(
							{ name: "JSON", value: "json" },
							{ name: "CSV", value: "csv" },
						),
				),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

	async execute (interaction, client, serverDocument) {
		const subcommand = interaction.options.getSubcommand();
		const serverQueryDocument = serverDocument.query;

		switch (subcommand) {
			case "enable": {
				const channel = interaction.options.getChannel("channel");

				serverQueryDocument.set("modlog.isEnabled", true);
				serverQueryDocument.set("modlog.channel_id", channel.id);
				await serverDocument.save();

				return interaction.reply({
					content: `📋 Modlog enabled in ${channel}!`,
					ephemeral: true,
				});
			}

			case "disable": {
				serverQueryDocument.set("modlog.isEnabled", false);
				await serverDocument.save();

				return interaction.reply({
					content: "📋 Modlog has been disabled!",
					ephemeral: true,
				});
			}

			case "status": {
				const modlog = serverDocument.modlog || {};
				const channelMention = modlog.channel_id ? `<#${modlog.channel_id}>` : "Not set";
				const isEnabled = modlog.isEnabled || false;
				const events = modlog.events || {};

				const eventsList = [
					`Strikes: ${events.strikes !== false ? "✅" : "❌"}`,
					`Kicks: ${events.kicks !== false ? "✅" : "❌"}`,
					`Bans: ${events.bans !== false ? "✅" : "❌"}`,
					`Mutes: ${events.mutes !== false ? "✅" : "❌"}`,
					`Filter Violations: ${events.filter_violations !== false ? "✅" : "❌"}`,
					`Raid Alerts: ${events.raid_alerts !== false ? "✅" : "❌"}`,
					`Alt Detection: ${events.alt_detection !== false ? "✅" : "❌"}`,
					`Message Deleted: ${events.message_deleted !== false ? "✅" : "❌"}`,
					`Message Edited: ${events.message_edited !== false ? "✅" : "❌"}`,
					`Member Joined: ${events.member_joined !== false ? "✅" : "❌"}`,
					`Member Left: ${events.member_left !== false ? "✅" : "❌"}`,
					`Role Created: ${events.role_created !== false ? "✅" : "❌"}`,
					`Role Deleted: ${events.role_deleted !== false ? "✅" : "❌"}`,
					`Role Modified: ${events.role_modified !== false ? "✅" : "❌"}`,
					`Channel Created: ${events.channel_created !== false ? "✅" : "❌"}`,
					`Channel Deleted: ${events.channel_deleted !== false ? "✅" : "❌"}`,
					`Channel Modified: ${events.channel_modified !== false ? "✅" : "❌"}`,
					`Bulk Delete: ${events.bulk_delete !== false ? "✅" : "❌"}`,
				].join("\n");

				return interaction.reply({
					embeds: [{
						color: isEnabled ? 0x00FF00 : 0xFF0000,
						title: "📋 Modlog Configuration",
						fields: [
							{ name: "Status", value: isEnabled ? "✅ Enabled" : "❌ Disabled", inline: true },
							{ name: "Channel", value: channelMention, inline: true },
							{ name: "Case Count", value: `${modlog.current_id || 0}`, inline: true },
							{ name: "Logged Events", value: eventsList, inline: false },
						],
						footer: { text: "Use /modlog events to configure which events are logged" },
					}],
					ephemeral: true,
				});
			}

			case "test": {
				const modlog = serverDocument.modlog || {};
				if (!modlog.isEnabled || !modlog.channel_id) {
					return interaction.reply({
						content: "⚠️ Modlog is not enabled! Use `/modlog enable` first.",
						ephemeral: true,
					});
				}

				const channel = interaction.guild.channels.cache.get(modlog.channel_id);
				if (!channel) {
					return interaction.reply({
						content: "⚠️ Modlog channel not found! Please reconfigure with `/modlog enable`.",
						ephemeral: true,
					});
				}

				try {
					await channel.send({
						embeds: [{
							color: 0x3669FA,
							title: "📋 Modlog Test",
							description: "This is a test entry to verify the modlog is working correctly.",
							fields: [
								{ name: "Triggered By", value: `${interaction.user.tag}`, inline: true },
								{ name: "Channel", value: `${channel}`, inline: true },
							],
							timestamp: new Date().toISOString(),
						}],
					});

					return interaction.reply({
						content: `✅ Test entry sent to ${channel}!`,
						ephemeral: true,
					});
				} catch (err) {
					return interaction.reply({
						content: `❌ Failed to send test entry: ${err.message}`,
						ephemeral: true,
					});
				}
			}

			case "events": {
				const event = interaction.options.getString("event");
				const enabled = interaction.options.getBoolean("enabled");

				serverQueryDocument.set(`modlog.events.${event}`, enabled);
				await serverDocument.save();

				const eventNames = {
					strikes: "Strikes",
					kicks: "Kicks",
					bans: "Bans",
					mutes: "Mutes",
					filter_violations: "Filter Violations",
					raid_alerts: "Raid Alerts",
					alt_detection: "Alt Detection",
					message_deleted: "Message Deleted",
					message_edited: "Message Edited",
					member_joined: "Member Joined",
					member_left: "Member Left",
					role_created: "Role Created",
					role_deleted: "Role Deleted",
					role_modified: "Role Modified",
					channel_created: "Channel Created",
					channel_deleted: "Channel Deleted",
					channel_modified: "Channel Modified",
					bulk_delete: "Bulk Delete",
				};

				return interaction.reply({
					content: enabled ?
						`✅ **${eventNames[event]}** will now be logged!` :
						`❌ **${eventNames[event]}** will no longer be logged!`,
					ephemeral: true,
				});
			}

			case "history": {
				const modlog = serverDocument.modlog || {};
				if (!modlog.isEnabled || !modlog.channel_id) {
					return interaction.reply({
						content: "⚠️ Modlog is not enabled!",
						ephemeral: true,
					});
				}

				const count = interaction.options.getInteger("count") || 10;
				const channel = interaction.guild.channels.cache.get(modlog.channel_id);

				if (!channel) {
					return interaction.reply({
						content: "⚠️ Modlog channel not found!",
						ephemeral: true,
					});
				}

				try {
					const messages = await channel.messages.fetch({ limit: count });
					const entries = messages
						.filter(m => m.author.id === client.user.id && m.embeds.length > 0)
						.map(m => {
							const embed = m.embeds[0];
							const title = embed.title || embed.description?.substring(0, 50) || "Entry";
							return `• ${title} (<t:${Math.floor(m.createdTimestamp / 1000)}:R>)`;
						})
						.slice(0, count);

					if (entries.length === 0) {
						return interaction.reply({
							content: "No recent modlog entries found.",
							ephemeral: true,
						});
					}

					return interaction.reply({
						embeds: [{
							color: 0x3669FA,
							title: `📋 Recent Modlog Entries`,
							description: entries.join("\n"),
							footer: { text: `Showing ${entries.length} entries from ${channel.name}` },
						}],
						ephemeral: true,
					});
				} catch (err) {
					return interaction.reply({
						content: `❌ Failed to fetch history: ${err.message}`,
						ephemeral: true,
					});
				}
			}

			case "search": {
				const userId = interaction.options.getString("user");
				const type = interaction.options.getString("type");
				const severity = interaction.options.getString("severity");

				const filters = {};
				if (userId) filters.userId = userId;
				if (type) filters.type = type;
				if (severity) filters.severity = severity;

				const results = await ModLog.search(interaction.guild, filters);

				if (results.length === 0) {
					return interaction.reply({
						content: "No modlog entries found matching your search criteria.",
						ephemeral: true,
					});
				}

				const entries = results.slice(0, 10).map(e => {
					const sev = e.severity || "medium";
					const severityEmoji = { low: "🟢", medium: "🟡", high: "🔴", critical: "⚫" }[sev] || "⚪";
					return `${severityEmoji} **Case ${e._id}:** ${e.type} - ${e.affected_user || "N/A"}`;
				}).join("\n");

				return interaction.reply({
					embeds: [{
						color: 0x3669FA,
						title: `📋 Search Results (${results.length} total)`,
						description: entries,
						footer: { text: `Showing first 10 results` },
					}],
					ephemeral: true,
				});
			}

			case "stats": {
				const stats = await ModLog.getStats(interaction.guild);

				if (!stats) {
					return interaction.reply({
						content: "Modlog is not enabled or has no entries.",
						ephemeral: true,
					});
				}

				const typeEntries = Object.entries(stats.by_type)
					.sort((a, b) => b[1] - a[1])
					.slice(0, 5)
					.map(([type, count]) => `• ${type}: ${count}`)
					.join("\n");

				const creatorEntries = Object.entries(stats.by_creator)
					.sort((a, b) => b[1] - a[1])
					.slice(0, 5)
					.map(([creator, count]) => `• ${creator}: ${count}`)
					.join("\n");

				return interaction.reply({
					embeds: [{
						color: 0x3669FA,
						title: "📊 Modlog Statistics",
						fields: [
							{ name: "Total Entries", value: `${stats.total_entries}`, inline: true },
							{ name: "Last Entry", value: stats.last_entry ? `<t:${Math.floor(stats.last_entry.getTime() / 1000)}:R>` : "None", inline: true },
							{
								name: "By Severity",
								value: `🟢 Low: ${stats.by_severity.low}\n🟡 Medium: ${stats.by_severity.medium}\n🔴 High: ${stats.by_severity.high}\n⚫ Critical: ${stats.by_severity.critical}`,
								inline: false,
							},
							{ name: "Top Entry Types", value: typeEntries || "None", inline: true },
							{ name: "Top Moderators", value: creatorEntries || "None", inline: true },
						],
					}],
					ephemeral: true,
				});
			}

			case "retention": {
				const days = interaction.options.getInteger("days");
				serverQueryDocument.set("modlog.retention_days", days);
				await serverDocument.save();

				return interaction.reply({
					content: days === 0 ? "✅ Retention policy disabled (logs kept indefinitely)" : `✅ Retention policy set to ${days} days`,
					ephemeral: true,
				});
			}

			case "export": {
				const format = interaction.options.getString("format");

				try {
					let content, filename;

					if (format === "json") {
						const data = await ModLog.exportJSON(interaction.guild);
						content = JSON.stringify(data, null, 2);
						filename = `modlog-${interaction.guild.id}-${Date.now()}.json`;
					} else if (format === "csv") {
						content = await ModLog.exportCSV(interaction.guild);
						filename = `modlog-${interaction.guild.id}-${Date.now()}.csv`;
					}

					if (!content) {
						return interaction.reply({
							content: "Failed to export modlog (not enabled or no entries).",
							ephemeral: true,
						});
					}

					const buffer = Buffer.from(content, "utf-8");
					return interaction.reply({
						files: [{ attachment: buffer, name: filename }],
						content: `✅ Modlog exported as ${format.toUpperCase()}`,
						ephemeral: true,
					});
				} catch (err) {
					logger.error("Failed to export modlog", { svrid: interaction.guild.id }, err);
					return interaction.reply({
						content: `❌ Failed to export modlog: ${err.message}`,
						ephemeral: true,
					});
				}
			}

			default:
				return interaction.reply({ content: "Unknown subcommand", ephemeral: true });
		}
	},
};
