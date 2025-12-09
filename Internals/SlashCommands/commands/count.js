const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("count")
		.setDescription("Keep tallies of things")
		.addSubcommand(sub =>
			sub.setName("view")
				.setDescription("View a counter")
				.addStringOption(opt =>
					opt.setName("name")
						.setDescription("Counter name")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("add")
				.setDescription("Add to a counter")
				.addStringOption(opt =>
					opt.setName("name")
						.setDescription("Counter name")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("subtract")
				.setDescription("Subtract from a counter")
				.addStringOption(opt =>
					opt.setName("name")
						.setDescription("Counter name")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("reset")
				.setDescription("Reset a counter")
				.addStringOption(opt =>
					opt.setName("name")
						.setDescription("Counter name")
						.setRequired(true),
				),
		),

	async execute (interaction, client, serverDocument) {
		const subcommand = interaction.options.getSubcommand();
		const name = interaction.options.getString("name").toLowerCase();
		const serverQueryDocument = serverDocument.query;

		if (!serverDocument.config.counters) {
			serverQueryDocument.set("config.counters", {});
		}

		const counters = serverDocument.config.counters || {};
		const currentValue = counters[name] || 0;

		switch (subcommand) {
			case "view": {
				return interaction.reply({
					embeds: [{
						color: 0x3669FA,
						title: `📊 Counter: ${name}`,
						description: `**${currentValue}**`,
					}],
				});
			}

			case "add": {
				const newValue = currentValue + 1;
				serverQueryDocument.set(`config.counters.${name}`, newValue);
				await serverDocument.save();
				return interaction.reply({
					content: `📊 **${name}**: ${currentValue} → **${newValue}** (+1)`,
				});
			}

			case "subtract": {
				const newValue = currentValue - 1;
				serverQueryDocument.set(`config.counters.${name}`, newValue);
				await serverDocument.save();
				return interaction.reply({
					content: `📊 **${name}**: ${currentValue} → **${newValue}** (-1)`,
				});
			}

			case "reset": {
				serverQueryDocument.set(`config.counters.${name}`, 0);
				await serverDocument.save();
				return interaction.reply({
					content: `📊 **${name}** has been reset to **0**`,
				});
			}

			default:
				return interaction.reply({ content: "Unknown subcommand", ephemeral: true });
		}
	},
};
