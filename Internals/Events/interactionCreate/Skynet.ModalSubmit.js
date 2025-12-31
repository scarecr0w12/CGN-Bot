const { EmbedBuilder } = require("../../../Modules/EmbedBuilder");

module.exports = class {
	constructor (client) {
		this.client = client;
	}

	async handle (interaction) {
		if (!interaction.isModalSubmit()) return;

		// Handle embed builder modals
		if (interaction.customId.startsWith("embed_builder_")) {
			return this.handleEmbedBuilder(interaction);
		}
	}

	async handleEmbedBuilder (interaction) {
		const title = interaction.fields.getTextInputValue("embed_title") || null;
		const description = interaction.fields.getTextInputValue("embed_description") || null;
		const colorInput = interaction.fields.getTextInputValue("embed_color") || null;
		const footerText = interaction.fields.getTextInputValue("embed_footer") || null;
		const imageUrl = interaction.fields.getTextInputValue("embed_image") || null;

		if (!title && !description) {
			return interaction.reply({
				content: "❌ You must provide at least a title or description!",
				ephemeral: true,
			});
		}

		const embedData = {};
		if (title) embedData.title = title;
		if (description) embedData.description = description;
		if (colorInput) embedData.color = EmbedBuilder.parseColor(colorInput);
		if (footerText) {
			embedData.footer = {
				text: footerText,
			};
		}
		if (imageUrl) {
			// Validate URL format
			try {
				const parsedUrl = new URL(imageUrl);
				if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
					embedData.image = imageUrl;
				} else {
					return interaction.reply({
						content: "❌ Image URL must use HTTP or HTTPS protocol!",
						ephemeral: true,
					});
				}
			} catch (error) {
				return interaction.reply({
					content: "❌ Invalid image URL provided!",
					ephemeral: true,
				});
			}
		}

		// Validate embed
		const validation = EmbedBuilder.validate(embedData);
		if (!validation.valid) {
			return interaction.reply({
				content: `❌ Validation errors:\n${validation.errors.join("\n")}`,
				ephemeral: true,
			});
		}

		// Create and send embed
		const embed = EmbedBuilder.createFromData(embedData);

		try {
			await interaction.channel.send({ embeds: [embed] });
			return interaction.reply({
				content: "✅ Embed sent successfully!",
				ephemeral: true,
			});
		} catch (error) {
			return interaction.reply({
				content: `❌ Failed to send embed: ${error.message}`,
				ephemeral: true,
			});
		}
	}
};
