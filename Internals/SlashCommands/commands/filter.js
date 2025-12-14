const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
	adminLevel: 2,
	data: new SlashCommandBuilder()
		.setName("filter")
		.setDescription("Manage word filter for auto-moderation")
		.addSubcommand(sub =>
			sub.setName("add")
				.setDescription("Add word(s) to the filter")
				.addStringOption(opt =>
					opt.setName("words")
						.setDescription("Word(s) to filter (comma-separated for multiple)")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("remove")
				.setDescription("Remove word(s) from the filter")
				.addStringOption(opt =>
					opt.setName("words")
						.setDescription("Word(s) to remove (comma-separated for multiple)")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("list")
				.setDescription("View all filtered words"),
		)
		.addSubcommand(sub =>
			sub.setName("clear")
				.setDescription("Clear all filtered words"),
		)
		.addSubcommand(sub =>
			sub.setName("enable")
				.setDescription("Enable the word filter"),
		)
		.addSubcommand(sub =>
			sub.setName("disable")
				.setDescription("Disable the word filter"),
		)
		.addSubcommand(sub =>
			sub.setName("action")
				.setDescription("Set action for filter violations")
				.addStringOption(opt =>
					opt.setName("action")
						.setDescription("Action to take")
						.setRequired(true)
						.addChoices(
							{ name: "None (warn only)", value: "none" },
							{ name: "Block from bot", value: "block" },
							{ name: "Mute in channel", value: "mute" },
							{ name: "Kick from server", value: "kick" },
							{ name: "Ban from server", value: "ban" },
						),
				),
		)
		.addSubcommand(sub =>
			sub.setName("import")
				.setDescription("Import a preset word list")
				.addStringOption(opt =>
					opt.setName("preset")
						.setDescription("Preset list to import")
						.setRequired(true)
						.addChoices(
							{ name: "Profanity (English)", value: "profanity_en" },
							{ name: "Slurs", value: "slurs" },
							{ name: "Spam keywords", value: "spam" },
						),
				),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

	async execute (interaction, client, serverDocument) {
		const subcommand = interaction.options.getSubcommand();
		const serverQueryDocument = serverDocument.query;
		const customFilter = serverDocument.config.moderation?.filters?.custom_filter || {};
		const currentKeywords = customFilter.keywords || [];

		switch (subcommand) {
			case "add": {
				const wordsInput = interaction.options.getString("words");
				const newWords = wordsInput.split(",")
					.map(w => w.trim().toLowerCase())
					.filter(w => w.length > 0 && !currentKeywords.includes(w));

				if (newWords.length === 0) {
					return interaction.reply({
						content: "⚠️ All specified words are already in the filter!",
						ephemeral: true,
					});
				}

				const updatedKeywords = [...currentKeywords, ...newWords];
				serverQueryDocument.set("config.moderation.filters.custom_filter.keywords", updatedKeywords);
				await serverDocument.save();

				return interaction.reply({
					content: `✅ Added **${newWords.length}** word(s) to the filter: \`${newWords.join("`, `")}\``,
					ephemeral: true,
				});
			}

			case "remove": {
				const wordsInput = interaction.options.getString("words");
				const wordsToRemove = wordsInput.split(",")
					.map(w => w.trim().toLowerCase())
					.filter(w => w.length > 0);

				const removedWords = wordsToRemove.filter(w => currentKeywords.includes(w));
				if (removedWords.length === 0) {
					return interaction.reply({
						content: "⚠️ None of the specified words are in the filter!",
						ephemeral: true,
					});
				}

				const updatedKeywords = currentKeywords.filter(w => !wordsToRemove.includes(w));
				serverQueryDocument.set("config.moderation.filters.custom_filter.keywords", updatedKeywords);
				await serverDocument.save();

				return interaction.reply({
					content: `✅ Removed **${removedWords.length}** word(s) from the filter: \`${removedWords.join("`, `")}\``,
					ephemeral: true,
				});
			}

			case "list": {
				if (currentKeywords.length === 0) {
					return interaction.reply({
						content: "📝 The word filter is empty. Use `/filter add` to add words.",
						ephemeral: true,
					});
				}

				const wordList = currentKeywords.map(w => `\`${w}\``).join(", ");
				const truncated = wordList.length > 1900 ? `${wordList.substring(0, 1900)}...` : wordList;

				return interaction.reply({
					embeds: [{
						color: 0x3669FA,
						title: "📝 Filtered Words",
						description: truncated,
						footer: { text: `Total: ${currentKeywords.length} word(s) | Status: ${customFilter.isEnabled ? "Enabled" : "Disabled"}` },
					}],
					ephemeral: true,
				});
			}

			case "clear": {
				serverQueryDocument.set("config.moderation.filters.custom_filter.keywords", []);
				await serverDocument.save();

				return interaction.reply({
					content: `✅ Cleared **${currentKeywords.length}** word(s) from the filter!`,
					ephemeral: true,
				});
			}

			case "enable": {
				serverQueryDocument.set("config.moderation.filters.custom_filter.isEnabled", true);
				await serverDocument.save();

				return interaction.reply({
					content: "✅ Word filter has been **enabled**!",
					ephemeral: true,
				});
			}

			case "disable": {
				serverQueryDocument.set("config.moderation.filters.custom_filter.isEnabled", false);
				await serverDocument.save();

				return interaction.reply({
					content: "❌ Word filter has been **disabled**!",
					ephemeral: true,
				});
			}

			case "action": {
				const action = interaction.options.getString("action");
				serverQueryDocument.set("config.moderation.filters.custom_filter.action", action);
				await serverDocument.save();

				return interaction.reply({
					content: `✅ Filter violation action set to **${action}**!`,
					ephemeral: true,
				});
			}

			case "import": {
				const preset = interaction.options.getString("preset");
				let presetWords = [];

				switch (preset) {
					case "profanity_en":
						presetWords = [
							"fuck", "shit", "ass", "bitch", "damn", "crap", "piss",
							"dick", "cock", "pussy", "bastard", "slut", "whore",
						];
						break;
					case "slurs":
						presetWords = [
							"retard", "retarded", "fag", "faggot", "tranny",
						];
						break;
					case "spam":
						presetWords = [
							"free nitro", "discord nitro free", "steam gift",
							"click here", "bit.ly", "tinyurl", "discord.gg",
							"@everyone", "airdrop", "giveaway link",
						];
						break;
				}

				const newWords = presetWords.filter(w => !currentKeywords.includes(w.toLowerCase()));
				if (newWords.length === 0) {
					return interaction.reply({
						content: "⚠️ All words from this preset are already in the filter!",
						ephemeral: true,
					});
				}

				const updatedKeywords = [...currentKeywords, ...newWords.map(w => w.toLowerCase())];
				serverQueryDocument.set("config.moderation.filters.custom_filter.keywords", updatedKeywords);
				await serverDocument.save();

				const presetName = preset === "profanity_en" ? "Profanity (English)" :
					preset === "slurs" ? "Slurs" : "Spam keywords";

				return interaction.reply({
					content: `✅ Imported **${newWords.length}** word(s) from the "${presetName}" preset!`,
					ephemeral: true,
				});
			}

			default:
				return interaction.reply({ content: "Unknown subcommand", ephemeral: true });
		}
	},
};
