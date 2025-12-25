const { SlashCommandBuilder } = require("discord.js");
const TierManager = require("../../../Modules/TierManager");

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

		// Check tier access for ai_chat feature
		const hasAIAccess = await TierManager.canAccess(interaction.guild.id, "ai_chat");
		if (!hasAIAccess) {
			return interaction.reply({
				embeds: [{
					color: 0xFFAA00,
					title: "Premium Feature",
					description: "AI Chat requires a premium subscription. Upgrade your membership to access this feature.",
					footer: { text: "Visit the membership page on our website to learn more." },
				}],
				ephemeral: true,
			});
		}

		// Check if AI is explicitly enabled
		if (!serverDocument.config.ai || serverDocument.config.ai.isEnabled !== true) {
			return interaction.reply({
				content: "AI is not enabled on this server. An admin can enable it in the dashboard under AI Settings.",
				ephemeral: true,
			});
		}

		switch (subcommand) {
			case "ask": {
				const message = interaction.options.getString("message");

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
				const modelName = aiConfig.model && aiConfig.model.name ? aiConfig.model.name : "gpt-4o-mini";
				return interaction.reply({
					embeds: [{
						color: 0x3669FA,
						title: "🤖 AI Statistics",
						fields: [
							{ name: "Enabled", value: aiConfig.isEnabled ? "Yes" : "No", inline: true },
							{ name: "Model", value: modelName, inline: true },
							{ name: "Provider", value: aiConfig.defaultProvider || "openai", inline: true },
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
