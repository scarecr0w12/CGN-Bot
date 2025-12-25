/**
 * AI Explain Command - Explain code, concepts, or errors
 * Uses AI to provide clear explanations at different skill levels
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
				description: "AI Explain requires a premium subscription. Upgrade your membership to access this feature.",
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

	// Valid types and levels
	const validTypes = ["code", "concept", "error"];
	const validLevels = ["beginner", "intermediate", "advanced"];

	try {
		// Parse type, level, and content
		let type = "code";
		let level = "intermediate";
		let content = suffix;

		// Check if first argument is a valid type
		if (args[0] && validTypes.includes(args[0].toLowerCase())) {
			type = args[0].toLowerCase();
			content = args.slice(1).join(" ");

			// Check if second argument is a valid level
			if (args[1] && validLevels.includes(args[1].toLowerCase())) {
				level = args[1].toLowerCase();
				content = args.slice(2).join(" ");
			}
		} else if (args[0] && validLevels.includes(args[0].toLowerCase())) {
			// Level without type
			level = args[0].toLowerCase();
			content = args.slice(1).join(" ");
		}

		// Check for reply-based explanation
		if (msg.reference && msg.reference.messageId) {
			const referencedMsg = await msg.channel.messages.fetch(msg.reference.messageId).catch(() => null);
			if (referencedMsg) {
				content = referencedMsg.content;
				// Parse suffix for type/level when replying
				if (args[0] && validTypes.includes(args[0].toLowerCase())) {
					type = args[0].toLowerCase();
					if (args[1] && validLevels.includes(args[1].toLowerCase())) {
						level = args[1].toLowerCase();
					}
				} else if (args[0] && validLevels.includes(args[0].toLowerCase())) {
					level = args[0].toLowerCase();
				}
			}
		}

		// Extract code from code blocks if present
		const codeBlockMatch = content.match(/```(?:\w+)?\n?([\s\S]*?)```/);
		if (codeBlockMatch) {
			content = codeBlockMatch[1].trim();
			type = "code";
		}

		// Validate input
		if (!content || content.length < 5) {
			const prefix = serverDocument.config.command_prefix || configJS.commandPrefix;
			return msg.channel.send({
				embeds: [{
					color: 0x5865F2,
					title: "AI Explain",
					description: "Get AI explanations for code, concepts, or error messages.",
					fields: [
						{
							name: "Usage",
							value: [
								`\`${prefix}aiexplain <content>\` - Explain code (default)`,
								`\`${prefix}aiexplain code|concept|error <content>\``,
								`\`${prefix}aiexplain [type] beginner|intermediate|advanced <content>\``,
								`Reply to a message with \`${prefix}aiexplain [type] [level]\``,
							].join("\n"),
						},
						{
							name: "Types",
							value: [
								"• **code** - Explain what code does (default)",
								"• **concept** - Explain programming concepts",
								"• **error** - Explain error messages and fixes",
							].join("\n"),
						},
						{
							name: "Levels",
							value: [
								"• **beginner** - For those new to programming",
								"• **intermediate** - Some experience (default)",
								"• **advanced** - Technical depth",
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

		// Perform explanation
		const explanation = await aiManager.explain({
			serverDocument,
			channel: msg.channel,
			user: msg.author,
			content,
			type,
			level,
		});

		// Format type label
		const typeLabels = {
			code: "💻 Code Explanation",
			concept: "📚 Concept Explanation",
			error: "⚠️ Error Explanation",
		};

		// Send response
		const maxLength = 4000;
		await msg.channel.send({
			embeds: [{
				color: 0x5865F2,
				title: typeLabels[type] || "Explanation",
				description: explanation.substring(0, maxLength),
				fields: content.length <= 500 ? [
					{
						name: "Input",
						value: `\`\`\`\n${content.substring(0, 450)}\n\`\`\``,
					},
				] : [],
				footer: { text: `Level: ${level} • Requested by ${msg.author.tag}` },
			}],
		});
	} catch (error) {
		logger.warn(`AI Explain command error: ${error.message}`, { svrid: msg.guild.id, usrid: msg.author.id });
		await msg.channel.send(`An error occurred: ${error.message}`);
	}
};
