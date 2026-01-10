const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const Logger = require("../../Logger");
const logger = new Logger("FormResponsesCommand");

module.exports = {
	name: "formresponses",
	adminLevel: 2,
	data: new SlashCommandBuilder()
		.setName("formresponses")
		.setDescription("View and manage form responses")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addSubcommand(sub =>
			sub.setName("list")
				.setDescription("List recent form responses")
				.addStringOption(opt =>
					opt.setName("form")
						.setDescription("Filter by form (leave empty for all)")
						.setRequired(false)
						.setAutocomplete(true),
				)
				.addStringOption(opt =>
					opt.setName("status")
						.setDescription("Filter by status")
						.setRequired(false)
						.addChoices(
							{ name: "Pending", value: "pending" },
							{ name: "Approved", value: "approved" },
							{ name: "Rejected", value: "rejected" },
						),
				)
				.addIntegerOption(opt =>
					opt.setName("limit")
						.setDescription("Number of responses to show (default: 10)")
						.setMinValue(1)
						.setMaxValue(25)
						.setRequired(false),
				),
		)
		.addSubcommand(sub =>
			sub.setName("view")
				.setDescription("View a specific response")
				.addStringOption(opt =>
					opt.setName("response_id")
						.setDescription("Response ID")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("approve")
				.setDescription("Approve a form response")
				.addStringOption(opt =>
					opt.setName("response_id")
						.setDescription("Response ID")
						.setRequired(true),
				)
				.addStringOption(opt =>
					opt.setName("notes")
						.setDescription("Optional notes for the applicant")
						.setRequired(false),
				),
		)
		.addSubcommand(sub =>
			sub.setName("reject")
				.setDescription("Reject a form response")
				.addStringOption(opt =>
					opt.setName("response_id")
						.setDescription("Response ID")
						.setRequired(true),
				)
				.addStringOption(opt =>
					opt.setName("notes")
						.setDescription("Optional notes for the applicant")
						.setRequired(false),
				),
		)
		.addSubcommand(sub =>
			sub.setName("delete")
				.setDescription("Delete a form response")
				.addStringOption(opt =>
					opt.setName("response_id")
						.setDescription("Response ID")
						.setRequired(true),
				),
		),

	async autocomplete (interaction) {
		try {
			const Forms = interaction.client.database.models.forms;
			const serverDocument = await interaction.client.getServerDocument(interaction.guild.id);

			const forms = await Forms.find({ server_id: serverDocument._id })
				.sort({ name: 1 })
				.exec();

			const focusedValue = interaction.options.getFocused().toLowerCase();
			const filtered = forms
				.filter(f => f.name.toLowerCase().includes(focusedValue))
				.slice(0, 25)
				.map(f => ({
					name: f.name,
					value: f._id.toString(),
				}));

			await interaction.respond(filtered);
		} catch (err) {
			logger.error("Form autocomplete error:", err);
			await interaction.respond([]);
		}
	},

	async execute (interaction) {
		const subcommand = interaction.options.getSubcommand();
		const serverDocument = await interaction.client.getServerDocument(interaction.guild.id);

		switch (subcommand) {
			case "list":
				return this.listResponses(interaction, serverDocument);
			case "view":
				return this.viewResponse(interaction, serverDocument);
			case "approve":
				return this.approveResponse(interaction, serverDocument);
			case "reject":
				return this.rejectResponse(interaction, serverDocument);
			case "delete":
				return this.deleteResponse(interaction, serverDocument);
			default:
				return interaction.reply({
					content: "❌ Unknown subcommand.",
					ephemeral: true,
				});
		}
	},

	async listResponses (interaction, serverDocument) {
		try {
			const formId = interaction.options.getString("form");
			const status = interaction.options.getString("status");
			const limit = interaction.options.getInteger("limit") || 10;

			const FormResponses = interaction.client.database.models.formResponses;
			const Forms = interaction.client.database.models.forms;

			const query = { server_id: serverDocument._id };
			if (formId) query.form_id = formId;
			if (status) query.status = status;

			const responses = await FormResponses.find(query)
				.sort({ submitted_at: -1 })
				.limit(limit)
				.exec();

			if (responses.length === 0) {
				return interaction.reply({
					embeds: [{
						color: 0x3498db,
						title: "📬 Form Responses",
						description: "No responses found matching your criteria.",
					}],
					ephemeral: true,
				});
			}

			const formCache = new Map();
			const responseList = await Promise.all(responses.map(async (r, i) => {
				let formName = "Unknown";
				if (!formCache.has(r.form_id.toString())) {
					const form = await Forms.findOne({ _id: r.form_id }).exec();
					formCache.set(r.form_id.toString(), form?.name || "Unknown");
				}
				formName = formCache.get(r.form_id.toString());

				const statusIcon = {
					pending: "⏳",
					approved: "✅",
					rejected: "❌",
				}[r.status] || "❓";

				const date = new Date(r.submitted_at).toLocaleDateString();
				return `**${i + 1}.** ${statusIcon} **${formName}**\n   └ <@${r.user_id}> • ${date} • ID: \`${r._id}\``;
			}));

			return interaction.reply({
				embeds: [{
					color: 0x3498db,
					title: "📬 Form Responses",
					description: responseList.join("\n"),
					footer: {
						text: `Showing ${responses.length} response(s) • Use /formresponses view <id> for details`,
					},
				}],
				ephemeral: true,
			});
		} catch (err) {
			logger.error("Error listing responses:", err);
			return interaction.reply({
				content: "❌ Failed to list responses.",
				ephemeral: true,
			});
		}
	},

	async viewResponse (interaction, serverDocument) {
		try {
			const responseId = interaction.options.getString("response_id");

			const FormResponses = interaction.client.database.models.formResponses;
			const Forms = interaction.client.database.models.forms;

			const response = await FormResponses.findOne({ _id: responseId, server_id: serverDocument._id }).exec();

			if (!response) {
				return interaction.reply({
					content: "❌ Response not found.",
					ephemeral: true,
				});
			}

			const form = await Forms.findOne({ _id: response.form_id }).exec();
			if (!form) {
				return interaction.reply({
					content: "❌ Associated form not found.",
					ephemeral: true,
				});
			}

			const statusColors = {
				pending: 0xf39c12,
				approved: 0x2ecc71,
				rejected: 0xe74c3c,
			};

			const statusEmoji = {
				pending: "⏳",
				approved: "✅",
				rejected: "❌",
			};

			const fields = [];

			if (response.responses && Array.isArray(response.responses)) {
				response.responses.forEach(r => {
					const field = form.fields?.find(f => f.id === r.field_id);
					const fieldName = field?.label || "Unknown Field";
					fields.push({
						name: fieldName,
						value: r.value || "*No response*",
						inline: false,
					});
				});
			}

			fields.push({
				name: "📊 Status",
				value: `${statusEmoji[response.status]} ${response.status.charAt(0).toUpperCase() + response.status.slice(1)}`,
				inline: true,
			});

			fields.push({
				name: "📅 Submitted",
				value: `<t:${Math.floor(new Date(response.submitted_at).getTime() / 1000)}:R>`,
				inline: true,
			});

			if (response.reviewed_by && response.reviewed_at) {
				fields.push({
					name: "👤 Reviewed By",
					value: `<@${response.reviewed_by}>`,
					inline: true,
				});
			}

			if (response.review_notes) {
				fields.push({
					name: "📝 Review Notes",
					value: response.review_notes,
					inline: false,
				});
			}

			const components = [];
			if (response.status === "pending") {
				components.push(
					new ActionRowBuilder().addComponents(
						new ButtonBuilder()
							.setCustomId(`formresponse_approve_${responseId}`)
							.setLabel("Approve")
							.setStyle(ButtonStyle.Success),
						new ButtonBuilder()
							.setCustomId(`formresponse_reject_${responseId}`)
							.setLabel("Reject")
							.setStyle(ButtonStyle.Danger),
					),
				);
			}

			return interaction.reply({
				embeds: [{
					color: statusColors[response.status] || 0x95a5a6,
					title: `📋 ${form.name} - Response`,
					description: `Submitted by <@${response.user_id}>`,
					fields,
					footer: {
						text: `Response ID: ${response._id}`,
					},
				}],
				components,
				ephemeral: true,
			});
		} catch (err) {
			logger.error("Error viewing response:", err);
			return interaction.reply({
				content: "❌ Failed to view response.",
				ephemeral: true,
			});
		}
	},

	async approveResponse (interaction, _serverDocument) {
		try {
			const responseId = interaction.options.getString("response_id");
			const notes = interaction.options.getString("notes");

			const formBuilder = interaction.client.formBuilder;
			if (!formBuilder) {
				return interaction.reply({
					content: "❌ Form Builder system is not available.",
					ephemeral: true,
				});
			}

			await formBuilder.reviewResponse(responseId, interaction.user.id, "approved", notes);

			return interaction.reply({
				embeds: [{
					color: 0x2ecc71,
					description: `✅ Response **${responseId}** has been approved.`,
				}],
				ephemeral: true,
			});
		} catch (err) {
			logger.error("Error approving response:", err);
			return interaction.reply({
				content: `❌ Failed to approve response: ${err.message}`,
				ephemeral: true,
			});
		}
	},

	async rejectResponse (interaction, _serverDocument) {
		try {
			const responseId = interaction.options.getString("response_id");
			const notes = interaction.options.getString("notes");

			const formBuilder = interaction.client.formBuilder;
			if (!formBuilder) {
				return interaction.reply({
					content: "❌ Form Builder system is not available.",
					ephemeral: true,
				});
			}

			await formBuilder.reviewResponse(responseId, interaction.user.id, "rejected", notes);

			return interaction.reply({
				embeds: [{
					color: 0xe74c3c,
					description: `❌ Response **${responseId}** has been rejected.`,
				}],
				ephemeral: true,
			});
		} catch (err) {
			logger.error("Error rejecting response:", err);
			return interaction.reply({
				content: `❌ Failed to reject response: ${err.message}`,
				ephemeral: true,
			});
		}
	},

	async deleteResponse (interaction, serverDocument) {
		try {
			const responseId = interaction.options.getString("response_id");

			const FormResponses = interaction.client.database.models.formResponses;
			const response = await FormResponses.findOne({ _id: responseId, server_id: serverDocument._id }).exec();

			if (!response) {
				return interaction.reply({
					content: "❌ Response not found.",
					ephemeral: true,
				});
			}

			await FormResponses.delete({ _id: responseId });

			return interaction.reply({
				embeds: [{
					color: 0x95a5a6,
					description: `🗑️ Response **${responseId}** has been deleted.`,
				}],
				ephemeral: true,
			});
		} catch (err) {
			logger.error("Error deleting response:", err);
			return interaction.reply({
				content: "❌ Failed to delete response.",
				ephemeral: true,
			});
		}
	},
};
