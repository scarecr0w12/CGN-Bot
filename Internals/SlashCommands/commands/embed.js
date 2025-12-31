const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ActionRowBuilder,
	EmbedBuilder: DiscordEmbedBuilder,
	ChannelType,
} = require("discord.js");
const { EmbedBuilder, EmbedTemplateManager } = require("../../../Modules/EmbedBuilder");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("embed")
		.setDescription("Create and manage custom embeds")
		.addSubcommandGroup(group =>
			group.setName("create")
				.setDescription("Create a new embed")
				.addSubcommand(sub =>
					sub.setName("quick")
						.setDescription("Create a simple embed with title and description")
						.addStringOption(opt =>
							opt.setName("title")
								.setDescription("Embed title")
								.setRequired(false)
								.setMaxLength(256),
						)
						.addStringOption(opt =>
							opt.setName("description")
								.setDescription("Embed description")
								.setRequired(false)
								.setMaxLength(4096),
						)
						.addStringOption(opt =>
							opt.setName("color")
								.setDescription("Embed color (hex format: #RRGGBB or color name)")
								.setRequired(false),
						)
						.addChannelOption(opt =>
							opt.setName("channel")
								.setDescription("Channel to send the embed")
								.addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
								.setRequired(false),
						),
				)
				.addSubcommand(sub =>
					sub.setName("advanced")
						.setDescription("Create an advanced embed with modal form"),
				),
		)
		.addSubcommandGroup(group =>
			group.setName("template")
				.setDescription("Manage embed templates")
				.addSubcommand(sub =>
					sub.setName("save")
						.setDescription("Save current embed as a template")
						.addStringOption(opt =>
							opt.setName("name")
								.setDescription("Template name")
								.setRequired(true)
								.setMaxLength(100),
						)
						.addStringOption(opt =>
							opt.setName("description")
								.setDescription("Template description")
								.setMaxLength(200),
						),
				)
				.addSubcommand(sub =>
					sub.setName("list")
						.setDescription("List all saved embed templates"),
				)
				.addSubcommand(sub =>
					sub.setName("load")
						.setDescription("Load and send a template")
						.addStringOption(opt =>
							opt.setName("template_id")
								.setDescription("Template ID")
								.setRequired(true),
						)
						.addChannelOption(opt =>
							opt.setName("channel")
								.setDescription("Channel to send the embed")
								.addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
						),
				)
				.addSubcommand(sub =>
					sub.setName("delete")
						.setDescription("Delete a template")
						.addStringOption(opt =>
							opt.setName("template_id")
								.setDescription("Template ID")
								.setRequired(true),
						),
				),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

	async execute (interaction, client) {
		const subcommandGroup = interaction.options.getSubcommandGroup();
		const subcommand = interaction.options.getSubcommand();
		const templateManager = new EmbedTemplateManager(client.database);

		if (subcommandGroup === "create") {
			if (subcommand === "quick") {
				const title = interaction.options.getString("title");
				const description = interaction.options.getString("description");
				const color = interaction.options.getString("color");
				const channel = interaction.options.getChannel("channel") || interaction.channel;

				if (!title && !description) {
					return interaction.reply({
						content: "❌ You must provide at least a title or description!",
						ephemeral: true,
					});
				}

				const embedData = {};
				if (title) embedData.title = title;
				if (description) embedData.description = description;
				if (color) embedData.color = EmbedBuilder.parseColor(color);

				const validation = EmbedBuilder.validate(embedData);
				if (!validation.valid) {
					return interaction.reply({
						content: `❌ Validation errors:\n${validation.errors.join("\n")}`,
						ephemeral: true,
					});
				}

				const embed = EmbedBuilder.createFromData(embedData);

				try {
					await channel.send({ embeds: [embed] });
					return interaction.reply({
						content: `✅ Embed sent to ${channel}!`,
						ephemeral: true,
					});
				} catch (error) {
					return interaction.reply({
						content: `❌ Failed to send embed: ${error.message}`,
						ephemeral: true,
					});
				}
			}

			if (subcommand === "advanced") {
				const modal = new ModalBuilder()
					.setCustomId(`embed_builder_${interaction.user.id}`)
					.setTitle("Advanced Embed Builder");

				const titleInput = new TextInputBuilder()
					.setCustomId("embed_title")
					.setLabel("Title (optional)")
					.setStyle(TextInputStyle.Short)
					.setMaxLength(256)
					.setRequired(false);

				const descriptionInput = new TextInputBuilder()
					.setCustomId("embed_description")
					.setLabel("Description (optional)")
					.setStyle(TextInputStyle.Paragraph)
					.setMaxLength(4096)
					.setRequired(false);

				const colorInput = new TextInputBuilder()
					.setCustomId("embed_color")
					.setLabel("Color (hex: #RRGGBB)")
					.setStyle(TextInputStyle.Short)
					.setPlaceholder("#5865F2")
					.setMaxLength(7)
					.setRequired(false);

				const footerInput = new TextInputBuilder()
					.setCustomId("embed_footer")
					.setLabel("Footer Text (optional)")
					.setStyle(TextInputStyle.Short)
					.setMaxLength(2048)
					.setRequired(false);

				const imageInput = new TextInputBuilder()
					.setCustomId("embed_image")
					.setLabel("Image URL (optional)")
					.setStyle(TextInputStyle.Short)
					.setPlaceholder("https://example.com/image.png")
					.setRequired(false);

				modal.addComponents(
					new ActionRowBuilder().addComponents(titleInput),
					new ActionRowBuilder().addComponents(descriptionInput),
					new ActionRowBuilder().addComponents(colorInput),
					new ActionRowBuilder().addComponents(footerInput),
					new ActionRowBuilder().addComponents(imageInput),
				);

				return interaction.showModal(modal);
			}
		}

		if (subcommandGroup === "template") {
			if (subcommand === "save") {
				// This would be called after creating an embed
				// For now, show a message directing users to the dashboard
				const message = [
					"💡 To save embed templates, use the `/embed create quick` or `/embed create advanced`",
					"commands first, then use the dashboard to save them as templates.",
					"\n\nAlternatively, visit the dashboard at: https://your-bot-url.com/dashboard to use the visual embed builder.",
				].join(" ");

				return interaction.reply({
					content: message,
					ephemeral: true,
				});
			}

			if (subcommand === "list") {
				const templates = await templateManager.getServerTemplates(interaction.guildId, 10);

				if (templates.length === 0) {
					return interaction.reply({
						content: "📝 No embed templates found for this server.\n\nCreate templates using the dashboard or save embeds after creating them!",
						ephemeral: true,
					});
				}

				const embed = new DiscordEmbedBuilder()
					.setTitle("📋 Embed Templates")
					.setDescription(`Found ${templates.length} template(s)`)
					.setColor(0x5865F2)
					.setTimestamp();

				templates.forEach(template => {
					embed.addFields({
						name: template.name,
						value: `ID: \`${template._id}\`\n${template.description || "No description"}\nUsed: ${template.use_count} times`,
						inline: true,
					});
				});

				return interaction.reply({ embeds: [embed], ephemeral: true });
			}

			if (subcommand === "load") {
				const templateId = interaction.options.getString("template_id");
				const channel = interaction.options.getChannel("channel") || interaction.channel;

				const template = await templateManager.getTemplate(templateId);

				if (!template) {
					return interaction.reply({
						content: "❌ Template not found!",
						ephemeral: true,
					});
				}

				if (template.server_id !== interaction.guildId) {
					return interaction.reply({
						content: "❌ This template belongs to another server!",
						ephemeral: true,
					});
				}

				// Replace variables
				const variables = {
					user: interaction.user.username,
					user_mention: `<@${interaction.user.id}>`,
					server: interaction.guild.name,
					channel: channel.name,
					member_count: interaction.guild.memberCount,
				};

				const embedData = EmbedBuilder.replaceVariables(template.embed_data, variables);
				const embed = EmbedBuilder.createFromData(embedData);

				try {
					await channel.send({ embeds: [embed] });
					await templateManager.incrementUseCount(templateId);

					return interaction.reply({
						content: `✅ Template "${template.name}" sent to ${channel}!`,
						ephemeral: true,
					});
				} catch (error) {
					return interaction.reply({
						content: `❌ Failed to send embed: ${error.message}`,
						ephemeral: true,
					});
				}
			}

			if (subcommand === "delete") {
				const templateId = interaction.options.getString("template_id");
				const template = await templateManager.getTemplate(templateId);

				if (!template) {
					return interaction.reply({
						content: "❌ Template not found!",
						ephemeral: true,
					});
				}

				if (template.server_id !== interaction.guildId) {
					return interaction.reply({
						content: "❌ This template belongs to another server!",
						ephemeral: true,
					});
				}

				// Only template creator or admins can delete
				const member = await interaction.guild.members.fetch(interaction.user.id);
				const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
				const isCreator = template.created_by === interaction.user.id;

				if (!isAdmin && !isCreator) {
					return interaction.reply({
						content: "❌ Only the template creator or administrators can delete this template!",
						ephemeral: true,
					});
				}

				await templateManager.deleteTemplate(templateId);

				return interaction.reply({
					content: `✅ Template "${template.name}" has been deleted!`,
					ephemeral: true,
				});
			}
		}

		return interaction.reply({
			content: "❌ Unknown subcommand!",
			ephemeral: true,
		});
	},
};
