const {
	ActionRowBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require("discord.js");
const { Colors } = require("../../../Internals/Constants");

/**
 * Modern help menu using Discord's component system (select menus + buttons)
 * Replaces the legacy reaction-based HelpMenu
 */
class ModernHelpMenu {
	constructor (originalMsg, options = {}) {
		this.originalMsg = originalMsg;
		this.msg = null;
		this.collector = null;

		this.defaultEmbed = options.defaultEmbed || {};
		this.categories = options.categories || {};
		this.prefix = options.prefix || "!";
		this.timeout = options.timeout || 180000; // 3 minutes default
	}

	/**
	 * Build the category select menu
	 */
	buildSelectMenu (disabled = false) {
		const select = new StringSelectMenuBuilder()
			.setCustomId("help_category_select")
			.setPlaceholder("📚 Select a command category...")
			.setDisabled(disabled);

		for (const [categoryKey, categoryData] of Object.entries(this.categories)) {
			if (!categoryData.commands || categoryData.commands.length === 0) continue;

			select.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel(categoryData.name)
					.setDescription(`${categoryData.commands.length} command${categoryData.commands.length !== 1 ? "s" : ""} available`)
					.setValue(categoryKey)
					.setEmoji(categoryData.emoji),
			);
		}

		return select;
	}

	/**
	 * Build the navigation buttons
	 */
	buildButtons (disabled = false) {
		const homeButton = new ButtonBuilder()
			.setCustomId("help_home")
			.setLabel("Home")
			.setStyle(ButtonStyle.Primary)
			.setEmoji("🏠")
			.setDisabled(disabled);

		const closeButton = new ButtonBuilder()
			.setCustomId("help_close")
			.setLabel("Close")
			.setStyle(ButtonStyle.Danger)
			.setEmoji("✖️")
			.setDisabled(disabled);

		return new ActionRowBuilder().addComponents(homeButton, closeButton);
	}

	/**
	 * Build the embed for the home/main page
	 */
	buildHomeEmbed () {
		const categoryList = Object.entries(this.categories)
			.filter(([, data]) => data.commands && data.commands.length > 0)
			.map(([, data]) => `${data.emoji} **${data.name}** — ${data.commands.length} command${data.commands.length !== 1 ? "s" : ""}`)
			.join("\n");

		return {
			color: Colors.INFO,
			author: {
				name: "📖 Command Help Menu",
				iconURL: this.originalMsg.client.user.displayAvatarURL(),
			},
			description: [
				`Welcome! Use the **dropdown menu** below to browse commands by category.`,
				``,
				`**Prefix:** \`${this.prefix}\``,
				`**Tip:** Use \`${this.prefix}help <command>\` for detailed info about a specific command.`,
			].join("\n"),
			fields: [
				{
					name: "📂 Categories",
					value: categoryList || "No categories available",
				},
				{
					name: "🔗 Quick Links",
					value: [
						`• [Command Wiki](https://github.com/GilbertGobbels/SkynetBot/wiki/Commands)`,
						`• [Support Server](${configJS.discordLink || "https://discord.gg/SE6xHmvKrZ"})`,
					].join("\n"),
					inline: true,
				},
				{
					name: "⏱️ Menu Timeout",
					value: `This menu expires <t:${Math.floor((Date.now() + this.timeout) / 1000)}:R>`,
					inline: true,
				},
			],
			footer: {
				text: "Select a category from the dropdown to view commands",
			},
		};
	}

	/**
	 * Build the embed for a specific category
	 */
	buildCategoryEmbed (categoryKey) {
		const category = this.categories[categoryKey];
		if (!category) return this.buildHomeEmbed();

		// Format commands in a clean, modern way
		const commandList = category.commands
			.sort((a, b) => a.name.localeCompare(b.name))
			.map(cmd => {
				const usage = cmd.usage ? ` \`${cmd.usage}\`` : "";
				return `\`${this.prefix}${cmd.name}\`${usage}`;
			})
			.join("\n");

		// Split into multiple fields if too long
		const fields = [];
		const chunks = this.chunkString(commandList, 1000);

		chunks.forEach((chunk, index) => {
			fields.push({
				name: index === 0 ? `${category.emoji} Commands` : "​", // Zero-width space for continuation
				value: chunk || "No commands available",
			});
		});

		return {
			color: category.color || Colors.INFO,
			author: {
				name: `📖 ${category.name}`,
				iconURL: this.originalMsg.client.user.displayAvatarURL(),
			},
			description: category.description || `Browse ${category.commands.length} commands in this category.`,
			fields,
			footer: {
				text: `${category.commands.length} command${category.commands.length !== 1 ? "s" : ""} • Use ${this.prefix}help <command> for details`,
			},
		};
	}

	/**
	 * Split a string into chunks
	 */
	chunkString (str, size) {
		if (!str) return [""];
		const lines = str.split("\n");
		const chunks = [];
		let current = "";

		for (const line of lines) {
			if (`${current}\n${line}`.length > size) {
				if (current) chunks.push(current);
				current = line;
			} else {
				current = current ? `${current}\n${line}` : line;
			}
		}
		if (current) chunks.push(current);
		return chunks.length ? chunks : [""];
	}

	/**
	 * Build the expired embed
	 */
	buildExpiredEmbed () {
		return {
			color: Colors.LIGHT_ORANGE,
			description: `⏱️ This help menu has expired. Run \`${this.prefix}help\` again to open a new one.`,
		};
	}

	/**
	 * Initialize and display the help menu
	 */
	async init () {
		const selectRow = new ActionRowBuilder().addComponents(this.buildSelectMenu());
		const buttonRow = this.buildButtons();

		this.msg = await this.originalMsg.channel.send({
			embeds: [this.buildHomeEmbed()],
			components: [selectRow, buttonRow],
		});

		this.collector = this.msg.createMessageComponentCollector({
			filter: i => i.user.id === this.originalMsg.author.id,
			time: this.timeout,
		});

		this.collector.on("collect", async interaction => {
			try {
				await this.handleInteraction(interaction);
			} catch (err) {
				logger.debug("Failed to handle help menu interaction", { msgid: this.msg?.id }, err);
			}
		});

		this.collector.on("end", async () => {
			await this.handleEnd();
		});

		return this;
	}

	/**
	 * Handle component interactions
	 */
	async handleInteraction (interaction) {
		if (interaction.customId === "help_close") {
			this.collector.stop("closed");
			return;
		}

		if (interaction.customId === "help_home") {
			await interaction.update({
				embeds: [this.buildHomeEmbed()],
				components: [
					new ActionRowBuilder().addComponents(this.buildSelectMenu()),
					this.buildButtons(),
				],
			});
			return;
		}

		if (interaction.customId === "help_category_select") {
			const categoryKey = interaction.values[0];
			await interaction.update({
				embeds: [this.buildCategoryEmbed(categoryKey)],
				components: [
					new ActionRowBuilder().addComponents(this.buildSelectMenu()),
					this.buildButtons(),
				],
			});
		}
	}

	/**
	 * Handle collector end
	 */
	async handleEnd () {
		try {
			// Skip if channel is no longer cached (e.g., guild was deleted)
			if (!this.msg?.channel) {
				return;
			}
			// Disable all components
			await this.msg.edit({
				embeds: [this.buildExpiredEmbed()],
				components: [
					new ActionRowBuilder().addComponents(this.buildSelectMenu(true)),
					this.buildButtons(true),
				],
			});
		} catch (err) {
			logger.debug("Failed to update expired help menu", { msgid: this.msg?.id }, err);
		}

		this.msg = null;
		this.collector = null;
	}
}

module.exports = ModernHelpMenu;
