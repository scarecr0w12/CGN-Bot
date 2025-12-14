const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");

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

			default:
				return interaction.reply({ content: "Unknown subcommand", ephemeral: true });
		}
	},
};
