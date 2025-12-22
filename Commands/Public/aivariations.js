/**
 * AI Variations Command - Create variations of existing images
 * Uses DALL-E to generate variations of uploaded images
 */

const { AIManager } = require("../../Modules/AI");
const TierManager = require("../../Modules/TierManager");
const { AttachmentBuilder } = require("discord.js");
const { fetch } = require("undici");

module.exports = async (main, documents, msg, commandData) => {
	const { client, configJS } = main;
	const { serverDocument } = documents;

	// Check if server has access to ai_images feature (premium)
	const hasAccess = await TierManager.canAccess(msg.guild.id, "ai_images");
	if (!hasAccess) {
		return msg.channel.send({
			embeds: [{
				color: 0xFFAA00,
				title: "Premium Feature",
				description: "AI Image Variations requires a premium subscription. Upgrade your membership to access this feature.",
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

	// Valid sizes for variations (DALL-E 2 only)
	const validSizes = ["256x256", "512x512", "1024x1024"];

	try {
		// Parse size option
		let size = "1024x1024";
		if (suffix && validSizes.includes(suffix)) {
			size = suffix;
		}

		// Get image from attachment or reply
		let imageUrl = null;
		let imageSource = null;

		// Check for attached image
		if (msg.attachments.size > 0) {
			const attachment = msg.attachments.first();
			if (attachment.contentType && attachment.contentType.startsWith("image/")) {
				imageUrl = attachment.url;
				imageSource = "attachment";
			}
		}

		// Check for reply with image
		if (!imageUrl && msg.reference && msg.reference.messageId) {
			const referencedMsg = await msg.channel.messages.fetch(msg.reference.messageId).catch(() => null);
			if (referencedMsg) {
				// Check attachments
				if (referencedMsg.attachments.size > 0) {
					const attachment = referencedMsg.attachments.first();
					if (attachment.contentType && attachment.contentType.startsWith("image/")) {
						imageUrl = attachment.url;
						imageSource = "reply";
					}
				}
				// Check embeds with images
				if (!imageUrl && referencedMsg.embeds.length > 0) {
					for (const embed of referencedMsg.embeds) {
						if (embed.image && embed.image.url) {
							imageUrl = embed.image.url;
							imageSource = "reply embed";
							break;
						}
						if (embed.thumbnail && embed.thumbnail.url) {
							imageUrl = embed.thumbnail.url;
							imageSource = "reply embed";
							break;
						}
					}
				}
			}
		}

		// Validate image
		if (!imageUrl) {
			const prefix = serverDocument.config.command_prefix || configJS.commandPrefix;
			return msg.channel.send({
				embeds: [{
					color: 0x5865F2,
					title: "🔄 AI Image Variations",
					description: "Generate variations of an existing image using AI.",
					fields: [
						{
							name: "Usage",
							value: [
								`\`${prefix}aivariations\` - Attach an image to the command`,
								`Reply to a message with an image using \`${prefix}aivariations\``,
								`\`${prefix}aivariations [size]\` - Specify output size`,
							].join("\n"),
						},
						{
							name: "Sizes",
							value: validSizes.map(s => `• \`${s}\``).join("\n"),
						},
						{
							name: "Requirements",
							value: [
								"• Image must be PNG format",
								"• Image should be square (will be cropped)",
								"• Maximum file size: 4MB",
							].join("\n"),
						},
						{
							name: "Note",
							value: "Variations use DALL-E 2 and create new images inspired by the original while maintaining similar composition and style.",
						},
					],
					footer: { text: "Costs apply per variation generated" },
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
				title: "🔄 Generating Variation...",
				description: `Creating variation from ${imageSource}...`,
				fields: [
					{ name: "Output Size", value: size, inline: true },
				],
				thumbnail: { url: imageUrl },
				footer: { text: "This may take 10-30 seconds..." },
			}],
		});

		// Fetch the image
		let imageBuffer;
		try {
			const response = await fetch(imageUrl);
			if (!response.ok) {
				throw new Error(`Failed to fetch image: ${response.status}`);
			}
			imageBuffer = Buffer.from(await response.arrayBuffer());
		} catch (fetchError) {
			await generatingMsg.edit({
				embeds: [{
					color: 0xFF0000,
					title: "Failed to Fetch Image",
					description: `Could not download the image: ${fetchError.message}`,
				}],
			});
			return;
		}

		// Check image size (4MB limit)
		if (imageBuffer.length > 4 * 1024 * 1024) {
			await generatingMsg.edit({
				embeds: [{
					color: 0xFF0000,
					title: "Image Too Large",
					description: "The image must be less than 4MB. Please use a smaller image.",
				}],
			});
			return;
		}

		// Generate variation
		const images = await aiManager.createImageVariation({
			serverDocument,
			user: msg.author,
			image: imageBuffer,
			size,
		});

		if (!images || images.length === 0) {
			await generatingMsg.edit({
				embeds: [{
					color: 0xFF0000,
					title: "Generation Failed",
					description: "No variation was generated. The image may be in an unsupported format. Try using a square PNG image.",
				}],
			});
			return;
		}

		const image = images[0];

		// Create embed with image
		const embed = {
			color: 0x5865F2,
			title: "🔄 Image Variation",
			description: "Here's a variation of your image:",
			fields: [
				{ name: "Size", value: size, inline: true },
				{ name: "Source", value: imageSource, inline: true },
			],
			footer: { text: `Generated for ${msg.author.tag}` },
			timestamp: new Date().toISOString(),
		};

		// Send image
		if (image.url) {
			embed.image = { url: image.url };
			await generatingMsg.edit({ embeds: [embed] });
		} else if (image.b64_json) {
			const buffer = Buffer.from(image.b64_json, "base64");
			const attachment = new AttachmentBuilder(buffer, { name: "variation.png" });
			embed.image = { url: "attachment://variation.png" };
			await generatingMsg.edit({ embeds: [embed], files: [attachment] });
		} else {
			await generatingMsg.edit({
				embeds: [{
					color: 0xFF0000,
					title: "Generation Failed",
					description: "Variation was generated but could not be retrieved.",
				}],
			});
		}
	} catch (error) {
		logger.warn(`AI Variations command error: ${error.message}`, { svrid: msg.guild.id, usrid: msg.author.id });
		await msg.channel.send(`An error occurred: ${error.message}`);
	}
};
