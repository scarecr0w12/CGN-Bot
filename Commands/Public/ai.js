/**
 * AI Command - Main AI chat command
 * Provides AI-powered chat functionality with multi-provider support
 */

const { AIManager } = require("../../Modules/AI");
const TierManager = require("../../Modules/TierManager");

module.exports = async (main, documents, msg, commandData) => {
	const { client, configJS } = main;
	const { serverDocument } = documents;

	// Check if user has access to ai_chat feature
	const hasAccess = await TierManager.canAccess(msg.author.id, "ai_chat");
	if (!hasAccess) {
		return msg.channel.send({
			embeds: [{
				color: 0xFFAA00,
				title: "Premium Feature",
				description: "AI Chat requires a premium subscription. Upgrade your membership to access this feature.",
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

	// Parse subcommand
	const args = suffix.split(" ");
	const subcommand = args[0] ? args[0].toLowerCase() : "ask";
	const message = args.slice(1).join(" ") || suffix;

	try {
		switch (subcommand) {
			case "ask":
			case "chat": {
				if (!message || message === subcommand) {
					return msg.channel.send("Please provide a message to send to the AI.");
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

				// Perform chat
				const response = await aiManager.chat({
					serverDocument,
					channel: msg.channel,
					user: msg.author,
					message,
					stream: false,
				});

				// Send response (truncate if too long)
				const maxLength = 2000;
				if (response.length > maxLength) {
					await msg.channel.send(`${response.substring(0, maxLength - 3)}...`);
				} else {
					await msg.channel.send(response || "(No response)");
				}
				break;
			}

			case "stream": {
				if (!message || message === subcommand) {
					return msg.channel.send("Please provide a message to send to the AI.");
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

				// Send initial message
				const responseMsg = await msg.channel.send("...");
				let buffer = "";
				let lastEdit = 0;

				try {
					const stream = await aiManager.chat({
						serverDocument,
						channel: msg.channel,
						user: msg.author,
						message,
						stream: true,
					});

					for await (const chunk of stream) {
						buffer += chunk;
						const now = Date.now();

						// Update message every 500ms or when buffer grows significantly
						if (now - lastEdit > 500 || buffer.length - (responseMsg.content || "").length > 100) {
							const content = buffer.length > 2000 ? `${buffer.substring(0, 1997)}...` : buffer;
							await responseMsg.edit(content);
							lastEdit = now;

							if (buffer.length >= 2000) break;
						}
					}

					// Final update
					if (responseMsg.content !== buffer) {
						const content = buffer.length > 2000 ? `${buffer.substring(0, 1997)}...` : buffer;
						await responseMsg.edit(content || "(No response)");
					}
				} catch (error) {
					await responseMsg.edit(`Error: ${error.message}`);
				}
				break;
			}

			case "clear": {
				// Clear conversation memory
				await aiManager.memory.clear(serverDocument._id, msg.channel.id, msg.author.id);
				await msg.channel.send("Conversation memory cleared for this channel.");
				break;
			}

			case "stats": {
				// Show usage statistics (admin only)
				const { memberDocument } = documents;
				const adminLevel = memberDocument ? memberDocument.admin_level : 0;

				if (adminLevel < 1) {
					return msg.channel.send("You need admin permissions to view AI stats.");
				}

				const stats = await aiManager.usageTracker.getStats(serverDocument, 5);
				const lines = [
					"**AI Usage Statistics**",
					`Total Tokens: ${stats.tokens.total.toLocaleString()}`,
					`Estimated Cost: $${stats.cost.usd.toFixed(4)}`,
					`Total Requests: ${stats.totalRequests.toLocaleString()}`,
					"",
					"**Top Users:**",
				];

				for (const user of stats.topUsers) {
					const member = msg.guild.members.cache.get(user.userId);
					const name = member ? member.displayName : user.userId;
					lines.push(`• ${name}: ${(user.tokensTotal || 0).toLocaleString()} tokens`);
				}

				await msg.channel.send(lines.join("\n"));
				break;
			}

			case "variables": {
				// Show available variables
				const help = aiManager.getVariablesHelp();
				await msg.channel.send(help);
				break;
			}

			case "search": {
				// Web search tool
				const query = args.slice(1).join(" ");
				if (!query) {
					return msg.channel.send("Please provide a search query.");
				}

				const result = await aiManager.toolRegistry.execute("websearch", {
					serverDocument,
					user: msg.author,
					params: { query, limit: 5 },
				});

				await msg.channel.send(result.substring(0, 2000));
				break;
			}

			case "help":
			default: {
				const prefix = serverDocument.config.command_prefix || configJS.commandPrefix;
				const helpText = [
					"**AI Commands**",
					`\`${prefix}ai ask <message>\` - Chat with the AI`,
					`\`${prefix}ai stream <message>\` - Chat with streaming response`,
					`\`${prefix}ai clear\` - Clear conversation memory`,
					`\`${prefix}ai search <query>\` - Search the web`,
					`\`${prefix}ai variables\` - Show available template variables`,
					`\`${prefix}ai stats\` - View usage statistics (admin)`,
					"",
					"**Tips:**",
					"• The AI remembers recent conversation context",
					"• Use variables like `{{user}}` in your messages",
					"• Admins can configure AI settings in the dashboard",
				];
				await msg.channel.send(helpText.join("\n"));
			}
		}
	} catch (error) {
		logger.warn(`AI command error: ${error.message}`, { svrid: msg.guild.id, usrid: msg.author.id });
		await msg.channel.send(`An error occurred: ${error.message}`);
	}
};
