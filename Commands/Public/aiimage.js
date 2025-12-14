/**
 * AI Image Command - Generate images from text prompts
 * Uses DALL-E or other image generation models
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
				description: "AI Image Generation requires a premium subscription. Upgrade your membership to access this feature.",
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

	// Valid options
	const validSizes = ["1024x1024", "1792x1024", "1024x1792"];
	const validQualities = ["standard", "hd"];
	const validStyles = ["vivid", "natural"];
	const validModels = ["dall-e-3", "dall-e-2", "gpt-image-1"];

	try {
		// Parse options
		let prompt = suffix;
		let size = "1024x1024";
		let quality = "standard";
		let style = "vivid";
		let model = "dall-e-3";

		// Parse flags from the prompt
		const flagPattern = /--(\w+)(?:=|\s+)(\S+)/g;
		let match;
		while ((match = flagPattern.exec(suffix)) !== null) {
			const [fullMatch, flag, value] = match;
			switch (flag.toLowerCase()) {
				case "size":
					if (validSizes.includes(value)) size = value;
					break;
				case "quality":
					if (validQualities.includes(value.toLowerCase())) quality = value.toLowerCase();
					break;
				case "style":
					if (validStyles.includes(value.toLowerCase())) style = value.toLowerCase();
					break;
				case "model":
					if (validModels.includes(value.toLowerCase())) model = value.toLowerCase();
					break;
			}
			prompt = prompt.replace(fullMatch, "").trim();
		}

		// Validate prompt
		if (!prompt || prompt.length < 3) {
			const prefix = serverDocument.config.command_prefix || configJS.commandPrefix;
			return msg.channel.send({
				embeds: [{
					color: 0x5865F2,
					title: "🎨 AI Image Generator",
					description: "Generate images from text descriptions using AI.",
					fields: [
						{
							name: "Usage",
							value: `\`${prefix}aiimage <prompt> [options]\``,
						},
						{
							name: "Options",
							value: [
								"`--size=1024x1024` - Image dimensions (1024x1024, 1792x1024, 1024x1792)",
								"`--quality=standard` - Quality level (standard, hd)",
								"`--style=vivid` - Style (vivid, natural)",
								"`--model=dall-e-3` - Model (dall-e-3, dall-e-2)",
							].join("\n"),
						},
						{
							name: "Examples",
							value: [
								`\`${prefix}aiimage a sunset over mountains\``,
								`\`${prefix}aiimage cyberpunk city --style=vivid --quality=hd\``,
								`\`${prefix}aiimage portrait painting --size=1024x1792\``,
							].join("\n"),
						},
						{
							name: "Tips",
							value: "Be descriptive! Include details like art style, lighting, mood, and composition for better results.",
						},
					],
					footer: { text: "Costs apply per image generated" },
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
				title: "🎨 Generating Image...",
				description: `**Prompt:** ${prompt.substring(0, 200)}${prompt.length > 200 ? "..." : ""}`,
				fields: [
					{ name: "Model", value: model, inline: true },
					{ name: "Size", value: size, inline: true },
					{ name: "Quality", value: quality, inline: true },
				],
				footer: { text: "This may take 10-30 seconds..." },
			}],
		});

		// Generate image
		const images = await aiManager.generateImage({
			serverDocument,
			user: msg.author,
			prompt,
			model,
			size,
			quality,
			style,
		});

		if (!images || images.length === 0) {
			await generatingMsg.edit({
				embeds: [{
					color: 0xFF0000,
					title: "Generation Failed",
					description: "No image was generated. Please try again with a different prompt.",
				}],
			});
			return;
		}

		const image = images[0];

		// Create embed with image
		const embed = {
			color: 0x5865F2,
			title: "🎨 Generated Image",
			description: `**Prompt:** ${prompt.substring(0, 200)}${prompt.length > 200 ? "..." : ""}`,
			fields: [
				{ name: "Model", value: model, inline: true },
				{ name: "Size", value: size, inline: true },
			],
			footer: { text: `Generated for ${msg.author.tag}` },
			timestamp: new Date().toISOString(),
		};

		// Add revised prompt if available (DALL-E 3 feature)
		if (image.revised_prompt && image.revised_prompt !== prompt) {
			embed.fields.push({
				name: "Revised Prompt",
				value: image.revised_prompt.substring(0, 1000),
			});
		}

		// Send image
		if (image.url) {
			embed.image = { url: image.url };
			await generatingMsg.edit({ embeds: [embed] });
		} else if (image.b64_json) {
			// Convert base64 to attachment
			const buffer = Buffer.from(image.b64_json, "base64");
			const attachment = new AttachmentBuilder(buffer, { name: "generated.png" });
			embed.image = { url: "attachment://generated.png" };
			await generatingMsg.edit({ embeds: [embed], files: [attachment] });
		} else {
			await generatingMsg.edit({
				embeds: [{
					color: 0xFF0000,
					title: "Generation Failed",
					description: "Image was generated but could not be retrieved.",
				}],
			});
		}
	} catch (error) {
		logger.warn(`AI Image command error: ${error.message}`, { svrid: msg.guild.id, usrid: msg.author.id });
		await msg.channel.send(`An error occurred: ${error.message}`);
	}
};
