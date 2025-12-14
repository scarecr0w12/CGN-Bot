const {
	SlashCommandBuilder,
	PermissionFlagsBits,
} = require("discord.js");

module.exports = {
	adminLevel: 2,
	data: new SlashCommandBuilder()
		.setName("emoji")
		.setDescription("Emoji management commands")
		.addSubcommand(sub =>
			sub.setName("steal")
				.setDescription("Copy an emoji from another server")
				.addStringOption(opt =>
					opt.setName("emoji")
						.setDescription("The emoji to steal (paste it here)")
						.setRequired(true),
				)
				.addStringOption(opt =>
					opt.setName("name")
						.setDescription("New name for the emoji (optional)")
						.setMaxLength(32),
				),
		)
		.addSubcommand(sub =>
			sub.setName("add")
				.setDescription("Add an emoji from a URL")
				.addStringOption(opt =>
					opt.setName("url")
						.setDescription("Image URL for the emoji")
						.setRequired(true),
				)
				.addStringOption(opt =>
					opt.setName("name")
						.setDescription("Name for the emoji")
						.setRequired(true)
						.setMinLength(2)
						.setMaxLength(32),
				),
		)
		.addSubcommand(sub =>
			sub.setName("rename")
				.setDescription("Rename an existing emoji")
				.addStringOption(opt =>
					opt.setName("emoji")
						.setDescription("The emoji to rename")
						.setRequired(true),
				)
				.addStringOption(opt =>
					opt.setName("name")
						.setDescription("New name for the emoji")
						.setRequired(true)
						.setMinLength(2)
						.setMaxLength(32),
				),
		)
		.addSubcommand(sub =>
			sub.setName("delete")
				.setDescription("Delete an emoji")
				.addStringOption(opt =>
					opt.setName("emoji")
						.setDescription("The emoji to delete")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("list")
				.setDescription("List all server emojis"),
		)
		.addSubcommand(sub =>
			sub.setName("stats")
				.setDescription("View emoji usage statistics"),
		)
		.addSubcommand(sub =>
			sub.setName("info")
				.setDescription("Get info about an emoji")
				.addStringOption(opt =>
					opt.setName("emoji")
						.setDescription("The emoji to get info about")
						.setRequired(true),
				),
		)
		.addSubcommandGroup(group =>
			group.setName("pack")
				.setDescription("Emoji pack management")
				.addSubcommand(sub =>
					sub.setName("export")
						.setDescription("Export server emojis as a pack")
						.addStringOption(opt =>
							opt.setName("name")
								.setDescription("Name for the pack")
								.setRequired(true)
								.setMaxLength(50),
						)
						.addStringOption(opt =>
							opt.setName("filter")
								.setDescription("Filter emojis (static, animated, or all)")
								.addChoices(
									{ name: "All", value: "all" },
									{ name: "Static Only", value: "static" },
									{ name: "Animated Only", value: "animated" },
								),
						),
				)
				.addSubcommand(sub =>
					sub.setName("import")
						.setDescription("Import emojis from a pack file (attach JSON)")
						.addAttachmentOption(opt =>
							opt.setName("file")
								.setDescription("The emoji pack JSON file")
								.setRequired(true),
						),
				)
				.addSubcommand(sub =>
					sub.setName("preview")
						.setDescription("Preview a pack file without importing")
						.addAttachmentOption(opt =>
							opt.setName("file")
								.setDescription("The emoji pack JSON file")
								.setRequired(true),
						),
				),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions),

	async execute (interaction, client, serverDocument) {
		const subcommand = interaction.options.getSubcommand();
		const subcommandGroup = interaction.options.getSubcommandGroup();

		try {
			if (subcommandGroup === "pack") {
				switch (subcommand) {
					case "export":
						await this.exportPack(interaction);
						break;
					case "import":
						await this.importPack(interaction);
						break;
					case "preview":
						await this.previewPack(interaction);
						break;
				}
				return;
			}

			switch (subcommand) {
				case "steal":
					await this.stealEmoji(interaction, client);
					break;
				case "add":
					await this.addEmoji(interaction, client);
					break;
				case "rename":
					await this.renameEmoji(interaction, client);
					break;
				case "delete":
					await this.deleteEmoji(interaction, client);
					break;
				case "list":
					await this.listEmojis(interaction);
					break;
				case "stats":
					await this.showStats(interaction, serverDocument);
					break;
				case "info":
					await this.emojiInfo(interaction);
					break;
			}
		} catch (error) {
			logger.error("Emoji command error", { subcommand, guildId: interaction.guild.id }, error);
			const errorReply = { content: `❌ Error: ${error.message}`, ephemeral: true };
			if (interaction.deferred || interaction.replied) {
				await interaction.editReply(errorReply);
			} else {
				await interaction.reply(errorReply);
			}
		}
	},

	parseEmoji (emojiStr) {
		const customMatch = emojiStr.match(/<(a)?:(\w+):(\d+)>/);
		if (customMatch) {
			return {
				animated: !!customMatch[1],
				name: customMatch[2],
				id: customMatch[3],
				url: `https://cdn.discordapp.com/emojis/${customMatch[3]}.${customMatch[1] ? "gif" : "png"}`,
			};
		}
		return null;
	},

	async stealEmoji (interaction, _client) {
		await interaction.deferReply({ ephemeral: true });

		const emojiStr = interaction.options.getString("emoji");
		const newName = interaction.options.getString("name");

		const parsed = this.parseEmoji(emojiStr);
		if (!parsed) {
			throw new Error("Invalid emoji. Please paste a custom emoji (not a default Unicode emoji).");
		}

		const name = newName || parsed.name;

		if (!/^[a-zA-Z0-9_]+$/.test(name)) {
			throw new Error("Emoji name can only contain letters, numbers, and underscores.");
		}

		const emoji = await interaction.guild.emojis.create({
			attachment: parsed.url,
			name,
			reason: `Emoji stolen by ${interaction.user.tag}`,
		});

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				title: "✅ Emoji Added",
				description: `Successfully added ${emoji} as \`:${emoji.name}:\``,
				thumbnail: { url: emoji.url },
			}],
		});
	},

	async addEmoji (interaction, _client) {
		await interaction.deferReply({ ephemeral: true });

		const url = interaction.options.getString("url");
		const name = interaction.options.getString("name");

		if (!/^[a-zA-Z0-9_]+$/.test(name)) {
			throw new Error("Emoji name can only contain letters, numbers, and underscores.");
		}

		if (!url.match(/^https?:\/\/.+\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i)) {
			throw new Error("Invalid image URL. Must be a direct link to a PNG, JPG, GIF, or WebP image.");
		}

		const emoji = await interaction.guild.emojis.create({
			attachment: url,
			name,
			reason: `Emoji added by ${interaction.user.tag}`,
		});

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				title: "✅ Emoji Added",
				description: `Successfully added ${emoji} as \`:${emoji.name}:\``,
				thumbnail: { url: emoji.url },
			}],
		});
	},

	async renameEmoji (interaction, _client) {
		await interaction.deferReply({ ephemeral: true });

		const emojiStr = interaction.options.getString("emoji");
		const newName = interaction.options.getString("name");

		const parsed = this.parseEmoji(emojiStr);
		if (!parsed) {
			throw new Error("Invalid emoji. Please provide a custom emoji from this server.");
		}

		if (!/^[a-zA-Z0-9_]+$/.test(newName)) {
			throw new Error("Emoji name can only contain letters, numbers, and underscores.");
		}

		const emoji = interaction.guild.emojis.cache.get(parsed.id);
		if (!emoji) {
			throw new Error("This emoji is not from this server.");
		}

		const oldName = emoji.name;
		await emoji.setName(newName, `Renamed by ${interaction.user.tag}`);

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				title: "✅ Emoji Renamed",
				description: `Renamed \`:${oldName}:\` to \`:${newName}:\` ${emoji}`,
			}],
		});
	},

	async deleteEmoji (interaction, _client) {
		await interaction.deferReply({ ephemeral: true });

		const emojiStr = interaction.options.getString("emoji");

		const parsed = this.parseEmoji(emojiStr);
		if (!parsed) {
			throw new Error("Invalid emoji. Please provide a custom emoji from this server.");
		}

		const emoji = interaction.guild.emojis.cache.get(parsed.id);
		if (!emoji) {
			throw new Error("This emoji is not from this server.");
		}

		const emojiName = emoji.name;
		await emoji.delete(`Deleted by ${interaction.user.tag}`);

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				title: "🗑️ Emoji Deleted",
				description: `Successfully deleted \`:${emojiName}:\``,
			}],
		});
	},

	async listEmojis (interaction) {
		await interaction.deferReply({ ephemeral: true });

		const emojis = interaction.guild.emojis.cache;
		const staticEmojis = emojis.filter(e => !e.animated);
		const animatedEmojis = emojis.filter(e => e.animated);

		const staticList = staticEmojis.map(e => `${e}`).join(" ") || "None";
		const animatedList = animatedEmojis.map(e => `${e}`).join(" ") || "None";

		const maxStatic = interaction.guild.premiumTier === 0 ? 50 :
			interaction.guild.premiumTier === 1 ? 100 :
				interaction.guild.premiumTier === 2 ? 150 : 250;
		const maxAnimated = maxStatic;

		await interaction.editReply({
			embeds: [{
				color: 0x5865F2,
				title: "😀 Server Emojis",
				fields: [
					{
						name: `Static (${staticEmojis.size}/${maxStatic})`,
						value: staticList.slice(0, 1024),
					},
					{
						name: `Animated (${animatedEmojis.size}/${maxAnimated})`,
						value: animatedList.slice(0, 1024),
					},
				],
				footer: { text: `Total: ${emojis.size} emojis` },
			}],
		});
	},

	async showStats (interaction, serverDocument) {
		await interaction.deferReply({ ephemeral: true });

		const emojiStats = serverDocument.emoji_stats || {};
		const emojis = interaction.guild.emojis.cache;

		const sortedStats = Object.entries(emojiStats)
			.filter(([id]) => emojis.has(id))
			.sort((a, b) => b[1] - a[1])
			.slice(0, 15);

		if (sortedStats.length === 0) {
			return interaction.editReply({
				embeds: [{
					color: 0xFEE75C,
					title: "📊 Emoji Statistics",
					description: "No emoji usage data recorded yet.",
					footer: { text: "Stats are collected as emojis are used in messages" },
				}],
			});
		}

		const statsList = sortedStats.map(([id, count], index) => {
			const emoji = emojis.get(id);
			const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;
			return `${medal} ${emoji || "Unknown"} - **${count}** uses`;
		}).join("\n");

		const unusedEmojis = emojis.filter(e => !emojiStats[e.id] || emojiStats[e.id] === 0);

		await interaction.editReply({
			embeds: [{
				color: 0x5865F2,
				title: "📊 Emoji Statistics",
				description: statsList,
				fields: unusedEmojis.size > 0 ? [{
					name: `Unused Emojis (${unusedEmojis.size})`,
					value: unusedEmojis.map(e => `${e}`).join(" ").slice(0, 1024) || "None",
				}] : [],
				footer: { text: "Top 15 most used emojis" },
			}],
		});
	},

	async emojiInfo (interaction) {
		await interaction.deferReply({ ephemeral: true });

		const emojiStr = interaction.options.getString("emoji");

		const parsed = this.parseEmoji(emojiStr);
		if (!parsed) {
			throw new Error("Invalid emoji. Please provide a custom emoji.");
		}

		const emoji = interaction.guild.emojis.cache.get(parsed.id);
		const isFromServer = !!emoji;

		const fields = [
			{ name: "Name", value: parsed.name, inline: true },
			{ name: "ID", value: parsed.id, inline: true },
			{ name: "Animated", value: parsed.animated ? "Yes" : "No", inline: true },
			{ name: "From This Server", value: isFromServer ? "Yes" : "No", inline: true },
		];

		if (emoji) {
			fields.push(
				{ name: "Created", value: `<t:${Math.floor(emoji.createdTimestamp / 1000)}:R>`, inline: true },
				{ name: "Managed", value: emoji.managed ? "Yes (Integration)" : "No", inline: true },
			);
		}

		await interaction.editReply({
			embeds: [{
				color: 0x5865F2,
				title: "ℹ️ Emoji Info",
				thumbnail: { url: parsed.url },
				fields,
				footer: { text: `Direct URL: ${parsed.url}` },
			}],
		});
	},

	async exportPack (interaction) {
		await interaction.deferReply({ ephemeral: true });

		const packName = interaction.options.getString("name");
		const filter = interaction.options.getString("filter") || "all";

		let emojis = interaction.guild.emojis.cache;

		if (filter === "static") {
			emojis = emojis.filter(e => !e.animated);
		} else if (filter === "animated") {
			emojis = emojis.filter(e => e.animated);
		}

		if (emojis.size === 0) {
			throw new Error("No emojis found matching the filter.");
		}

		const pack = {
			pack_version: "1.0",
			name: packName,
			description: `Emoji pack from ${interaction.guild.name}`,
			exported_at: new Date().toISOString(),
			source_guild: {
				id: interaction.guild.id,
				name: interaction.guild.name,
			},
			emoji_count: emojis.size,
			emojis: emojis.map(e => ({
				name: e.name,
				id: e.id,
				animated: e.animated,
				url: e.url,
			})),
		};

		const { AttachmentBuilder } = require("discord.js");
		const fileContent = JSON.stringify(pack, null, 2);
		const fileName = `${packName.replace(/[^a-zA-Z0-9]/g, "_")}_emoji_pack.json`;
		const attachment = new AttachmentBuilder(Buffer.from(fileContent), { name: fileName });

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				title: "📦 Emoji Pack Exported",
				description: `Exported **${emojis.size}** emojis as "${packName}".`,
				fields: [
					{ name: "Static", value: String(emojis.filter(e => !e.animated).size), inline: true },
					{ name: "Animated", value: String(emojis.filter(e => e.animated).size), inline: true },
				],
				footer: { text: "Use /emoji pack import to import this pack to another server" },
			}],
			files: [attachment],
		});
	},

	async importPack (interaction) {
		await interaction.deferReply({ ephemeral: true });

		const attachment = interaction.options.getAttachment("file");

		if (!attachment.name.endsWith(".json")) {
			throw new Error("Please provide a JSON file.");
		}

		if (attachment.size > 1024 * 1024) {
			throw new Error("File too large. Maximum size is 1MB.");
		}

		const response = await fetch(attachment.url);
		const pack = await response.json();

		if (!pack.pack_version || !pack.emojis || !Array.isArray(pack.emojis)) {
			throw new Error("Invalid emoji pack format.");
		}

		const existingEmojis = interaction.guild.emojis.cache;
		const maxEmojis = interaction.guild.premiumTier === 0 ? 50 :
			interaction.guild.premiumTier === 1 ? 100 :
				interaction.guild.premiumTier === 2 ? 150 : 250;

		let imported = 0;
		let skipped = 0;
		let failed = 0;
		const errors = [];

		for (const emoji of pack.emojis) {
			if (!emoji.name || !emoji.url) {
				skipped++;
				continue;
			}

			if (existingEmojis.some(e => e.name === emoji.name)) {
				skipped++;
				continue;
			}

			const currentCount = emoji.animated ?
				existingEmojis.filter(e => e.animated).size + imported :
				existingEmojis.filter(e => !e.animated).size + imported;

			if (currentCount >= maxEmojis) {
				skipped++;
				continue;
			}

			try {
				await interaction.guild.emojis.create({
					attachment: emoji.url,
					name: emoji.name,
					reason: `Imported from pack "${pack.name}" by ${interaction.user.tag}`,
				});
				imported++;

				if (imported % 5 === 0) {
					await new Promise(resolve => setTimeout(resolve, 1000));
				}
			} catch (err) {
				failed++;
				if (errors.length < 3) {
					errors.push(`${emoji.name}: ${err.message}`);
				}
			}
		}

		const errorText = errors.length > 0 ? `\n\n**Errors:**\n${errors.join("\n")}` : "";
		await interaction.editReply({
			embeds: [{
				color: imported > 0 ? 0x57F287 : 0xED4245,
				title: "📦 Emoji Pack Import",
				description: `**Pack:** ${pack.name}\n\n` +
					`✅ Imported: **${imported}**\n` +
					`⏭️ Skipped: **${skipped}**\n` +
					`❌ Failed: **${failed}**${errorText}`,
			}],
		});
	},

	async previewPack (interaction) {
		await interaction.deferReply({ ephemeral: true });

		const attachment = interaction.options.getAttachment("file");

		if (!attachment.name.endsWith(".json")) {
			throw new Error("Please provide a JSON file.");
		}

		const response = await fetch(attachment.url);
		const pack = await response.json();

		if (!pack.pack_version || !pack.emojis || !Array.isArray(pack.emojis)) {
			throw new Error("Invalid emoji pack format.");
		}

		const staticCount = pack.emojis.filter(e => !e.animated).length;
		const animatedCount = pack.emojis.filter(e => e.animated).length;

		const existingEmojis = interaction.guild.emojis.cache;
		const duplicates = pack.emojis.filter(e => existingEmojis.some(ex => ex.name === e.name)).length;

		const emojiPreview = pack.emojis.slice(0, 20).map(e => `:${e.name}:`).join(" ");

		await interaction.editReply({
			embeds: [{
				color: 0x5865F2,
				title: `📦 Pack Preview: ${pack.name}`,
				description: pack.description || "No description",
				fields: [
					{ name: "Total Emojis", value: String(pack.emojis.length), inline: true },
					{ name: "Static", value: String(staticCount), inline: true },
					{ name: "Animated", value: String(animatedCount), inline: true },
					{ name: "Already Exists", value: String(duplicates), inline: true },
					{ name: "Source", value: pack.source_guild?.name || "Unknown", inline: true },
					{ name: "Exported", value: pack.exported_at ? `<t:${Math.floor(new Date(pack.exported_at).getTime() / 1000)}:R>` : "Unknown", inline: true },
					{ name: "Emoji Names (Preview)", value: emojiPreview || "None" },
				],
				footer: { text: "Use /emoji pack import to add these emojis" },
			}],
		});
	},
};
