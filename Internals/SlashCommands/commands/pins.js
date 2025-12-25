const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	ChannelType,
} = require("discord.js");

module.exports = {
	adminLevel: 2,
	data: new SlashCommandBuilder()
		.setName("pins")
		.setDescription("Pin management commands")
		.addSubcommand(sub =>
			sub.setName("queue")
				.setDescription("View and manage pin nomination queue")
				.addStringOption(opt =>
					opt.setName("action")
						.setDescription("Queue action")
						.setRequired(true)
						.addChoices(
							{ name: "View Queue", value: "view" },
							{ name: "Approve Next", value: "approve" },
							{ name: "Reject Next", value: "reject" },
							{ name: "Clear Queue", value: "clear" },
						),
				),
		)
		.addSubcommand(sub =>
			sub.setName("nominate")
				.setDescription("Nominate a message for pinning")
				.addStringOption(opt =>
					opt.setName("message_id")
						.setDescription("Message ID to nominate")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("auto")
				.setDescription("Configure auto-pinning rules")
				.addStringOption(opt =>
					opt.setName("mode")
						.setDescription("Auto-pin mode")
						.setRequired(true)
						.addChoices(
							{ name: "Disabled", value: "disabled" },
							{ name: "Reactions (📌)", value: "reactions" },
							{ name: "Staff Only", value: "staff" },
							{ name: "Nominations", value: "nominations" },
						),
				)
				.addIntegerOption(opt =>
					opt.setName("threshold")
						.setDescription("Reaction threshold for auto-pin (3-20)")
						.setMinValue(3)
						.setMaxValue(20),
				),
		)
		.addSubcommand(sub =>
			sub.setName("rotate")
				.setDescription("Configure pin rotation (unpin old messages)")
				.addBooleanOption(opt =>
					opt.setName("enabled")
						.setDescription("Enable/disable pin rotation")
						.setRequired(true),
				)
				.addIntegerOption(opt =>
					opt.setName("max_pins")
						.setDescription("Maximum pins before rotation (10-50)")
						.setMinValue(10)
						.setMaxValue(50),
				)
				.addIntegerOption(opt =>
					opt.setName("max_age_days")
						.setDescription("Unpin messages older than X days (7-365)")
						.setMinValue(7)
						.setMaxValue(365),
				),
		)
		.addSubcommand(sub =>
			sub.setName("cleanup")
				.setDescription("Clean up old pins based on rotation rules"),
		)
		.addSubcommand(sub =>
			sub.setName("status")
				.setDescription("View pin management configuration"),
		)
		.addSubcommand(sub =>
			sub.setName("archive")
				.setDescription("Archive all pins to a channel")
				.addChannelOption(opt =>
					opt.setName("channel")
						.setDescription("Channel to archive pins to")
						.addChannelTypes(ChannelType.GuildText)
						.setRequired(true),
				),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

	async execute (interaction, _client, serverDocument) {
		const subcommand = interaction.options.getSubcommand();

		try {
			switch (subcommand) {
				case "queue":
					await this.handleQueue(interaction, serverDocument);
					break;
				case "nominate":
					await this.nominate(interaction, serverDocument);
					break;
				case "auto":
					await this.configureAuto(interaction, serverDocument);
					break;
				case "rotate":
					await this.configureRotate(interaction, serverDocument);
					break;
				case "cleanup":
					await this.cleanupPins(interaction, serverDocument);
					break;
				case "status":
					await this.showStatus(interaction, serverDocument);
					break;
				case "archive":
					await this.archivePins(interaction);
					break;
			}
		} catch (error) {
			logger.error("Pins command error", { subcommand, guildId: interaction.guild.id }, error);
			const errorReply = { content: `❌ Error: ${error.message}`, ephemeral: true };
			if (interaction.deferred || interaction.replied) {
				await interaction.editReply(errorReply);
			} else {
				await interaction.reply(errorReply);
			}
		}
	},

	getDefaultConfig () {
		return {
			auto_mode: "disabled",
			auto_threshold: 5,
			rotate_enabled: false,
			rotate_max_pins: 50,
			rotate_max_age_days: 90,
			queue: [],
		};
	},

	async handleQueue (interaction, serverDocument) {
		const action = interaction.options.getString("action");
		const config = serverDocument.config.pins || this.getDefaultConfig();
		const queue = config.queue || [];

		switch (action) {
			case "view": {
				if (queue.length === 0) {
					return interaction.reply({
						embeds: [{
							color: 0xFEE75C,
							title: "📌 Pin Queue",
							description: "The pin nomination queue is empty.",
						}],
						ephemeral: true,
					});
				}

				const queueList = queue.slice(0, 10).map((item, i) =>
					`**${i + 1}.** [Message](https://discord.com/channels/${interaction.guild.id}/${item.channel_id}/${item.message_id})\n` +
					`   Nominated by <@${item.nominated_by}> <t:${Math.floor(new Date(item.nominated_at).getTime() / 1000)}:R>`,
				).join("\n\n");

				await interaction.reply({
					embeds: [{
						color: 0x5865F2,
						title: "📌 Pin Queue",
						description: queueList,
						footer: { text: `${queue.length} message(s) in queue` },
					}],
					ephemeral: true,
				});
				break;
			}

			case "approve": {
				if (queue.length === 0) {
					return interaction.reply({
						content: "❌ Queue is empty.",
						ephemeral: true,
					});
				}

				await interaction.deferReply({ ephemeral: true });

				const item = queue[0];
				const channel = interaction.guild.channels.cache.get(item.channel_id);
				if (!channel) {
					serverDocument.query.pull("config.pins.queue", item);
					await serverDocument.save();
					return interaction.editReply({ content: "❌ Channel not found. Item removed from queue." });
				}

				const message = await channel.messages.fetch(item.message_id).catch(() => null);
				if (!message) {
					serverDocument.query.pull("config.pins.queue", item);
					await serverDocument.save();
					return interaction.editReply({ content: "❌ Message not found. Item removed from queue." });
				}

				await message.pin(`Approved by ${interaction.user.tag}`);
				serverDocument.query.pull("config.pins.queue", item);
				await serverDocument.save();

				await interaction.editReply({
					embeds: [{
						color: 0x57F287,
						title: "✅ Pin Approved",
						description: `[Message](${message.url}) has been pinned.`,
					}],
				});
				break;
			}

			case "reject": {
				if (queue.length === 0) {
					return interaction.reply({
						content: "❌ Queue is empty.",
						ephemeral: true,
					});
				}

				const item = queue[0];
				serverDocument.query.pull("config.pins.queue", item);
				await serverDocument.save();

				await interaction.reply({
					embeds: [{
						color: 0xED4245,
						title: "❌ Pin Rejected",
						description: "The nomination has been rejected and removed from the queue.",
					}],
					ephemeral: true,
				});
				break;
			}

			case "clear": {
				serverDocument.query.set("config.pins.queue", []);
				await serverDocument.save();

				await interaction.reply({
					embeds: [{
						color: 0x57F287,
						title: "🗑️ Queue Cleared",
						description: "All pin nominations have been cleared.",
					}],
					ephemeral: true,
				});
				break;
			}
		}
	},

	async nominate (interaction, serverDocument) {
		const messageId = interaction.options.getString("message_id");

		const message = await interaction.channel.messages.fetch(messageId).catch(() => null);
		if (!message) {
			return interaction.reply({
				content: "❌ Message not found in this channel.",
				ephemeral: true,
			});
		}

		if (message.pinned) {
			return interaction.reply({
				content: "❌ This message is already pinned.",
				ephemeral: true,
			});
		}

		if (!serverDocument.config.pins) {
			serverDocument.query.set("config.pins", this.getDefaultConfig());
		}

		const queue = serverDocument.config.pins?.queue || [];
		if (queue.some(item => item.message_id === messageId)) {
			return interaction.reply({
				content: "❌ This message is already in the nomination queue.",
				ephemeral: true,
			});
		}

		serverDocument.query.push("config.pins.queue", {
			message_id: messageId,
			channel_id: interaction.channel.id,
			nominated_by: interaction.user.id,
			nominated_at: new Date(),
		});
		await serverDocument.save();

		await interaction.reply({
			embeds: [{
				color: 0x57F287,
				title: "📌 Message Nominated",
				description: "Your pin nomination has been added to the queue.\n\nModerators will review it soon.",
			}],
			ephemeral: true,
		});
	},

	async configureAuto (interaction, serverDocument) {
		const mode = interaction.options.getString("mode");
		const threshold = interaction.options.getInteger("threshold");

		if (!serverDocument.config.pins) {
			serverDocument.query.set("config.pins", this.getDefaultConfig());
		}

		serverDocument.query.set("config.pins.auto_mode", mode);
		if (threshold !== null) {
			serverDocument.query.set("config.pins.auto_threshold", threshold);
		}

		await serverDocument.save();

		const modeText = {
			disabled: "Auto-pinning is disabled",
			reactions: `Messages with ${threshold || serverDocument.config.pins?.auto_threshold || 5}+ 📌 reactions will be auto-pinned`,
			staff: "Only staff can pin messages",
			nominations: "Messages must be nominated and approved",
		}[mode];

		await interaction.reply({
			embeds: [{
				color: 0x57F287,
				title: "⚙️ Auto-Pin Configured",
				description: modeText,
			}],
			ephemeral: true,
		});
	},

	async configureRotate (interaction, serverDocument) {
		const enabled = interaction.options.getBoolean("enabled");
		const maxPins = interaction.options.getInteger("max_pins");
		const maxAgeDays = interaction.options.getInteger("max_age_days");

		if (!serverDocument.config.pins) {
			serverDocument.query.set("config.pins", this.getDefaultConfig());
		}

		serverDocument.query.set("config.pins.rotate_enabled", enabled);
		if (maxPins !== null) {
			serverDocument.query.set("config.pins.rotate_max_pins", maxPins);
		}
		if (maxAgeDays !== null) {
			serverDocument.query.set("config.pins.rotate_max_age_days", maxAgeDays);
		}

		await serverDocument.save();

		if (!enabled) {
			return interaction.reply({
				embeds: [{
					color: 0xED4245,
					title: "🔄 Pin Rotation Disabled",
					description: "Old pins will no longer be automatically removed.",
				}],
				ephemeral: true,
			});
		}

		const config = serverDocument.config.pins;
		await interaction.reply({
			embeds: [{
				color: 0x57F287,
				title: "🔄 Pin Rotation Enabled",
				description: "Old pins will be automatically removed based on your settings.",
				fields: [
					{ name: "Max Pins per Channel", value: String(config.rotate_max_pins || 50), inline: true },
					{ name: "Max Age", value: `${config.rotate_max_age_days || 90} days`, inline: true },
				],
			}],
			ephemeral: true,
		});
	},

	async cleanupPins (interaction, serverDocument) {
		const config = serverDocument.config.pins || this.getDefaultConfig();

		if (!config.rotate_enabled) {
			return interaction.reply({
				content: "❌ Pin rotation is not enabled. Use `/pins rotate` to configure it first.",
				ephemeral: true,
			});
		}

		await interaction.deferReply({ ephemeral: true });

		const maxPins = config.rotate_max_pins || 50;
		const maxAgeDays = config.rotate_max_age_days || 90;
		const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
		const now = Date.now();

		let totalUnpinned = 0;

		for (const [, channel] of interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText)) {
			try {
				const pins = await channel.messages.fetchPinned();
				const pinsArray = [...pins.values()].sort((a, b) => b.createdTimestamp - a.createdTimestamp);

				for (let i = 0; i < pinsArray.length; i++) {
					const pin = pinsArray[i];
					const age = now - pin.createdTimestamp;

					if (i >= maxPins || age > maxAgeMs) {
						await pin.unpin(`Pin rotation cleanup by ${interaction.user.tag}`);
						totalUnpinned++;
					}
				}
			} catch {
				// Skip channels we can't access
			}
		}

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				title: "🧹 Pin Cleanup Complete",
				description: `Unpinned **${totalUnpinned}** message(s) based on rotation rules.`,
			}],
		});
	},

	async showStatus (interaction, serverDocument) {
		const config = serverDocument.config.pins || this.getDefaultConfig();

		const modeText = {
			disabled: "Disabled",
			reactions: `Reactions (${config.auto_threshold || 5}+ 📌)`,
			staff: "Staff Only",
			nominations: "Nominations Queue",
		}[config.auto_mode] || "Disabled";

		await interaction.reply({
			embeds: [{
				color: 0x5865F2,
				title: "📌 Pin Management Status",
				fields: [
					{ name: "Auto-Pin Mode", value: modeText, inline: true },
					{ name: "Queue Size", value: String((config.queue || []).length), inline: true },
					{ name: "Rotation", value: config.rotate_enabled ? "✅ Enabled" : "❌ Disabled", inline: true },
					{
						name: "Rotation Settings",
						value: config.rotate_enabled ?
							`Max: ${config.rotate_max_pins || 50} pins | Age: ${config.rotate_max_age_days || 90} days` :
							"N/A",
					},
				],
			}],
			ephemeral: true,
		});
	},

	async archivePins (interaction) {
		const targetChannel = interaction.options.getChannel("channel");

		await interaction.deferReply({ ephemeral: true });

		const pins = await interaction.channel.messages.fetchPinned();

		if (pins.size === 0) {
			return interaction.editReply({ content: "❌ No pins found in this channel." });
		}

		const pinsArray = [...pins.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);

		for (const pin of pinsArray) {
			const embed = {
				color: 0x5865F2,
				author: {
					name: pin.author.tag,
					icon_url: pin.author.displayAvatarURL(),
				},
				description: pin.content || "*No text content*",
				fields: [
					{ name: "Original Channel", value: `<#${interaction.channel.id}>`, inline: true },
					{ name: "Posted", value: `<t:${Math.floor(pin.createdTimestamp / 1000)}:f>`, inline: true },
				],
				footer: { text: `Message ID: ${pin.id}` },
			};

			if (pin.attachments.size > 0) {
				const firstAttachment = pin.attachments.first();
				if (firstAttachment.contentType?.startsWith("image/")) {
					embed.image = { url: firstAttachment.url };
				}
			}

			await targetChannel.send({ embeds: [embed] });
		}

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				title: "📦 Pins Archived",
				description: `Archived **${pinsArray.length}** pin(s) to ${targetChannel}.`,
			}],
		});
	},
};
