const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const numberEmojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("poll")
		.setDescription("Poll management commands")
		.addSubcommand(sub =>
			sub.setName("create")
				.setDescription("Create a new poll")
				.addStringOption(opt =>
					opt.setName("question")
						.setDescription("The poll question")
						.setRequired(true),
				)
				.addStringOption(opt =>
					opt.setName("options")
						.setDescription("Poll options separated by | (leave empty for yes/no)"),
				)
				.addIntegerOption(opt =>
					opt.setName("duration")
						.setDescription("Poll duration in minutes (0 for no limit)")
						.setMinValue(0)
						.setMaxValue(10080),
				)
				.addBooleanOption(opt =>
					opt.setName("anonymous")
						.setDescription("Hide who voted (results only)"),
				),
		)
		.addSubcommand(sub =>
			sub.setName("end")
				.setDescription("End an active poll and show results")
				.addStringOption(opt =>
					opt.setName("message_id")
						.setDescription("Message ID of the poll to end")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("results")
				.setDescription("View current poll results")
				.addStringOption(opt =>
					opt.setName("message_id")
						.setDescription("Message ID of the poll")
						.setRequired(true),
				),
		),

	async execute (interaction, _client, serverDocument) {
		const subcommand = interaction.options.getSubcommand();

		switch (subcommand) {
			case "create":
				await this.createPoll(interaction, serverDocument);
				break;
			case "end":
				await this.endPoll(interaction);
				break;
			case "results":
				await this.showResults(interaction);
				break;
		}
	},

	async createPoll (interaction, serverDocument) {
		const question = interaction.options.getString("question");
		const optionsStr = interaction.options.getString("options");
		const duration = interaction.options.getInteger("duration") || 0;
		const anonymous = interaction.options.getBoolean("anonymous") || false;

		let options = [];
		let reactions = [];

		if (optionsStr) {
			options = optionsStr.split("|").map(o => o.trim()).filter(o => o.length > 0);
			if (options.length < 2 || options.length > 10) {
				return interaction.reply({
					content: "Please provide 2-10 options!",
					ephemeral: true,
				});
			}
			reactions = numberEmojis.slice(0, options.length);
		} else {
			options = ["Yes", "No"];
			reactions = ["👍", "👎"];
		}

		const optionsList = options.map((opt, i) => `${reactions[i]} ${opt}`).join("\n");
		const endsAt = duration > 0 ? new Date(Date.now() + duration * 60000) : null;

		const embedFields = [];
		if (anonymous) {
			embedFields.push({ name: "Mode", value: "🔒 Anonymous", inline: true });
		}
		if (endsAt) {
			embedFields.push({ name: "Ends", value: `<t:${Math.floor(endsAt.getTime() / 1000)}:R>`, inline: true });
		}

		const pollMsg = await interaction.reply({
			embeds: [{
				color: 0x3669FA,
				title: `📊 ${question}`,
				description: optionsList,
				fields: embedFields.length > 0 ? embedFields : undefined,
				footer: { text: `Poll by ${interaction.user.tag} • React to vote!` },
				timestamp: new Date().toISOString(),
			}],
			fetchReply: true,
		});

		for (const emoji of reactions) {
			await pollMsg.react(emoji);
		}

		// Store poll data in channel document
		let channelDoc = serverDocument.channels[interaction.channel.id];
		if (!channelDoc) {
			serverDocument.query.push("channels", { _id: interaction.channel.id });
			channelDoc = serverDocument.channels[interaction.channel.id];
		}

		serverDocument.query.id("channels", interaction.channel.id).set("poll", {
			isOngoing: true,
			title: question,
			options,
			reactions,
			creator_id: interaction.user.id,
			message_id: pollMsg.id,
			anonymous,
			ends_at: endsAt,
			responses: [],
		});
		await serverDocument.save();

		// Set timeout to end poll if duration specified
		if (duration > 0) {
			setTimeout(async () => {
				try {
					await this.autoEndPoll(interaction.guild.id, interaction.channel.id, pollMsg.id);
				} catch (err) {
					logger.debug("Failed to auto-end poll", { msgId: pollMsg.id }, err);
				}
			}, duration * 60000);
		}
	},

	async endPoll (interaction) {
		if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageMessages)) {
			return interaction.reply({
				content: "❌ You need `Manage Messages` permission to end polls.",
				ephemeral: true,
			});
		}

		const messageId = interaction.options.getString("message_id");

		await interaction.deferReply({ ephemeral: true });

		let message;
		try {
			message = await interaction.channel.messages.fetch(messageId);
		} catch {
			return interaction.editReply({ content: "❌ Could not find that message." });
		}

		const results = await this.calculateResults(message);
		if (!results) {
			return interaction.editReply({ content: "❌ This doesn't appear to be a poll message." });
		}

		await message.edit({
			embeds: [{
				color: 0x57F287,
				title: `📊 Poll Ended: ${results.question}`,
				description: results.resultsList,
				footer: { text: `Total votes: ${results.totalVotes}` },
			}],
		});

		await message.reactions.removeAll().catch(() => null);

		await interaction.editReply({ content: "✅ Poll ended and results displayed!" });
	},

	async showResults (interaction) {
		const messageId = interaction.options.getString("message_id");

		await interaction.deferReply({ ephemeral: true });

		let message;
		try {
			message = await interaction.channel.messages.fetch(messageId);
		} catch {
			return interaction.editReply({ content: "❌ Could not find that message." });
		}

		const results = await this.calculateResults(message);
		if (!results) {
			return interaction.editReply({ content: "❌ This doesn't appear to be a poll message." });
		}

		await interaction.editReply({
			embeds: [{
				color: 0x5865F2,
				title: `📊 Current Results: ${results.question}`,
				description: results.resultsList,
				footer: { text: `Total votes: ${results.totalVotes} • Poll still active` },
			}],
		});
	},

	async calculateResults (message) {
		if (!message.embeds[0] || !message.embeds[0].title?.startsWith("📊")) {
			return null;
		}

		const question = message.embeds[0].title.replace("📊 ", "");
		const description = message.embeds[0].description;
		const lines = description.split("\n");

		const results = [];
		let totalVotes = 0;

		for (const line of lines) {
			const emojiMatch = line.match(/^([\p{Emoji}\u200d]+)/u);
			if (emojiMatch) {
				const emoji = emojiMatch[1];
				const optionText = line.replace(emoji, "").trim();
				const reaction = message.reactions.cache.find(r =>
					r.emoji.name === emoji || r.emoji.toString() === emoji,
				);
				const count = reaction ? reaction.count - 1 : 0; // Subtract bot's reaction
				results.push({ emoji, option: optionText, votes: count });
				totalVotes += count;
			}
		}

		const resultsList = results.map(r => {
			const percentage = totalVotes > 0 ? Math.round((r.votes / totalVotes) * 100) : 0;
			const bar = this.createBar(percentage);
			return `${r.emoji} ${r.option}\n${bar} ${r.votes} votes (${percentage}%)`;
		}).join("\n\n");

		return { question, resultsList, totalVotes };
	},

	createBar (percentage) {
		const filled = Math.round(percentage / 10);
		const empty = 10 - filled;
		return "▓".repeat(filled) + "░".repeat(empty);
	},

	async autoEndPoll (guildId, channelId, messageId) {
		const serverDocument = await Servers.findOne(guildId);
		if (!serverDocument) return;

		const channelDoc = serverDocument.channels[channelId];
		if (!channelDoc || !channelDoc.poll?.isOngoing) return;
		if (channelDoc.poll.message_id !== messageId) return;

		const guild = global.client?.guilds.cache.get(guildId);
		if (!guild) return;

		const channel = guild.channels.cache.get(channelId);
		if (!channel) return;

		const message = await channel.messages.fetch(messageId).catch(() => null);
		if (!message) return;

		const results = await this.calculateResults(message);
		if (!results) return;

		await message.edit({
			embeds: [{
				color: 0x57F287,
				title: `📊 Poll Ended: ${results.question}`,
				description: results.resultsList,
				footer: { text: `Total votes: ${results.totalVotes} • Duration expired` },
			}],
		});

		await message.reactions.removeAll().catch(() => null);

		serverDocument.query.id("channels", channelId).set("poll.isOngoing", false);
		await serverDocument.save();
	},
};
