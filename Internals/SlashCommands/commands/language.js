const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const I18n = require("../../../Modules/I18n");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("language")
		.setDescription("Change bot language for yourself or the server")
		.addSubcommand(subcommand =>
			subcommand
				.setName("user")
				.setDescription("Set your personal language preference")
				.addStringOption(option =>
					option
						.setName("lang")
						.setDescription("Language to use")
						.setRequired(true)
						.addChoices(
							{ name: "🇺🇸 English", value: "en" },
							{ name: "🇪🇸 Español", value: "es" },
							{ name: "🇫🇷 Français", value: "fr" },
							{ name: "🇩🇪 Deutsch", value: "de" },
							{ name: "🇧🇷 Português", value: "pt" },
							{ name: "🇯🇵 日本語", value: "ja" },
							{ name: "🇰🇷 한국어", value: "ko" },
							{ name: "🇨🇳 中文", value: "zh" },
							{ name: "🇷🇺 Русский", value: "ru" },
							{ name: "🇮🇹 Italiano", value: "it" },
						),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName("server")
				.setDescription("Set the default language for this server (Admin only)")
				.addStringOption(option =>
					option
						.setName("lang")
						.setDescription("Language to use")
						.setRequired(true)
						.addChoices(
							{ name: "🇺🇸 English", value: "en" },
							{ name: "🇪🇸 Español", value: "es" },
							{ name: "🇫🇷 Français", value: "fr" },
							{ name: "🇩🇪 Deutsch", value: "de" },
							{ name: "🇧🇷 Português", value: "pt" },
							{ name: "🇯🇵 日本語", value: "ja" },
							{ name: "🇰🇷 한국어", value: "ko" },
							{ name: "🇨🇳 中文", value: "zh" },
							{ name: "🇷🇺 Русский", value: "ru" },
							{ name: "🇮🇹 Italiano", value: "it" },
						),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName("list")
				.setDescription("Show all available languages"),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName("current")
				.setDescription("Show your current language settings"),
		),

	adminLevel: 0,

	async execute (interaction, client, serverDocument) {
		const subcommand = interaction.options.getSubcommand();
		const languages = I18n.getSupportedLanguages();

		if (subcommand === "list") {
			const langList = Object.entries(languages)
				.map(([code, info]) => `${info.flag} **${info.nativeName}** (${info.name}) - \`${code}\``)
				.join("\n");

			const embed = new EmbedBuilder()
				.setColor(0x5865F2)
				.setTitle("🌐 Available Languages")
				.setDescription(langList)
				.setFooter({ text: "Use /language user <lang> to set your preference" });

			return interaction.reply({ embeds: [embed] });
		}

		if (subcommand === "current") {
			let userDocument;
			try {
				userDocument = await Users.findOne(interaction.user.id);
			} catch (_) {
				userDocument = null;
			}

			const userLang = userDocument?.preferences?.language || "en";
			const serverLang = serverDocument?.config?.language || "en";
			const userLangInfo = languages[userLang] || languages.en;
			const serverLangInfo = languages[serverLang] || languages.en;

			const embed = new EmbedBuilder()
				.setColor(0x5865F2)
				.setTitle("🌐 Language Settings")
				.addFields(
					{
						name: "👤 Your Language",
						value: `${userLangInfo.flag} ${userLangInfo.nativeName} (\`${userLang}\`)`,
						inline: true,
					},
					{
						name: "🏠 Server Language",
						value: `${serverLangInfo.flag} ${serverLangInfo.nativeName} (\`${serverLang}\`)`,
						inline: true,
					},
				)
				.setFooter({ text: "Your personal preference overrides the server default" });

			return interaction.reply({ embeds: [embed], ephemeral: true });
		}

		if (subcommand === "user") {
			const lang = interaction.options.getString("lang");

			if (!I18n.isSupported(lang)) {
				return interaction.reply({
					content: "❌ Invalid language code.",
					ephemeral: true,
				});
			}

			try {
				let userDocument = await Users.findOne(interaction.user.id);
				if (!userDocument) {
					userDocument = await Users.new({ _id: interaction.user.id });
				}

				if (!userDocument.preferences) {
					userDocument.query.set("preferences", {});
				}
				userDocument.query.prop("preferences").set("language", lang);
				await userDocument.save();

				const langInfo = languages[lang];
				const t = I18n.getTranslator(lang);

				const embed = new EmbedBuilder()
					.setColor(0x57F287)
					.setTitle(`${langInfo.flag} ${t("common:language")}`)
					.setDescription(`✅ Language set to **${langInfo.nativeName}**.`);

				return interaction.reply({ embeds: [embed], ephemeral: true });
			} catch (err) {
				logger.error("Failed to set user language", { usrid: interaction.user.id }, err);
				return interaction.reply({
					content: "❌ Failed to save language preference.",
					ephemeral: true,
				});
			}
		}

		if (subcommand === "server") {
			const memberBotAdminLevel = client.getUserBotAdmin(
				interaction.guild,
				serverDocument,
				interaction.member,
			);

			if (memberBotAdminLevel < 2) {
				return interaction.reply({
					content: "❌ You need to be a server administrator to change the server language.",
					ephemeral: true,
				});
			}

			const lang = interaction.options.getString("lang");

			if (!I18n.isSupported(lang)) {
				return interaction.reply({
					content: "❌ Invalid language code.",
					ephemeral: true,
				});
			}

			try {
				serverDocument.query.prop("config").set("language", lang);
				await serverDocument.save();

				const langInfo = languages[lang];
				const t = I18n.getTranslator(lang);

				const embed = new EmbedBuilder()
					.setColor(0x57F287)
					.setTitle(`${langInfo.flag} ${t("common:language")}`)
					.setDescription(`✅ Server language set to **${langInfo.nativeName}**.`)
					.setFooter({ text: "This affects all users without a personal language preference" });

				return interaction.reply({ embeds: [embed] });
			} catch (err) {
				logger.error("Failed to set server language", { svrid: interaction.guild.id }, err);
				return interaction.reply({
					content: "❌ Failed to save server language.",
					ephemeral: true,
				});
			}
		}
	},
};
