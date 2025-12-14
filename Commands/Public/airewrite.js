/**
 * AI Rewrite Command - Rewrite text in different tones/styles
 * Uses AI to transform text while preserving meaning
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
				description: "AI Rewrite requires a premium subscription. Upgrade your membership to access this feature.",
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

	// Available tones
	const validTones = ["professional", "casual", "formal", "simple", "academic", "humorous", "persuasive", "concise"];

	try {
		// Parse tone and text
		let tone = "professional";
		let textToRewrite = suffix;

		// Check if first argument is a valid tone
		if (args[0] && validTones.includes(args[0].toLowerCase())) {
			tone = args[0].toLowerCase();
			textToRewrite = args.slice(1).join(" ");
		}

		// Check for reply-based rewriting
		if (msg.reference && msg.reference.messageId) {
			const referencedMsg = await msg.channel.messages.fetch(msg.reference.messageId).catch(() => null);
			if (referencedMsg) {
				textToRewrite = referencedMsg.content;
				// If suffix is just a tone, use it
				if (validTones.includes(suffix.toLowerCase())) {
					tone = suffix.toLowerCase();
				} else if (args[0] && validTones.includes(args[0].toLowerCase())) {
					tone = args[0].toLowerCase();
				}
			}
		}

		// Validate input
		if (!textToRewrite || textToRewrite.length < 10) {
			const prefix = serverDocument.config.command_prefix || configJS.commandPrefix;
			return msg.channel.send({
				embeds: [{
					color: 0x5865F2,
					title: "AI Rewrite",
					description: "Rewrite text in a different tone or style using AI.",
					fields: [
						{
							name: "Usage",
							value: [
								`\`${prefix}airewrite <text>\` - Rewrite in professional tone`,
								`\`${prefix}airewrite <tone> <text>\` - Rewrite in specified tone`,
								`Reply to a message with \`${prefix}airewrite [tone]\``,
							].join("\n"),
						},
						{
							name: "Available Tones",
							value: [
								"• **professional** - Formal business tone (default)",
								"• **casual** - Friendly, conversational",
								"• **formal** - Very formal, official",
								"• **simple** - Easy to understand",
								"• **academic** - Scholarly, research-style",
								"• **humorous** - Witty and fun",
								"• **persuasive** - Compelling and convincing",
								"• **concise** - Brief and to the point",
							].join("\n"),
						},
					],
				}],
			});
		}

		// Check rate limits
		const rateLimitError = await aiManager.checkAndRecordUsage(
			serverDocument,
			msg.channel,
			msg.author,
		);
		if (rateLimitError) {
			return msg.channel.send(rateLimitError);
		}

		// Show typing indicator
		await msg.channel.sendTyping();

		// Perform rewrite
		const rewritten = await aiManager.rewrite({
			serverDocument,
			channel: msg.channel,
			user: msg.author,
			text: textToRewrite,
			tone,
		});

		// Send response
		const maxLength = 4000;
		await msg.channel.send({
			embeds: [{
				color: 0x5865F2,
				title: `✍️ Rewritten (${tone})`,
				description: rewritten.substring(0, maxLength),
				fields: [
					{
						name: "Original",
						value: textToRewrite.length > 1000 ? `${textToRewrite.substring(0, 997)}...` : textToRewrite,
					},
				],
				footer: { text: `Requested by ${msg.author.tag}` },
			}],
		});
	} catch (error) {
		logger.warn(`AI Rewrite command error: ${error.message}`, { svrid: msg.guild.id, usrid: msg.author.id });
		await msg.channel.send(`An error occurred: ${error.message}`);
	}
};
