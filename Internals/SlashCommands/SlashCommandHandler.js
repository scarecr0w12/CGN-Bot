const { Collection, REST, Routes } = require("discord.js");
const { readdir } = require("fs/promises");
const { join } = require("path");

class SlashCommandHandler {
	constructor (client) {
		this.client = client;
		this.commands = new Collection();
		this.commandsDir = join(__dirname, "commands");
	}

	/**
	 * Load all slash command definitions
	 */
	async loadCommands () {
		try {
			const files = await readdir(this.commandsDir);
			for (const file of files) {
				if (!file.endsWith(".js") || file.startsWith("_")) continue;
				const command = require(join(this.commandsDir, file));
				if (command.data && command.execute) {
					this.commands.set(command.data.name, command);
					logger.debug(`Loaded slash command: ${command.data.name}`);
				}
			}
			logger.info(`Loaded ${this.commands.size} slash commands`);
		} catch (err) {
			logger.error("Failed to load slash commands", {}, err);
		}
	}

	/**
	 * Register slash commands with Discord API
	 * @param {string} token - Bot token
	 * @param {string} clientId - Bot client ID
	 * @param {string} [guildId] - Optional guild ID for guild-specific commands
	 */
	async registerCommands (token, clientId, guildId = null) {
		const rest = new REST({ version: "10" }).setToken(token);
		const commandsData = this.commands.map(cmd => cmd.data.toJSON());

		try {
			logger.info(`Registering ${commandsData.length} slash commands...`);

			if (guildId) {
				// Guild-specific commands (faster for testing)
				await rest.put(
					Routes.applicationGuildCommands(clientId, guildId),
					{ body: commandsData },
				);
				logger.info(`Registered ${commandsData.length} guild slash commands`);
			} else {
				// Global commands
				await rest.put(
					Routes.applicationCommands(clientId),
					{ body: commandsData },
				);
				logger.info(`Registered ${commandsData.length} global slash commands`);
			}
		} catch (err) {
			logger.error("Failed to register slash commands", {}, err);
		}
	}

	/**
	 * Handle an incoming slash command interaction
	 * @param {Interaction} interaction
	 */
	async handleInteraction (interaction) {
		if (!interaction.isChatInputCommand()) return;

		const command = this.commands.get(interaction.commandName);
		if (!command) {
			return interaction.reply({
				content: "This command is not available.",
				ephemeral: true,
			});
		}

		// Get server document
		const serverDocument = await Servers.findOne(interaction.guild.id);
		if (!serverDocument) {
			return interaction.reply({
				content: "Failed to load server configuration.",
				ephemeral: true,
			});
		}

		// Check admin level if required
		if (command.adminLevel && command.adminLevel > 0) {
			const userAdminLevel = this.client.getUserBotAdmin(
				interaction.guild,
				serverDocument,
				interaction.member,
			);
			if (userAdminLevel < command.adminLevel) {
				return interaction.reply({
					content: "You don't have permission to use this command.",
					ephemeral: true,
				});
			}
		}

		try {
			await command.execute(interaction, this.client, serverDocument);
		} catch (err) {
			logger.error(`Error executing slash command ${interaction.commandName}`, {
				svrid: interaction.guild.id,
				usrid: interaction.user.id,
			}, err);

			const errorReply = {
				content: "An error occurred while executing this command.",
				ephemeral: true,
			};

			if (interaction.replied || interaction.deferred) {
				await interaction.followUp(errorReply);
			} else {
				await interaction.reply(errorReply);
			}
		}
	}
}

module.exports = SlashCommandHandler;
