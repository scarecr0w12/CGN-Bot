const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("ai")
		.setDescription("Chat with the AI assistant")
		.addSubcommand(sub =>
			sub.setName("ask")
				.setDescription("Ask the AI a question")
				.addStringOption(opt =>
					opt.setName("message")
						.setDescription("Your message to the AI")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("clear")
				.setDescription("Clear your conversation history"),
		)
		.addSubcommand(sub =>
			sub.setName("stats")
				.setDescription("View AI usage statistics"),
		),

	async execute (interaction, client, serverDocument) {
		const subcommand = interaction.options.getSubcommand();

		switch (subcommand) {
			case "ask": {
				const message = interaction.options.getString("message");

				// Check if AI is enabled
				if (!serverDocument.config.ai || !serverDocument.config.ai.enabled) {
					return interaction.reply({
						content: "AI is not enabled on this server!",
						ephemeral: true,
					});
				}

				await interaction.deferReply();

				try {
					// Use the AI manager if available
					if (client.aiManager) {
						const response = await client.aiManager.chat(
							interaction.guild.id,
							interaction.user.id,
							message,
						);
						return interaction.editReply(response.substring(0, 2000));
					} else {
						return interaction.editReply("AI service is not available.");
					}
				} catch (err) {
					return interaction.editReply("Failed to get AI response. Please try again.");
				}
			}

			case "clear": {
				if (client.aiManager) {
					client.aiManager.clearHistory(interaction.guild.id, interaction.user.id);
				}
				return interaction.reply({
					content: "Your AI conversation history has been cleared! 🗑️",
					ephemeral: true,
				});
			}

			case "stats": {
				const aiConfig = serverDocument.config.ai || {};
				return interaction.reply({
					embeds: [{
						color: 0x3669FA,
						title: "🤖 AI Statistics",
						fields: [
							{ name: "Enabled", value: aiConfig.enabled ? "Yes" : "No", inline: true },
							{ name: "Model", value: aiConfig.model || "Default", inline: true },
						],
					}],
					ephemeral: true,
				});
			}

			default:
				return interaction.reply({ content: "Unknown subcommand", ephemeral: true });
		}
	},
};
