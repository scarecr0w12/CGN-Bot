const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
	adminLevel: 1,
	data: new SlashCommandBuilder()
		.setName("list")
		.setDescription("Manage a to-do list")
		.addSubcommand(sub =>
			sub.setName("view")
				.setDescription("View the to-do list"),
		)
		.addSubcommand(sub =>
			sub.setName("add")
				.setDescription("Add an item to the list")
				.addStringOption(opt =>
					opt.setName("item")
						.setDescription("The item to add")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("done")
				.setDescription("Mark an item as done")
				.addIntegerOption(opt =>
					opt.setName("number")
						.setDescription("The item number")
						.setMinValue(1)
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("remove")
				.setDescription("Remove an item from the list")
				.addIntegerOption(opt =>
					opt.setName("number")
						.setDescription("The item number")
						.setMinValue(1)
						.setRequired(true),
				),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

	async execute (interaction, client, serverDocument) {
		const subcommand = interaction.options.getSubcommand();
		const serverQueryDocument = serverDocument.query;

		if (!serverDocument.config.todo_list) {
			serverQueryDocument.set("config.todo_list", []);
		}

		const todoList = serverDocument.config.todo_list || [];

		switch (subcommand) {
			case "view": {
				if (todoList.length === 0) {
					return interaction.reply({
						content: "📝 The to-do list is empty!",
						ephemeral: true,
					});
				}

				const list = todoList.map((item, i) => {
					const status = item.done ? "✅" : "⬜";
					return `${status} **${i + 1}.** ${item.content}`;
				}).join("\n");

				return interaction.reply({
					embeds: [{
						color: 0x3669FA,
						title: "📝 To-Do List",
						description: list,
					}],
				});
			}

			case "add": {
				const item = interaction.options.getString("item");
				serverQueryDocument.push("config.todo_list", {
					content: item,
					done: false,
					addedBy: interaction.user.id,
					addedAt: Date.now(),
				});
				await serverDocument.save();

				return interaction.reply({
					content: `✅ Added: **${item}**`,
				});
			}

			case "done": {
				const number = interaction.options.getInteger("number");
				if (number > todoList.length) {
					return interaction.reply({
						content: "That item doesn't exist!",
						ephemeral: true,
					});
				}

				serverQueryDocument.set(`config.todo_list.${number - 1}.done`, true);
				await serverDocument.save();

				return interaction.reply({
					content: `✅ Marked item **${number}** as done!`,
				});
			}

			case "remove": {
				const number = interaction.options.getInteger("number");
				if (number > todoList.length) {
					return interaction.reply({
						content: "That item doesn't exist!",
						ephemeral: true,
					});
				}

				const removed = todoList[number - 1];
				serverQueryDocument.pull("config.todo_list", removed);
				await serverDocument.save();

				return interaction.reply({
					content: `🗑️ Removed: **${removed.content}**`,
				});
			}

			default:
				return interaction.reply({ content: "Unknown subcommand", ephemeral: true });
		}
	},
};
