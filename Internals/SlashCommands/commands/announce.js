const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	ChannelType,
} = require("discord.js");

module.exports = {
	adminLevel: 1,
	data: new SlashCommandBuilder()
		.setName("announce")
		.setDescription("Server announcement management")
		.addSubcommand(sub =>
			sub.setName("send")
				.setDescription("Send an announcement")
				.addStringOption(opt =>
					opt.setName("message")
						.setDescription("Announcement message")
						.setRequired(true),
				)
				.addChannelOption(opt =>
					opt.setName("channel")
						.setDescription("Channel to send to (default: current)")
						.addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
				)
				.addStringOption(opt =>
					opt.setName("title")
						.setDescription("Announcement title"),
				)
				.addStringOption(opt =>
					opt.setName("color")
						.setDescription("Embed color (hex code, e.g., #FF0000)"),
				)
				.addBooleanOption(opt =>
					opt.setName("ping")
						.setDescription("Ping @everyone"),
				),
		)
		.addSubcommand(sub =>
			sub.setName("edit")
				.setDescription("Edit an existing announcement")
				.addStringOption(opt =>
					opt.setName("message_id")
						.setDescription("Message ID of the announcement")
						.setRequired(true),
				)
				.addStringOption(opt =>
					opt.setName("content")
						.setDescription("New message content")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("schedule")
				.setDescription("Schedule an announcement")
				.addStringOption(opt =>
					opt.setName("message")
						.setDescription("Announcement message")
						.setRequired(true),
				)
				.addIntegerOption(opt =>
					opt.setName("delay")
						.setDescription("Delay in minutes")
						.setRequired(true)
						.setMinValue(1)
						.setMaxValue(10080),
				)
				.addChannelOption(opt =>
					opt.setName("channel")
						.setDescription("Channel to send to (default: current)")
						.addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
				),
		)
		.addSubcommand(sub =>
			sub.setName("crosspost")
				.setDescription("Crosspost a message to followers")
				.addStringOption(opt =>
					opt.setName("message_id")
						.setDescription("Message ID to crosspost")
						.setRequired(true),
				),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

	async execute (interaction, _client, _serverDocument) {
		const subcommand = interaction.options.getSubcommand();

		try {
			switch (subcommand) {
				case "send":
					await this.sendAnnouncement(interaction);
					break;
				case "edit":
					await this.editAnnouncement(interaction);
					break;
				case "schedule":
					await this.scheduleAnnouncement(interaction);
					break;
				case "crosspost":
					await this.crosspostMessage(interaction);
					break;
			}
		} catch (error) {
			logger.error("Announce command error", { subcommand, guildId: interaction.guild.id }, error);
			const errorReply = { content: `❌ Error: ${error.message}`, ephemeral: true };
			if (interaction.deferred || interaction.replied) {
				await interaction.editReply(errorReply);
			} else {
				await interaction.reply(errorReply);
			}
		}
	},

	async sendAnnouncement (interaction) {
		const message = interaction.options.getString("message");
		const channel = interaction.options.getChannel("channel") || interaction.channel;
		const title = interaction.options.getString("title");
		const colorStr = interaction.options.getString("color");
		const ping = interaction.options.getBoolean("ping") || false;

		let color = 0x5865F2;
		if (colorStr) {
			const hexMatch = colorStr.match(/^#?([0-9A-Fa-f]{6})$/);
			if (hexMatch) {
				color = parseInt(hexMatch[1], 16);
			}
		}

		const embed = {
			color,
			description: message,
			footer: { text: `Announced by ${interaction.user.tag}` },
			timestamp: new Date().toISOString(),
		};

		if (title) {
			embed.title = `📢 ${title}`;
		}

		const content = ping ? "@everyone" : undefined;

		const announcementMsg = await channel.send({
			content,
			embeds: [embed],
		});

		// Auto-crosspost if it's an announcement channel
		if (channel.type === ChannelType.GuildAnnouncement) {
			try {
				await announcementMsg.crosspost();
			} catch {
				// May fail if no followers or rate limited
			}
		}

		await interaction.reply({
			embeds: [{
				color: 0x57F287,
				title: "✅ Announcement Sent",
				description: `Announcement posted in ${channel}`,
				fields: [
					{ name: "Message ID", value: announcementMsg.id, inline: true },
				],
			}],
			ephemeral: true,
		});
	},

	async editAnnouncement (interaction) {
		const messageId = interaction.options.getString("message_id");
		const newContent = interaction.options.getString("content");

		await interaction.deferReply({ ephemeral: true });

		let message;
		try {
			message = await interaction.channel.messages.fetch(messageId);
		} catch {
			return interaction.editReply({ content: "❌ Could not find that message in this channel." });
		}

		if (message.author.id !== interaction.client.user.id) {
			return interaction.editReply({ content: "❌ I can only edit messages I sent." });
		}

		const embed = message.embeds[0];
		if (!embed) {
			return interaction.editReply({ content: "❌ This message doesn't have an embed to edit." });
		}

		const newEmbed = {
			...embed.data,
			description: newContent,
		};

		await message.edit({ embeds: [newEmbed] });

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				title: "✅ Announcement Updated",
				description: "The announcement has been edited.",
			}],
		});
	},

	async scheduleAnnouncement (interaction) {
		const message = interaction.options.getString("message");
		const delay = interaction.options.getInteger("delay");
		const channel = interaction.options.getChannel("channel") || interaction.channel;

		const sendTime = new Date(Date.now() + delay * 60000);

		await interaction.reply({
			embeds: [{
				color: 0x5865F2,
				title: "⏰ Announcement Scheduled",
				description: `Your announcement will be sent to ${channel}`,
				fields: [
					{ name: "Scheduled For", value: `<t:${Math.floor(sendTime.getTime() / 1000)}:R>`, inline: true },
					{ name: "Preview", value: message.slice(0, 100) + (message.length > 100 ? "..." : "") },
				],
			}],
			ephemeral: true,
		});

		// Schedule the announcement
		interaction.client.setTimeout(async () => {
			try {
				await channel.send({
					embeds: [{
						color: 0x5865F2,
						description: message,
						footer: { text: `Scheduled announcement by ${interaction.user.tag}` },
						timestamp: new Date().toISOString(),
					}],
				});
			} catch (err) {
				logger.debug("Failed to send scheduled announcement", { channelId: channel.id }, err);
			}
		}, delay * 60000, `announce-${channel.id}-${Date.now()}`);
	},

	async crosspostMessage (interaction) {
		const messageId = interaction.options.getString("message_id");

		if (interaction.channel.type !== ChannelType.GuildAnnouncement) {
			return interaction.reply({
				content: "❌ Crossposting only works in announcement channels.",
				ephemeral: true,
			});
		}

		await interaction.deferReply({ ephemeral: true });

		let message;
		try {
			message = await interaction.channel.messages.fetch(messageId);
		} catch {
			return interaction.editReply({ content: "❌ Could not find that message." });
		}

		try {
			await message.crosspost();
			await interaction.editReply({
				embeds: [{
					color: 0x57F287,
					title: "✅ Message Crossposted",
					description: "The message has been published to all following servers.",
				}],
			});
		} catch (err) {
			if (err.code === 40033) {
				return interaction.editReply({ content: "❌ This message has already been crossposted." });
			}
			throw err;
		}
	},
};
