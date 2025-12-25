const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("imgur")
		.setDescription("Upload an image to Imgur")
		.addAttachmentOption(opt =>
			opt.setName("image")
				.setDescription("The image to upload")
				.setRequired(true),
		),

	async execute (interaction) {
		const attachment = interaction.options.getAttachment("image");
		const clientId = process.env.IMGUR_CLIENT_ID;

		if (!clientId) {
			return interaction.reply({
				content: "Imgur upload is not configured!",
				ephemeral: true,
			});
		}

		if (!attachment.contentType || !attachment.contentType.startsWith("image/")) {
			return interaction.reply({
				content: "Please provide an image file!",
				ephemeral: true,
			});
		}

		await interaction.deferReply();

		try {
			const response = await fetch("https://api.imgur.com/3/image", {
				method: "POST",
				headers: {
					Authorization: `Client-ID ${clientId}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					image: attachment.url,
					type: "url",
				}),
			});

			const data = await response.json();

			if (!data.success) {
				return interaction.editReply("Failed to upload to Imgur!");
			}

			return interaction.editReply({
				embeds: [{
					color: 0x1BB76E,
					title: "📸 Uploaded to Imgur!",
					image: { url: data.data.link },
					fields: [
						{ name: "Link", value: data.data.link, inline: false },
						{ name: "Delete Hash", value: `||${data.data.deletehash}||`, inline: false },
					],
					footer: { text: "Keep the delete hash to remove the image later" },
				}],
			});
		} catch (err) {
			return interaction.editReply("Failed to upload to Imgur!");
		}
	},
};
