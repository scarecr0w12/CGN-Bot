const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("tag")
		.setDescription("Manage custom tags")
		.addSubcommand(sub =>
			sub.setName("get")
				.setDescription("Get a tag")
				.addStringOption(opt =>
					opt.setName("name")
						.setDescription("Tag name")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("create")
				.setDescription("Create a tag")
				.addStringOption(opt =>
					opt.setName("name")
						.setDescription("Tag name")
						.setRequired(true),
				)
				.addStringOption(opt =>
					opt.setName("content")
						.setDescription("Tag content")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("delete")
				.setDescription("Delete a tag")
				.addStringOption(opt =>
					opt.setName("name")
						.setDescription("Tag name")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("list")
				.setDescription("List all tags"),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

	async execute (interaction, client, serverDocument) {
		const subcommand = interaction.options.getSubcommand();
		const serverQueryDocument = serverDocument.query;
		const tags = serverDocument.config.tags || [];

		switch (subcommand) {
			case "get": {
				const name = interaction.options.getString("name").toLowerCase();
				const tag = tags.find(t => t.name === name);

				if (!tag) {
					return interaction.reply({
						content: `Tag \`${name}\` not found!`,
						ephemeral: true,
					});
				}

				return interaction.reply({
					content: tag.content,
					allowedMentions: { parse: [] },
				});
			}

			case "create": {
				const name = interaction.options.getString("name").toLowerCase();
				const content = interaction.options.getString("content");

				if (tags.some(t => t.name === name)) {
					return interaction.reply({
						content: `Tag \`${name}\` already exists!`,
						ephemeral: true,
					});
				}

				serverQueryDocument.push("config.tags", {
					name: name,
					content: content,
					author_id: interaction.user.id,
					created_at: Date.now(),
				});
				await serverDocument.save();

				return interaction.reply({
					content: `✅ Created tag \`${name}\`!`,
					ephemeral: true,
				});
			}

			case "delete": {
				const name = interaction.options.getString("name").toLowerCase();
				const tag = tags.find(t => t.name === name);

				if (!tag) {
					return interaction.reply({
						content: `Tag \`${name}\` not found!`,
						ephemeral: true,
					});
				}

				// Check permissions
				const adminLevel = client.getUserBotAdmin(interaction.guild, serverDocument, interaction.member);
				if (tag.author_id !== interaction.user.id && adminLevel < 1) {
					return interaction.reply({
						content: "You can only delete your own tags!",
						ephemeral: true,
					});
				}

				serverQueryDocument.pull("config.tags", tag);
				await serverDocument.save();

				return interaction.reply({
					content: `🗑️ Deleted tag \`${name}\`!`,
					ephemeral: true,
				});
			}

			case "list": {
				if (tags.length === 0) {
					return interaction.reply({
						content: "No tags found!",
						ephemeral: true,
					});
				}

				const list = tags.map(t => `\`${t.name}\``).join(", ");

				return interaction.reply({
					embeds: [{
						color: 0x3669FA,
						title: "📝 Server Tags",
						description: list,
						footer: { text: `${tags.length} tag(s)` },
					}],
				});
			}

			default:
				return interaction.reply({ content: "Unknown subcommand", ephemeral: true });
		}
	},
};
