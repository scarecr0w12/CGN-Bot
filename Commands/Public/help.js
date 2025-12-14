const ModernHelpMenu = require("../../Modules/MessageUtils/ReactionMenus/ModernHelpMenu");

/**
 * Category configuration with colors and emojis
 */
const CATEGORY_CONFIG = {
	"SkynetBot 🤖": { emoji: "🤖", color: 0x43B581, description: "Core bot commands and utilities" },
	"AI & Assistant 🤖": { emoji: "🧠", color: 0x7289DA, description: "AI-powered chat and assistance" },
	"Fun 🎪": { emoji: "🎪", color: 0x9ECDF2, description: "Games, jokes, and entertainment" },
	"Moderation ⚒": { emoji: "⚒️", color: 0xCC0F16, description: "Server moderation tools" },
	"Search & Media 🎬": { emoji: "🎬", color: 0x50FF60, description: "Search engines and media lookups" },
	"NSFW 👹": { emoji: "🔞", color: 0xE55B0A, description: "Adult content (NSFW channels only)" },
	"Stats & Points ⭐️": { emoji: "⭐", color: 0xFFFF00, description: "Statistics and point tracking" },
	"Utility 🔦": { emoji: "🔦", color: 0x3669FA, description: "Helpful utility commands" },
	"Extensions ⚙️": { emoji: "⚙️", color: 0x00FF00, description: "Custom server extensions" },
};

/**
 * Build a modern detailed help embed for a specific command
 */
const buildCommandHelpEmbed = (commands, prefix, Colors) => {
	const fields = [];

	for (const cmd of commands) {
		fields.push({
			name: `${cmd.type} Command`,
			value: [
				`**Name:** \`${cmd.name}\``,
				cmd.description ? `**Description:** ${cmd.description}` : null,
				`**Usage:** \`${prefix}${cmd.name} ${cmd.usage || ""}\``,
				cmd.type === "Public" ? `[📖 Wiki Documentation](https://github.com/GilbertGobbels/SkynetBot/wiki/Commands#${cmd.name})` : null,
			].filter(Boolean).join("\n"),
		});
	}

	return {
		color: Colors.INFO,
		author: {
			name: "📖 Command Details",
		},
		fields,
		footer: {
			text: `Use ${prefix}help to see all available commands`,
		},
	};
};

module.exports = async ({ client, Constants: { Colors } }, { serverDocument }, msg) => {
	// Handle specific command help
	if (msg.suffix) {
		const searchTerm = msg.suffix.trim().toLowerCase();
		const foundCommands = [];

		const pmCmd = client.getPMCommandMetadata(searchTerm);
		if (pmCmd) {
			foundCommands.push({
				type: "PM",
				name: pmCmd.command,
				usage: pmCmd.usage,
				description: pmCmd.description,
			});
		}

		const publicCmd = client.getPublicCommandMetadata(searchTerm);
		if (publicCmd) {
			foundCommands.push({
				type: "Public",
				name: publicCmd.command,
				usage: publicCmd.usage,
				description: publicCmd.description,
			});
		}

		const sharedCmd = client.getSharedCommandMetadata(searchTerm);
		if (sharedCmd) {
			foundCommands.push({
				type: "Shared",
				name: sharedCmd.command,
				usage: sharedCmd.usage,
				description: sharedCmd.description,
			});
		}

		// Check extensions
		if (serverDocument.extensions.length) {
			for (const extension of serverDocument.extensions) {
				if (extension.type === "command" && searchTerm === extension.key) {
					const extensionDocument = await Gallery.findOneByObjectID(extension._id);
					if (extensionDocument) {
						const versionDocument = extensionDocument.versions.id(extension.version);
						foundCommands.push({
							type: "Extension",
							name: extension.key,
							usage: versionDocument?.usage_help,
							description: versionDocument?.extended_help,
						});
					}
					break;
				}
			}
		}

		if (foundCommands.length === 0) {
			return msg.send({
				embeds: [{
					color: Colors.LIGHT_RED,
					author: { name: "❌ Command Not Found" },
					description: `No command found matching \`${searchTerm}\``,
					footer: {
						text: `Use ${msg.guild.commandPrefix}help to see all available commands`,
					},
				}],
			});
		}

		return msg.send({
			embeds: [buildCommandHelpEmbed(foundCommands, msg.guild.commandPrefix, Colors)],
		});
	}

	// Build categories for the modern menu
	const categories = {};
	const memberBotAdminLevel = client.getUserBotAdmin(msg.guild, serverDocument, msg.member);

	// Initialize categories from config
	for (const [categoryName, config] of Object.entries(CATEGORY_CONFIG)) {
		categories[categoryName] = {
			name: categoryName.replace(/ [^\s]+$/, ""), // Remove emoji from display name
			emoji: config.emoji,
			color: config.color,
			description: config.description,
			commands: [],
		};
	}

	// Populate public commands
	for (const command of client.getPublicCommandList()) {
		const cmdData = client.getPublicCommandMetadata(command);
		if (!cmdData?.category) continue;

		// Ensure category exists
		if (!categories[cmdData.category]) {
			categories[cmdData.category] = {
				name: cmdData.category.replace(/ [^\s]+$/, ""),
				emoji: "📁",
				color: Colors.INFO,
				description: "Miscellaneous commands",
				commands: [],
			};
		}

		// Check if command is enabled and accessible
		const cmdConfig = serverDocument.config.commands[command];
		if (cmdConfig?.isEnabled &&
			memberBotAdminLevel >= (cmdConfig.admin_level || 0) &&
			!cmdConfig.disabled_channel_ids?.includes(msg.channel.id)) {
			categories[cmdData.category].commands.push({
				name: cmdData.command,
				usage: cmdData.usage,
				description: cmdData.description,
			});
		}
	}

	// Add extension commands
	if (serverDocument.extensions.length) {
		for (const extension of serverDocument.extensions) {
			if (extension.type === "command" && memberBotAdminLevel >= (extension.admin_level || 0)) {
				const extensionDocument = await Gallery.findOneByObjectID(extension._id);
				if (extensionDocument) {
					const versionDocument = extensionDocument.versions.id(extension.version);
					categories["Extensions ⚙️"].commands.push({
						name: extension.key,
						usage: versionDocument?.usage_help,
						description: versionDocument?.extended_help,
					});
				}
			}
		}
	}

	// Remove empty categories (except Extensions which we want to show if it has commands)
	for (const [key, category] of Object.entries(categories)) {
		if (category.commands.length === 0) {
			delete categories[key];
		}
	}

	// Create and initialize the modern help menu
	new ModernHelpMenu(msg, {
		categories,
		prefix: msg.guild.commandPrefix,
		timeout: 180000, // 3 minutes
	}).init();
};
