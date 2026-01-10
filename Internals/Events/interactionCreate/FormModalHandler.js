const Logger = require("../../Logger");
const logger = new Logger("FormModalHandler");

module.exports = async (client, interaction) => {
	if (!interaction.isModalSubmit()) return;
	if (!interaction.customId.startsWith("form_")) return;

	try {
		if (interaction.customId === "form_create_modal") {
			await handleFormCreate(client, interaction);
		}
	} catch (err) {
		logger.error("Form modal handler error:", err);
		if (!interaction.replied && !interaction.deferred) {
			await interaction.reply({
				content: "❌ An error occurred while processing your form.",
				ephemeral: true,
			}).catch(e => logger.debug("Failed to send error reply:", e));
		}
	}
};

async function handleFormCreate (client, interaction) {
	const name = interaction.fields.getTextInputValue("form_name");
	const description = interaction.fields.getTextInputValue("form_description") || null;

	const serverDocument = await client.getServerDocument(interaction.guild.id);
	const formBuilder = client.formBuilder;

	if (!formBuilder) {
		return interaction.reply({
			content: "❌ Form Builder system is not available.",
			ephemeral: true,
		});
	}

	try {
		const form = await formBuilder.createForm({
			server_id: serverDocument._id,
			name,
			description,
			fields: [],
			enabled: true,
			submit_channel: null,
			review_channel: null,
			auto_role_id: null,
			webhook_url: null,
		});

		const dashboardUrl = `https://skynetbot.net/dashboard/${interaction.guild.id}/forms/${form._id}/edit`;
		const nextSteps = [
			`1. Visit the [dashboard](${dashboardUrl}) to configure form fields`,
			"2. Set submit and review channels",
			"3. Configure auto-role assignment",
			"4. Enable the form when ready",
		].join("\n");

		return interaction.reply({
			embeds: [{
				color: 0x2ecc71,
				title: "✅ Form Created",
				description: `Form **${name}** has been created successfully!\n\n**Next Steps:**\n${nextSteps}`,
				fields: [
					{ name: "Form ID", value: `\`${form._id}\``, inline: true },
					{ name: "Status", value: "✅ Enabled", inline: true },
				],
			}],
			ephemeral: true,
		});
	} catch (err) {
		logger.error("Error creating form:", err);
		return interaction.reply({
			embeds: [{
				color: 0xe74c3c,
				title: "❌ Failed to Create Form",
				description: err.message.includes("limit") ? err.message : "An error occurred while creating the form.",
			}],
			ephemeral: true,
		});
	}
}
