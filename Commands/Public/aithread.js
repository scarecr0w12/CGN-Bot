/**
 * AI Thread Command - Persistent AI conversation threads
 * Creates Discord threads for long-running AI conversations with memory
 */

const { AIManager } = require("../../Modules/AI");
const TierManager = require("../../Modules/TierManager");
const { ChannelType } = require("discord.js");

module.exports = async (main, documents, msg, commandData) => {
	const { client, configJS } = main;
	const { serverDocument } = documents;

	// Check if server has access to ai_chat feature (premium is per-server)
	const hasAccess = await TierManager.canAccess(msg.guild.id, "ai_chat");
	if (!hasAccess) {
		return msg.channel.send({
			embeds: [{
				color: 0xFFAA00,
				title: "Premium Feature",
				description: "AI Thread requires a premium subscription. Upgrade your membership to access this feature.",
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
	const subcommand = args[0] ? args[0].toLowerCase() : "start";

	try {
		switch (subcommand) {
			case "start":
			case "new": {
				// Create a new AI thread
				const topic = args.slice(1).join(" ") || "AI Conversation";

				// Check if we can create threads in this channel
				if (!msg.channel.isTextBased() || msg.channel.type === ChannelType.DM) {
					return msg.channel.send("Threads can only be created in text channels.");
				}

				// Create the thread
				const threadName = `🤖 ${topic.substring(0, 90)}`;
				const thread = await msg.channel.threads.create({
					name: threadName,
					autoArchiveDuration: 60,
					reason: `AI Thread created by ${msg.author.tag}`,
				});

				// Send initial message in thread
				await thread.send({
					embeds: [{
						color: 0x5865F2,
						title: "🤖 AI Thread Started",
						description: `**Topic:** ${topic}\n\nI'll respond to your messages in this thread. The conversation context will be preserved throughout our discussion.\n\nUse \`/aithread end\` to close this thread when done.`,
						footer: { text: `Started by ${msg.author.tag}` },
						timestamp: new Date().toISOString(),
					}],
				});

				// Store thread metadata
				const aiConfig = serverDocument.config.ai || {};
				const threads = aiConfig.threads || {};
				threads[thread.id] = {
					ownerId: msg.author.id,
					topic: topic,
					createdAt: Date.now(),
					messageCount: 0,
				};
				serverDocument.config.ai = { ...aiConfig, threads };
				await serverDocument.save();

				await msg.channel.send(`Created AI thread: ${thread}`);
				break;
			}

			case "end":
			case "close": {
				// Close the current AI thread
				if (!msg.channel.isThread()) {
					return msg.channel.send("This command must be used inside an AI thread.");
				}

				const aiConfig = serverDocument.config.ai || {};
				const threads = aiConfig.threads || {};
				const threadData = threads[msg.channel.id];

				if (!threadData) {
					return msg.channel.send("This doesn't appear to be an AI thread.");
				}

				// Check if user can close the thread
				const { memberDocument } = documents;
				const adminLevel = memberDocument ? memberDocument.admin_level : 0;
				const isOwner = threadData.ownerId === msg.author.id;

				if (!isOwner && adminLevel < 1) {
					return msg.channel.send("Only the thread creator or admins can close this thread.");
				}

				// Clear thread memory
				await aiManager.memory.clear(serverDocument._id, msg.channel.id, threadData.ownerId);

				// Remove thread from tracking
				delete threads[msg.channel.id];
				serverDocument.config.ai = { ...aiConfig, threads };
				await serverDocument.save();

				await msg.channel.send({
					embeds: [{
						color: 0x57F287,
						title: "Thread Closed",
						description: "This AI conversation has been ended. The thread will be archived.",
					}],
				});

				// Archive the thread
				await msg.channel.setArchived(true);
				break;
			}

			case "list": {
				// List active AI threads
				const aiConfig = serverDocument.config.ai || {};
				const threads = aiConfig.threads || {};
				const threadEntries = Object.entries(threads);

				if (threadEntries.length === 0) {
					return msg.channel.send("No active AI threads in this server.");
				}

				const threadList = await Promise.all(
					threadEntries.slice(0, 10).map(async ([threadId, data]) => {
						const thread = msg.guild.channels.cache.get(threadId);
						const owner = await client.users.fetch(data.ownerId).catch(() => null);
						const threadLink = thread ? `<#${threadId}>` : `~~${data.topic}~~ (deleted)`;
						const ownerName = owner ? owner.tag : "Unknown";
						return `• ${threadLink} - by ${ownerName} (${data.messageCount || 0} messages)`;
					}),
				);

				await msg.channel.send({
					embeds: [{
						color: 0x5865F2,
						title: "Active AI Threads",
						description: threadList.join("\n") || "None",
						footer: { text: `${threadEntries.length} total threads` },
					}],
				});
				break;
			}

			case "context":
			case "memory": {
				// Show current context/memory info
				if (!msg.channel.isThread()) {
					return msg.channel.send("This command shows memory info for the current AI thread.");
				}

				const history = await aiManager.memory.getHistory(
					serverDocument._id,
					msg.channel.id,
					msg.author.id,
					serverDocument.config.ai?.memory || {},
				);

				const messageCount = history.filter(m => m.role === "user").length;
				const tokenEstimate = history.reduce((sum, m) => sum + (m.content?.length || 0), 0) / 4;

				await msg.channel.send({
					embeds: [{
						color: 0x5865F2,
						title: "Thread Memory",
						fields: [
							{ name: "Messages in Context", value: String(messageCount), inline: true },
							{ name: "Estimated Tokens", value: String(Math.round(tokenEstimate)), inline: true },
						],
						footer: { text: "Memory is cleared when the thread is closed" },
					}],
				});
				break;
			}

			case "help":
			default: {
				const prefix = serverDocument.config.command_prefix || configJS.commandPrefix;
				await msg.channel.send({
					embeds: [{
						color: 0x5865F2,
						title: "AI Thread Commands",
						description: "Create persistent AI conversations with memory.",
						fields: [
							{
								name: "Commands",
								value: [
									`\`${prefix}aithread start [topic]\` - Create a new AI thread`,
									`\`${prefix}aithread end\` - Close the current thread`,
									`\`${prefix}aithread list\` - List active AI threads`,
									`\`${prefix}aithread context\` - Show memory info`,
								].join("\n"),
							},
							{
								name: "How it works",
								value: "AI threads are Discord threads where the bot maintains conversation context. Messages you send in the thread will receive AI responses with full context of the conversation.",
							},
						],
					}],
				});
			}
		}
	} catch (error) {
		logger.warn(`AI Thread command error: ${error.message}`, { svrid: msg.guild.id, usrid: msg.author.id });
		await msg.channel.send(`An error occurred: ${error.message}`);
	}
};
