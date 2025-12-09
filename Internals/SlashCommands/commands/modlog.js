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

				return interaction.reply({
					embeds: [{
						color: 0x3669FA,
						title: "📋 Modlog Configuration",
						fields: [
							{ name: "Status", value: isEnabled ? "✅ Enabled" : "❌ Disabled", inline: true },
							{ name: "Channel", value: channelMention, inline: true },
						],
					}],
					ephemeral: true,
				});
			}

			default:
				return interaction.reply({ content: "Unknown subcommand", ephemeral: true });
		}
	},
};
