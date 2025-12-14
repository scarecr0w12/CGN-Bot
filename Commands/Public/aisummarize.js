/**
 * AI Summarize Command - Summarize text or channel messages
 * Uses AI to create concise summaries of provided content
 */

const { AIManager } = require("../../Modules/AI");
const TierManager = require("../../Modules/TierManager");

module.exports = async (main, documents, msg, commandData) => {
	const { client, configJS } = main;
	const { serverDocument } = documents;

	// Check if server has access to ai_chat feature
	const hasAccess = await TierManager.canAccess(msg.guild.id, "ai_chat");
	if (!hasAccess) {
		return msg.channel.send({
			embeds: [{
				color: 0xFFAA00,
				title: "Premium Feature",
				description: "AI Summarize requires a premium subscription. Upgrade your membership to access this feature.",
				footer: { text: "Visit the membership page on our website to learn more." },
			}],
		});
	}

	// Get or create AI manager instance
	if (!client.aiManager) {
		client.aiManager = new AIManager(client);
		await client.aiManager.initialize();
	}

	const { aiManager } = client;
	const suffix = msg.suffix ? msg.suffix.trim() : "";
	const args = suffix.split(" ");
	const subcommand = args[0] ? args[0].toLowerCase() : "";

	try {
		// Check rate limits
		const rateLimitError = await aiManager.checkAndRecordUsage(
			serverDocument,
			msg.channel,
			msg.author,
		);
		if (rateLimitError) {
			return msg.channel.send(rateLimitError);
		}

		// Determine summary style
		let style = "brief";
		let textToSummarize = suffix;

		if (["brief", "detailed", "bullets"].includes(subcommand)) {
			style = subcommand;
			textToSummarize = args.slice(1).join(" ");
		}

		// Check for channel message summarization
		if (subcommand === "channel" || subcommand === "messages") {
			const messageCount = parseInt(args[1], 10) || 20;
			const limit = Math.min(Math.max(messageCount, 5), 100);

			await msg.channel.sendTyping();

			// Fetch recent messages
			const messages = await msg.channel.messages.fetch({ limit: limit + 1 });
			const filteredMessages = messages
				.filter(m => m.id !== msg.id && !m.author.bot)
				.sort((a, b) => a.createdTimestamp - b.createdTimestamp)
				.map(m => `${m.author.username}: ${m.content}`)
				.slice(0, limit);

			if (filteredMessages.length === 0) {
				return msg.channel.send("No messages found to summarize.");
			}

			textToSummarize = filteredMessages.join("\n");
			style = args[2] || "brief";

			const summary = await aiManager.summarize({
				serverDocument,
				channel: msg.channel,
				user: msg.author,
				text: textToSummarize,
				style,
			});

			return msg.channel.send({
				embeds: [{
					color: 0x5865F2,
					title: `📝 Channel Summary (${filteredMessages.length} messages)`,
					description: summary.substring(0, 4000),
					footer: { text: `Style: ${style} • Requested by ${msg.author.tag}` },
				}],
			});
		}

		// Check for reply-based summarization
		if (msg.reference && msg.reference.messageId) {
			const referencedMsg = await msg.channel.messages.fetch(msg.reference.messageId).catch(() => null);
			if (referencedMsg) {
				textToSummarize = referencedMsg.content;
				if (suffix && !["brief", "detailed", "bullets"].includes(suffix.toLowerCase())) {
					style = suffix.toLowerCase();
				}
			}
		}

		// Validate input
		if (!textToSummarize || textToSummarize.length < 50) {
			const prefix = serverDocument.config.command_prefix || configJS.commandPrefix;
			return msg.channel.send({
				embeds: [{
					color: 0x5865F2,
					title: "AI Summarize",
					description: "Summarize text or channel messages using AI.",
					fields: [
						{
							name: "Usage",
							value: [
								`\`${prefix}aisummarize <text>\` - Summarize provided text`,
								`\`${prefix}aisummarize brief|detailed|bullets <text>\` - Summarize with style`,
								`\`${prefix}aisummarize channel [count]\` - Summarize recent messages`,
								`Reply to a message with \`${prefix}aisummarize\` to summarize it`,
							].join("\n"),
						},
						{
							name: "Styles",
							value: [
								"• **brief** - 1-2 sentence summary (default)",
								"• **detailed** - Comprehensive summary with key points",
								"• **bullets** - Bullet point list of main ideas",
							].join("\n"),
						},
					],
				}],
			});
		}

		// Show typing indicator
		await msg.channel.sendTyping();

		// Perform summarization
		const summary = await aiManager.summarize({
			serverDocument,
			channel: msg.channel,
			user: msg.author,
			text: textToSummarize,
			style,
		});

		// Send response
		const maxLength = 4000;
		await msg.channel.send({
			embeds: [{
				color: 0x5865F2,
				title: "📝 Summary",
				description: summary.substring(0, maxLength),
				footer: { text: `Style: ${style} • ${textToSummarize.length} characters summarized` },
			}],
		});
	} catch (error) {
		logger.warn(`AI Summarize command error: ${error.message}`, { svrid: msg.guild.id, usrid: msg.author.id });
		await msg.channel.send(`An error occurred: ${error.message}`);
	}
};
