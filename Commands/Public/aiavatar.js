/**
 * AI Avatar Command - Generate stylized avatars
 * Uses AI to create portraits in various art styles
 */

const { AIManager } = require("../../Modules/AI");
const TierManager = require("../../Modules/TierManager");
const { AttachmentBuilder } = require("discord.js");

module.exports = async (main, documents, msg, commandData) => {
	const { client, configJS } = main;
	const { serverDocument } = documents;

	// Check if server has access to ai_image feature (premium)
	const hasAccess = await TierManager.canAccess(msg.guild.id, "ai_image");
	if (!hasAccess) {
		return msg.channel.send({
			embeds: [{
				color: 0xFFAA00,
				title: "Premium Feature",
				description: "AI Avatar Generation requires a premium subscription. Upgrade your membership to access this feature.",
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

	// Valid styles
	const validStyles = {
		anime: "Anime style with vibrant colors and detailed eyes",
		realistic: "Photorealistic portrait with professional lighting",
		cartoon: "Cartoon style with bold outlines and bright colors",
		pixel: "Pixel art in retro 16-bit gaming aesthetic",
		fantasy: "Fantasy art with magical atmosphere",
		chibi: "Cute chibi style with oversized head",
		cyberpunk: "Cyberpunk with neon lights and tech elements",
		watercolor: "Watercolor painting with soft artistic strokes",
	};

	try {
		// Parse style and description
		let style = "anime";
		let description = suffix;

		// Check if first argument is a valid style
		if (args[0] && validStyles[args[0].toLowerCase()]) {
			style = args[0].toLowerCase();
			description = args.slice(1).join(" ");
		}

		// Validate input
		if (!description || description.length < 3) {
			const prefix = serverDocument.config.command_prefix || configJS.commandPrefix;
			const styleList = Object.entries(validStyles)
				.map(([name, desc]) => `• **${name}** - ${desc}`)
				.join("\n");

			return msg.channel.send({
				embeds: [{
					color: 0x5865F2,
					title: "🎭 AI Avatar Generator",
					description: "Generate stylized avatar portraits using AI.",
					fields: [
						{
							name: "Usage",
							value: [
								`\`${prefix}aiavatar <description>\` - Generate anime-style avatar`,
								`\`${prefix}aiavatar <style> <description>\` - Generate with specific style`,
							].join("\n"),
						},
						{
							name: "Available Styles",
							value: styleList,
						},
						{
							name: "Examples",
							value: [
								`\`${prefix}aiavatar a warrior with silver hair and red eyes\``,
								`\`${prefix}aiavatar cyberpunk hacker with neon green hair\``,
								`\`${prefix}aiavatar chibi girl with cat ears\``,
								`\`${prefix}aiavatar realistic man with beard and glasses\``,
							].join("\n"),
						},
						{
							name: "Tips",
							value: "Describe physical features like hair color, eye color, clothing, accessories, and expression for best results.",
						},
					],
					footer: { text: "Costs apply per avatar generated" },
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

		// Send generating message
		const generatingMsg = await msg.channel.send({
			embeds: [{
				color: 0x5865F2,
				title: "🎭 Generating Avatar...",
				description: `**Description:** ${description.substring(0, 200)}${description.length > 200 ? "..." : ""}`,
				fields: [
					{ name: "Style", value: style.charAt(0).toUpperCase() + style.slice(1), inline: true },
				],
				footer: { text: "This may take 10-30 seconds..." },
			}],
		});

		// Generate avatar
		const images = await aiManager.generateAvatar({
			serverDocument,
			user: msg.author,
			description,
			style,
		});

		if (!images || images.length === 0) {
			await generatingMsg.edit({
				embeds: [{
					color: 0xFF0000,
					title: "Generation Failed",
					description: "No avatar was generated. Please try again with a different description.",
				}],
			});
			return;
		}

		const image = images[0];

		// Create embed with image
		const embed = {
			color: 0x5865F2,
			title: "🎭 Generated Avatar",
			description: `**Description:** ${description.substring(0, 200)}${description.length > 200 ? "..." : ""}`,
			fields: [
				{ name: "Style", value: style.charAt(0).toUpperCase() + style.slice(1), inline: true },
			],
			footer: { text: `Generated for ${msg.author.tag}` },
			timestamp: new Date().toISOString(),
		};

		// Add revised prompt if available
		if (image.revised_prompt) {
			embed.fields.push({
				name: "AI Enhanced Prompt",
				value: image.revised_prompt.substring(0, 500) + (image.revised_prompt.length > 500 ? "..." : ""),
			});
		}

		// Send image
		if (image.url) {
			embed.image = { url: image.url };
			await generatingMsg.edit({ embeds: [embed] });
		} else if (image.b64_json) {
			const buffer = Buffer.from(image.b64_json, "base64");
			const attachment = new AttachmentBuilder(buffer, { name: "avatar.png" });
			embed.image = { url: "attachment://avatar.png" };
			await generatingMsg.edit({ embeds: [embed], files: [attachment] });
		} else {
			await generatingMsg.edit({
				embeds: [{
					color: 0xFF0000,
					title: "Generation Failed",
					description: "Avatar was generated but could not be retrieved.",
				}],
			});
		}
	} catch (error) {
		logger.warn(`AI Avatar command error: ${error.message}`, { svrid: msg.guild.id, usrid: msg.author.id });
		await msg.channel.send(`An error occurred: ${error.message}`);
	}
};
