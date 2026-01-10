const Logger = require("../../Logger");
const logger = new Logger("FormButtonHandler");

module.exports = async (client, interaction) => {
	if (!interaction.isButton()) return;
	if (!interaction.customId.startsWith("formresponse_")) return;

	try {
		const [, action, responseId] = interaction.customId.split("_");

		if (action === "approve") {
			await handleApprove(client, interaction, responseId);
		} else if (action === "reject") {
			await handleReject(client, interaction, responseId);
		}
	} catch (err) {
		logger.error("Form button handler error:", err);
		if (!interaction.replied && !interaction.deferred) {
			await interaction.reply({
				content: "❌ An error occurred while processing your action.",
				ephemeral: true,
			}).catch(e => logger.debug("Failed to send error reply:", e));
		}
	}
};

async function handleApprove (client, interaction, responseId) {
	const formBuilder = client.formBuilder;
	if (!formBuilder) {
		return interaction.reply({
			content: "❌ Form Builder system is not available.",
			ephemeral: true,
		});
	}

	try {
		await formBuilder.reviewResponse(responseId, interaction.user.id, "approved", null);

		await interaction.update({
			embeds: interaction.message.embeds.map(embed => ({
				...embed,
				color: 0x2ecc71,
				fields: [
					...embed.fields.filter(f => f.name !== "📊 Status"),
					{
						name: "📊 Status",
						value: "✅ Approved",
						inline: true,
					},
					{
						name: "👤 Reviewed By",
						value: `<@${interaction.user.id}>`,
						inline: true,
					},
				],
			})),
			components: [],
		});

		await interaction.followUp({
			content: `✅ Response **${responseId}** has been approved.`,
			ephemeral: true,
		});
	} catch (err) {
		logger.error("Error approving response:", err);
		return interaction.reply({
			content: `❌ Failed to approve response: ${err.message}`,
			ephemeral: true,
		});
	}
}

async function handleReject (client, interaction, responseId) {
	const formBuilder = client.formBuilder;
	if (!formBuilder) {
		return interaction.reply({
			content: "❌ Form Builder system is not available.",
			ephemeral: true,
		});
	}

	try {
		await formBuilder.reviewResponse(responseId, interaction.user.id, "rejected", null);

		await interaction.update({
			embeds: interaction.message.embeds.map(embed => ({
				...embed,
				color: 0xe74c3c,
				fields: [
					...embed.fields.filter(f => f.name !== "📊 Status"),
					{
						name: "📊 Status",
						value: "❌ Rejected",
						inline: true,
					},
					{
						name: "👤 Reviewed By",
						value: `<@${interaction.user.id}>`,
						inline: true,
					},
				],
			})),
			components: [],
		});

		await interaction.followUp({
			content: `❌ Response **${responseId}** has been rejected.`,
			ephemeral: true,
		});
	} catch (err) {
		logger.error("Error rejecting response:", err);
		return interaction.reply({
			content: `❌ Failed to reject response: ${err.message}`,
			ephemeral: true,
		});
	}
}
