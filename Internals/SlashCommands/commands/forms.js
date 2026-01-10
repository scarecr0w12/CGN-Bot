const { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const Logger = require("../../Logger");
const logger = new Logger("FormsCommand");

module.exports = {
	name: "forms",
	adminLevel: 2,
	data: new SlashCommandBuilder()
		.setName("forms")
		.setDescription("Manage custom application forms for your server")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addSubcommand(sub =>
			sub.setName("list")
				.setDescription("List all forms in this server"),
		)
		.addSubcommand(sub =>
			sub.setName("create")
				.setDescription("Create a new form (use dashboard for advanced configuration)"),
		)
		.addSubcommand(sub =>
			sub.setName("toggle")
				.setDescription("Enable or disable a form")
				.addStringOption(opt =>
					opt.setName("form")
						.setDescription("Form name or ID")
						.setRequired(true)
						.setAutocomplete(true),
				)
				.addBooleanOption(opt =>
					opt.setName("enabled")
						.setDescription("Enable or disable the form")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("delete")
				.setDescription("Delete a form")
				.addStringOption(opt =>
					opt.setName("form")
						.setDescription("Form name or ID")
						.setRequired(true)
						.setAutocomplete(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("info")
				.setDescription("View details about a form")
				.addStringOption(opt =>
					opt.setName("form")
						.setDescription("Form name or ID")
						.setRequired(true)
						.setAutocomplete(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("stats")
				.setDescription("View form response statistics")
				.addStringOption(opt =>
					opt.setName("form")
						.setDescription("Form name or ID (leave empty for all forms)")
						.setRequired(false)
						.setAutocomplete(true),
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
					name: `${f.name} ${f.enabled ? "✅" : "❌"}`,
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
				return this.listForms(interaction, serverDocument);
			case "create":
				return this.createForm(interaction, serverDocument);
			case "toggle":
				return this.toggleForm(interaction, serverDocument);
			case "delete":
				return this.deleteForm(interaction, serverDocument);
			case "info":
				return this.showInfo(interaction, serverDocument);
			case "stats":
				return this.showStats(interaction, serverDocument);
			default:
				return interaction.reply({
					content: "❌ Unknown subcommand.",
					ephemeral: true,
				});
		}
	},

	async listForms (interaction, serverDocument) {
		try {
			const Forms = interaction.client.database.models.forms;
			const forms = await Forms.find({ server_id: serverDocument._id })
				.sort({ created_at: -1 })
				.exec();

			if (forms.length === 0) {
				return interaction.reply({
					embeds: [{
						color: 0x3498db,
						title: "📋 Forms",
						description: "No forms found. Create one using `/forms create` or the [dashboard](https://skynetbot.net/dashboard).",
					}],
					ephemeral: true,
				});
			}

			const tier = serverDocument.tier || "free";
			const tierLimits = { free: 2, starter: 5, premium: -1 };
			const maxForms = tierLimits[tier] || 0;

			const formsList = forms.map((f, i) => {
				const status = f.enabled ? "✅" : "❌";
				const fields = f.fields?.length || 0;
				return `**${i + 1}.** ${status} **${f.name}**\n   └ ${fields} field${fields !== 1 ? "s" : ""} • ID: \`${f._id}\``;
			}).join("\n");

			return interaction.reply({
				embeds: [{
					color: 0x3498db,
					title: "📋 Server Forms",
					description: formsList,
					footer: {
						text: `${forms.length}/${maxForms === -1 ? "∞" : maxForms} forms used • Use /forms info <form> for details`,
					},
				}],
				ephemeral: true,
			});
		} catch (err) {
			logger.error("Error listing forms:", err);
			return interaction.reply({
				content: "❌ Failed to list forms.",
				ephemeral: true,
			});
		}
	},

	async createForm (interaction, serverDocument) {
		try {
			const formBuilder = interaction.client.formBuilder;
			if (!formBuilder) {
				return interaction.reply({
					content: "❌ Form Builder system is not available.",
					ephemeral: true,
				});
			}

			const tier = serverDocument.tier || "free";
			const tierLimits = { free: 2, starter: 5, premium: -1 };
			const maxForms = tierLimits[tier] || 0;

			const Forms = interaction.client.database.models.forms;
			const currentCount = await Forms.find({ server_id: serverDocument._id }).exec().then(f => f.length);

			if (maxForms !== -1 && currentCount >= maxForms) {
				return interaction.reply({
					embeds: [{
						color: 0xe74c3c,
						title: "❌ Form Limit Reached",
						description: `Your server has reached the maximum of **${maxForms}** forms.\n\n**Upgrade your tier for more:**\n• Tier 1: 5 forms\n• Tier 2: Unlimited forms`,
					}],
					ephemeral: true,
				});
			}

			const modal = new ModalBuilder()
				.setCustomId("form_create_modal")
				.setTitle("Create New Form");

			const nameInput = new TextInputBuilder()
				.setCustomId("form_name")
				.setLabel("Form Name")
				.setStyle(TextInputStyle.Short)
				.setRequired(true)
				.setMaxLength(100)
				.setPlaceholder("e.g., Staff Application");

			const descInput = new TextInputBuilder()
				.setCustomId("form_description")
				.setLabel("Description")
				.setStyle(TextInputStyle.Paragraph)
				.setRequired(false)
				.setMaxLength(500)
				.setPlaceholder("Brief description of this form");

			modal.addComponents(
				new ActionRowBuilder().addComponents(nameInput),
				new ActionRowBuilder().addComponents(descInput),
			);

			await interaction.showModal(modal);
		} catch (err) {
			logger.error("Error showing create form modal:", err);
			return interaction.reply({
				content: "❌ Failed to show form creation modal.",
				ephemeral: true,
			});
		}
	},

	async toggleForm (interaction, serverDocument) {
		try {
			const formId = interaction.options.getString("form");
			const enabled = interaction.options.getBoolean("enabled");

			const Forms = interaction.client.database.models.forms;
			const form = await Forms.findOne({ _id: formId, server_id: serverDocument._id }).exec();

			if (!form) {
				return interaction.reply({
					content: "❌ Form not found.",
					ephemeral: true,
				});
			}

			await Forms.update(
				{ _id: formId },
				{ enabled, updated_at: new Date() },
			);

			return interaction.reply({
				embeds: [{
					color: enabled ? 0x2ecc71 : 0x95a5a6,
					description: `${enabled ? "✅" : "❌"} Form **${form.name}** has been ${enabled ? "enabled" : "disabled"}.`,
				}],
				ephemeral: true,
			});
		} catch (err) {
			logger.error("Error toggling form:", err);
			return interaction.reply({
				content: "❌ Failed to toggle form.",
				ephemeral: true,
			});
		}
	},

	async deleteForm (interaction, serverDocument) {
		try {
			const formId = interaction.options.getString("form");

			const Forms = interaction.client.database.models.forms;
			const form = await Forms.findOne({ _id: formId, server_id: serverDocument._id }).exec();

			if (!form) {
				return interaction.reply({
					content: "❌ Form not found.",
					ephemeral: true,
				});
			}

			await Forms.delete({ _id: formId });

			const FormResponses = interaction.client.database.models.formResponses;
			await FormResponses.delete({ form_id: formId });

			return interaction.reply({
				embeds: [{
					color: 0xe74c3c,
					description: `🗑️ Form **${form.name}** and all its responses have been deleted.`,
				}],
				ephemeral: true,
			});
		} catch (err) {
			logger.error("Error deleting form:", err);
			return interaction.reply({
				content: "❌ Failed to delete form.",
				ephemeral: true,
			});
		}
	},

	async showInfo (interaction, serverDocument) {
		try {
			const formId = interaction.options.getString("form");

			const Forms = interaction.client.database.models.forms;
			const FormResponses = interaction.client.database.models.formResponses;

			const form = await Forms.findOne({ _id: formId, server_id: serverDocument._id }).exec();

			if (!form) {
				return interaction.reply({
					content: "❌ Form not found.",
					ephemeral: true,
				});
			}

			const totalResponses = await FormResponses.find({ form_id: formId }).exec().then(r => r.length);
			const pendingResponses = await FormResponses.find({ form_id: formId, status: "pending" }).exec().then(r => r.length);

			const fields = [
				{
					name: "📊 Status",
					value: form.enabled ? "✅ Enabled" : "❌ Disabled",
					inline: true,
				},
				{
					name: "📝 Fields",
					value: `${form.fields?.length || 0} field(s)`,
					inline: true,
				},
				{
					name: "📬 Responses",
					value: `${totalResponses} total (${pendingResponses} pending)`,
					inline: true,
				},
			];

			if (form.submit_channel) {
				fields.push({
					name: "📨 Submit Channel",
					value: `<#${form.submit_channel}>`,
					inline: true,
				});
			}

			if (form.review_channel) {
				fields.push({
					name: "👀 Review Channel",
					value: `<#${form.review_channel}>`,
					inline: true,
				});
			}

			if (form.auto_role_id) {
				fields.push({
					name: "🎭 Auto-assign Role",
					value: `<@&${form.auto_role_id}>`,
					inline: true,
				});
			}

			return interaction.reply({
				embeds: [{
					color: 0x3498db,
					title: `📋 ${form.name}`,
					description: form.description || "*No description*",
					fields,
					footer: {
						text: `ID: ${form._id} • Created ${new Date(form.created_at).toLocaleDateString()}`,
					},
				}],
				ephemeral: true,
			});
		} catch (err) {
			logger.error("Error showing form info:", err);
			return interaction.reply({
				content: "❌ Failed to retrieve form information.",
				ephemeral: true,
			});
		}
	},

	async showStats (interaction, serverDocument) {
		try {
			const formId = interaction.options.getString("form");
			const FormResponses = interaction.client.database.models.formResponses;

			const query = { server_id: serverDocument._id };
			let title = "📊 All Forms Statistics";

			if (formId) {
				const Forms = interaction.client.database.models.forms;
				const form = await Forms.findOne({ _id: formId, server_id: serverDocument._id }).exec();

				if (!form) {
					return interaction.reply({
						content: "❌ Form not found.",
						ephemeral: true,
					});
				}

				query.form_id = formId;
				title = `📊 ${form.name} Statistics`;
			}

			const responses = await FormResponses.find(query).exec();

			const monthStart = new Date();
			monthStart.setDate(1);
			monthStart.setHours(0, 0, 0, 0);

			const thisMonth = responses.filter(r => new Date(r.submitted_at) >= monthStart).length;
			const pending = responses.filter(r => r.status === "pending").length;
			const approved = responses.filter(r => r.status === "approved").length;
			const rejected = responses.filter(r => r.status === "rejected").length;

			const tier = serverDocument.tier || "free";
			const tierLimits = { free: 50, starter: 200, premium: -1 };
			const maxMonthly = tierLimits[tier] || 50;

			return interaction.reply({
				embeds: [{
					color: 0x3498db,
					title,
					fields: [
						{
							name: "📈 This Month",
							value: `${thisMonth}/${maxMonthly === -1 ? "∞" : maxMonthly}`,
							inline: true,
						},
						{
							name: "📋 Total Responses",
							value: `${responses.length}`,
							inline: true,
						},
						{
							name: "⏳ Pending",
							value: `${pending}`,
							inline: true,
						},
						{
							name: "✅ Approved",
							value: `${approved}`,
							inline: true,
						},
						{
							name: "❌ Rejected",
							value: `${rejected}`,
							inline: true,
						},
						{
							name: "📊 Approval Rate",
							value: responses.length > 0 ? `${Math.round((approved / responses.length) * 100)}%` : "N/A",
							inline: true,
						},
					],
				}],
				ephemeral: true,
			});
		} catch (err) {
			logger.error("Error showing form stats:", err);
			return interaction.reply({
				content: "❌ Failed to retrieve statistics.",
				ephemeral: true,
			});
		}
	},
};
