const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");

module.exports = {
	adminLevel: 2,
	data: new SlashCommandBuilder()
		.setName("antispam")
		.setDescription("Configure anti-spam protection")
		.addSubcommand(sub =>
			sub.setName("status")
				.setDescription("View anti-spam configuration"),
		)
		.addSubcommand(sub =>
			sub.setName("enable")
				.setDescription("Enable anti-spam protection"),
		)
		.addSubcommand(sub =>
			sub.setName("disable")
				.setDescription("Disable anti-spam protection"),
		)
		.addSubcommand(sub =>
			sub.setName("sensitivity")
				.setDescription("Set spam detection sensitivity")
				.addIntegerOption(opt =>
					opt.setName("level")
						.setDescription("Messages before triggering (3=strict, 5=normal, 10=lenient)")
						.setRequired(true)
						.addChoices(
							{ name: "Strict (3 messages)", value: 3 },
							{ name: "Normal (5 messages)", value: 5 },
							{ name: "Lenient (10 messages)", value: 10 },
						),
				),
		)
		.addSubcommand(sub =>
			sub.setName("action")
				.setDescription("Set action for spam violations")
				.addStringOption(opt =>
					opt.setName("action")
						.setDescription("Action to take on second violation")
						.setRequired(true)
						.addChoices(
							{ name: "None (warn only)", value: "none" },
							{ name: "Block from bot", value: "block" },
							{ name: "Mute in channel", value: "mute" },
							{ name: "Kick from server", value: "kick" },
							{ name: "Ban from server", value: "ban" },
						),
				),
		)
		.addSubcommand(sub =>
			sub.setName("delete")
				.setDescription("Toggle automatic message deletion")
				.addBooleanOption(opt =>
					opt.setName("enabled")
						.setDescription("Delete spam messages automatically")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("ignore")
				.setDescription("Ignore a channel from spam detection")
				.addChannelOption(opt =>
					opt.setName("channel")
						.setDescription("Channel to ignore")
						.addChannelTypes(ChannelType.GuildText)
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("unignore")
				.setDescription("Remove a channel from ignore list")
				.addChannelOption(opt =>
					opt.setName("channel")
						.setDescription("Channel to unignore")
						.addChannelTypes(ChannelType.GuildText)
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("role")
				.setDescription("Set violator role (given on violation)")
				.addRoleOption(opt =>
					opt.setName("role")
						.setDescription("Role to assign (leave empty to clear)")
						.setRequired(false),
				),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

	async execute (interaction, client, serverDocument) {
		const subcommand = interaction.options.getSubcommand();
		const serverQueryDocument = serverDocument.query;
		const spamFilter = serverDocument.config.moderation?.filters?.spam_filter || {};

		switch (subcommand) {
			case "status": {
				const ignoredChannels = spamFilter.disabled_channel_ids || [];
				const channelList = ignoredChannels.length > 0 ?
					ignoredChannels.map(id => `<#${id}>`).join(", ") :
					"None";

				const sensitivityName = spamFilter.message_sensitivity === 3 ?
					"Strict" : spamFilter.message_sensitivity === 10 ? "Lenient" : "Normal";

				return interaction.reply({
					embeds: [{
						color: spamFilter.isEnabled ? 0x00FF00 : 0xFF0000,
						title: "🛡️ Anti-Spam Configuration",
						fields: [
							{
								name: "Status",
								value: spamFilter.isEnabled ? "✅ Enabled" : "❌ Disabled",
								inline: true,
							},
							{
								name: "Sensitivity",
								value: `${sensitivityName} (${spamFilter.message_sensitivity || 5} msgs)`,
								inline: true,
							},
							{
								name: "Action",
								value: spamFilter.action || "mute",
								inline: true,
							},
							{
								name: "Delete Messages",
								value: spamFilter.delete_messages !== false ? "Yes" : "No",
								inline: true,
							},
							{
								name: "Violator Role",
								value: spamFilter.violator_role_id ? `<@&${spamFilter.violator_role_id}>` : "None",
								inline: true,
							},
							{
								name: "Ignored Channels",
								value: channelList,
								inline: false,
							},
						],
						footer: { text: "Spam is detected using Levenshtein distance within a 45-second window" },
					}],
					ephemeral: true,
				});
			}

			case "enable": {
				serverQueryDocument.set("config.moderation.filters.spam_filter.isEnabled", true);
				serverQueryDocument.set("config.moderation.isEnabled", true);
				await serverDocument.save();

				return interaction.reply({
					content: "✅ Anti-spam protection has been **enabled**!",
					ephemeral: true,
				});
			}

			case "disable": {
				serverQueryDocument.set("config.moderation.filters.spam_filter.isEnabled", false);
				await serverDocument.save();

				return interaction.reply({
					content: "❌ Anti-spam protection has been **disabled**!",
					ephemeral: true,
				});
			}

			case "sensitivity": {
				const level = interaction.options.getInteger("level");
				serverQueryDocument.set("config.moderation.filters.spam_filter.message_sensitivity", level);
				await serverDocument.save();

				const levelName = level === 3 ? "Strict" : level === 5 ? "Normal" : "Lenient";
				return interaction.reply({
					content: `✅ Spam sensitivity set to **${levelName}** (${level} messages)!`,
					ephemeral: true,
				});
			}

			case "action": {
				const action = interaction.options.getString("action");
				serverQueryDocument.set("config.moderation.filters.spam_filter.action", action);
				await serverDocument.save();

				return interaction.reply({
					content: `✅ Spam violation action set to **${action}**!`,
					ephemeral: true,
				});
			}

			case "delete": {
				const enabled = interaction.options.getBoolean("enabled");
				serverQueryDocument.set("config.moderation.filters.spam_filter.delete_messages", enabled);
				await serverDocument.save();

				return interaction.reply({
					content: enabled ?
						"✅ Spam messages will now be **automatically deleted**!" :
						"❌ Spam messages will **not** be automatically deleted!",
					ephemeral: true,
				});
			}

			case "ignore": {
				const channel = interaction.options.getChannel("channel");
				const ignoredChannels = spamFilter.disabled_channel_ids || [];

				if (ignoredChannels.includes(channel.id)) {
					return interaction.reply({
						content: `⚠️ ${channel} is already being ignored!`,
						ephemeral: true,
					});
				}

				serverQueryDocument.push("config.moderation.filters.spam_filter.disabled_channel_ids", channel.id);
				await serverDocument.save();

				return interaction.reply({
					content: `✅ ${channel} will now be **ignored** by the spam filter!`,
					ephemeral: true,
				});
			}

			case "unignore": {
				const channel = interaction.options.getChannel("channel");
				const ignoredChannels = spamFilter.disabled_channel_ids || [];

				if (!ignoredChannels.includes(channel.id)) {
					return interaction.reply({
						content: `⚠️ ${channel} is not in the ignore list!`,
						ephemeral: true,
					});
				}

				const updatedChannels = ignoredChannels.filter(id => id !== channel.id);
				serverQueryDocument.set("config.moderation.filters.spam_filter.disabled_channel_ids", updatedChannels);
				await serverDocument.save();

				return interaction.reply({
					content: `✅ ${channel} will now be **monitored** by the spam filter!`,
					ephemeral: true,
				});
			}

			case "role": {
				const role = interaction.options.getRole("role");
				serverQueryDocument.set("config.moderation.filters.spam_filter.violator_role_id", role?.id || "");
				await serverDocument.save();

				return interaction.reply({
					content: role ?
						`✅ Violator role set to ${role}!` :
						"✅ Violator role has been cleared!",
					ephemeral: true,
				});
			}

			default:
				return interaction.reply({ content: "Unknown subcommand", ephemeral: true });
		}
	},
};
