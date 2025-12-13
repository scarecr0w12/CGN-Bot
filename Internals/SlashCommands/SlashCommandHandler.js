const { Collection, REST, Routes, ApplicationCommandOptionType } = require("discord.js");
const fs = require("fs-nextra");
const { readdir } = require("fs/promises");
const { join } = require("path");

const IsolatedSandbox = require("../Extensions/API/IsolatedSandbox");
const { ServerTicketManager } = require("../../Modules/index");

class SlashCommandHandler {
	constructor (client) {
		this.client = client;
		this.commands = new Collection();
		this.commandsDir = join(__dirname, "commands");
	}

	_getRest () {
		const token = process.env.CLIENT_TOKEN;
		if (!token) return null;
		return new REST({ version: "10" }).setToken(token);
	}

	_getClientId () {
		return this.client.application?.id || this.client.user?.id || null;
	}

	_mapSlashOptionType (type) {
		switch (String(type || "").toLowerCase()) {
			case "string": return ApplicationCommandOptionType.String;
			case "integer": return ApplicationCommandOptionType.Integer;
			case "number": return ApplicationCommandOptionType.Number;
			case "boolean": return ApplicationCommandOptionType.Boolean;
			case "user": return ApplicationCommandOptionType.User;
			case "channel": return ApplicationCommandOptionType.Channel;
			case "role": return ApplicationCommandOptionType.Role;
			case "mentionable": return ApplicationCommandOptionType.Mentionable;
			case "attachment": return ApplicationCommandOptionType.Attachment;
			default: return null;
		}
	}

	_buildSlashOptions (rawOptions) {
		if (!Array.isArray(rawOptions)) return [];
		return rawOptions.map(opt => {
			const type = this._mapSlashOptionType(opt.type);
			if (!type) return null;
			const name = String(opt.name || "").toLowerCase();
			const description = String(opt.description || "");
			if (!name || !description) return null;

			const built = {
				type,
				name,
				description,
				required: Boolean(opt.required),
			};

			if (Array.isArray(opt.choices)) {
				built.choices = opt.choices
					.filter(c => c && typeof c.name === "string" && Object.prototype.hasOwnProperty.call(c, "value"))
					.map(c => ({ name: c.name, value: c.value }));
			}

			if (Object.prototype.hasOwnProperty.call(opt, "autocomplete")) {
				built.autocomplete = Boolean(opt.autocomplete);
			}

			if (Object.prototype.hasOwnProperty.call(opt, "min_value") || Object.prototype.hasOwnProperty.call(opt, "minValue")) {
				built.min_value = opt.min_value ?? opt.minValue;
			}
			if (Object.prototype.hasOwnProperty.call(opt, "max_value") || Object.prototype.hasOwnProperty.call(opt, "maxValue")) {
				built.max_value = opt.max_value ?? opt.maxValue;
			}
			if (Object.prototype.hasOwnProperty.call(opt, "min_length") || Object.prototype.hasOwnProperty.call(opt, "minLength")) {
				built.min_length = opt.min_length ?? opt.minLength;
			}
			if (Object.prototype.hasOwnProperty.call(opt, "max_length") || Object.prototype.hasOwnProperty.call(opt, "maxLength")) {
				built.max_length = opt.max_length ?? opt.maxLength;
			}
			if (Array.isArray(opt.channel_types) || Array.isArray(opt.channelTypes)) {
				built.channel_types = opt.channel_types ?? opt.channelTypes;
			}

			return built;
		}).filter(Boolean);
	}

	_isValidCommandName (name) {
		return /^[a-z0-9_-]{1,32}$/.test(String(name || ""));
	}

	async syncExtensionGuildCommands (guildId) {
		const rest = this._getRest();
		const clientId = this._getClientId();
		if (!rest || !clientId || !guildId) return;

		let serverDocument;
		try {
			serverDocument = await Servers.findOne(guildId);
		} catch (err) {
			logger.warn("Failed to load server document for extension command sync.", { svrid: guildId }, err);
			return;
		}
		if (!serverDocument) return;

		const usedNames = new Set();
		this.commands.forEach(cmd => usedNames.add(cmd.data?.name));
		const commandsBody = [];
		const serverQuery = serverDocument.query;

		for (const extConfig of serverDocument.extensions || []) {
			if (!extConfig || !extConfig._id) continue;
			const statusQuery = serverQuery.id("extensions", extConfig._id).prop("status");
			statusQuery.set("code", 0).set("description", null);

			let extensionDocument;
			try {
				extensionDocument = await Gallery.findOneByObjectID(extConfig._id);
			} catch (_) {
				extensionDocument = null;
			}
			if (!extensionDocument) continue;
			const versionDocument = extensionDocument.versions?.id(extConfig.version);
			if (!versionDocument || versionDocument.type !== "slash" || !versionDocument.accepted) continue;

			const name = String(versionDocument.key || "").toLowerCase();
			if (!this._isValidCommandName(name)) {
				statusQuery.set("code", 2).set("description", "Invalid slash command name.");
				continue;
			}
			if (!versionDocument.slash_description || typeof versionDocument.slash_description !== "string") {
				statusQuery.set("code", 2).set("description", "Missing slash command description.");
				continue;
			}
			if (usedNames.has(name)) {
				statusQuery.set("code", 2).set("description", "Slash command name collides with another command.");
				continue;
			}

			usedNames.add(name);
			commandsBody.push({
				name,
				description: versionDocument.slash_description,
				options: this._buildSlashOptions(versionDocument.slash_options),
			});
		}

		try {
			await serverDocument.save();
		} catch (_) {
			// ignore status save failures
		}

		try {
			await rest.put(
				Routes.applicationGuildCommands(clientId, guildId),
				{ body: commandsBody },
			);
			logger.info(`Synced ${commandsBody.length} extension guild slash commands`, { svrid: guildId });
		} catch (err) {
			logger.warn("Failed to sync extension guild slash commands", { svrid: guildId }, err);
		}
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

		// Get server document
		const serverDocument = await Servers.findOne(interaction.guild.id);
		if (!serverDocument) {
			return interaction.reply({
				content: "Failed to load server configuration.",
				ephemeral: true,
			});
		}

		if (!command) {
			// Try extension slash commands
			const extConfig = (serverDocument.extensions || []).find(e => e && e.key && e.key.toLowerCase() === interaction.commandName.toLowerCase());
			if (!extConfig) {
				return interaction.reply({
					content: "This command is not available.",
					ephemeral: true,
				});
			}

			const userAdminLevel = this.client.getUserBotAdmin(interaction.guild, serverDocument, interaction.member);
			if ((extConfig.admin_level || 0) > 0 && userAdminLevel < (extConfig.admin_level || 0)) {
				return interaction.reply({
					content: "You don't have permission to use this command.",
					ephemeral: true,
				});
			}

			let extensionDocument;
			try {
				extensionDocument = await Gallery.findOneByObjectID(extConfig._id);
			} catch (_) {
				extensionDocument = null;
			}
			if (!extensionDocument) {
				return interaction.reply({ content: "This command is not available.", ephemeral: true });
			}
			const versionDocument = extensionDocument.versions?.id(extConfig.version);
			if (!versionDocument || versionDocument.type !== "slash" || !versionDocument.accepted) {
				return interaction.reply({ content: "This command is not available.", ephemeral: true });
			}

			let code;
			try {
				const basePath = `${__dirname}/../../extensions/${versionDocument.code_id}`;
				code = await fs.readFile(`${basePath}.skyext`, "utf8");
			} catch (err) {
				logger.error("Failed to load extension code for slash command", { svrid: interaction.guild.id, extid: extConfig._id }, err);
				return interaction.reply({ content: "This command is not available.", ephemeral: true });
			}

			const context = {
				extensionDocument,
				versionDocument,
				serverDocument,
				extensionConfigDocument: serverDocument.extensions.id(extConfig._id),
				client: this.client,
				guild: interaction.guild,
				interaction,
			};

			const sandbox = new IsolatedSandbox(this.client, context, versionDocument.scopes || []);
			try {
				await sandbox.initialize(versionDocument.timeout || 5000);
				const result = await sandbox.run(code, versionDocument.timeout || 5000);
				const statusQuery = serverDocument.query.id("extensions", extConfig._id).prop("status");
				if (result.success || !result.err) {
					statusQuery.set("code", 0).set("description", null);
				} else {
					statusQuery.set("code", 2).set("description", result.err.message || "Something went wrong!");
				}
				await serverDocument.save();
				if (!result.success && !interaction.replied && !interaction.deferred) {
					await interaction.reply({ content: "An error occurred while executing this command.", ephemeral: true });
				}
			} catch (err) {
				logger.error("Error executing slash extension", { svrid: interaction.guild.id, extid: extConfig._id }, err);
				if (!interaction.replied && !interaction.deferred) {
					await interaction.reply({ content: "An error occurred while executing this command.", ephemeral: true });
				}
			} finally {
				sandbox.dispose();
			}
			return;
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

	/**
	 * Handle button interactions (for ticket system and other components)
	 * @param {ButtonInteraction} interaction
	 */
	async handleButtonInteraction (interaction) {
		if (!interaction.isButton()) return;

		const customId = interaction.customId;

		// Handle ticket-related buttons
		if (customId.startsWith("ticket_")) {
			await this.handleTicketButton(interaction);
			return;
		}

		// Other button handlers can be added here
	}

	/**
	 * Handle ticket-related button interactions
	 * @param {ButtonInteraction} interaction
	 */
	async handleTicketButton (interaction) {
		const customId = interaction.customId;
		const parts = customId.split("_");
		const action = parts[1]; // create, close, claim

		// Get server document
		const serverDocument = await Servers.findOne(interaction.guild.id);
		if (!serverDocument) {
			return interaction.reply({
				content: "Failed to load server configuration.",
				ephemeral: true,
			});
		}

		// Initialize server ticket manager
		if (!this.client.serverTicketManager) {
			this.client.serverTicketManager = new ServerTicketManager(this.client);
		}

		const ticketManager = this.client.serverTicketManager;

		// Check if ticket system is enabled
		if (!ticketManager.isEnabled(serverDocument)) {
			return interaction.reply({
				content: "The ticket system is not available on this server.",
				ephemeral: true,
			});
		}

		try {
			if (action === "create") {
				// Format: ticket_create_{panelId}_{categoryId}
				const categoryId = parts[3] || "general";

				await interaction.deferReply({ ephemeral: true });

				const { channel } = await ticketManager.createTicket(
					interaction.guild,
					serverDocument,
					interaction.member,
					categoryId,
					"",
				);

				await interaction.editReply({
					content: `Your ticket has been created: <#${channel.id}>`,
				});
			} else if (action === "close") {
				// Format: ticket_close_{ticketId}
				const ticketId = parts.slice(2).join("_");

				// Check permissions
				const ticket = await global.ServerTickets.findOne(ticketId);
				if (!ticket) {
					return interaction.reply({
						content: "Ticket not found.",
						ephemeral: true,
					});
				}

				const isOwner = ticket.user_id === interaction.user.id;
				const memberBotAdminLevel = this.client.getUserBotAdmin(
					interaction.guild,
					serverDocument,
					interaction.member,
				);
				const isStaff = memberBotAdminLevel >= 1 ||
					(serverDocument.tickets?.support_roles || []).some(r =>
						interaction.member.roles.cache.has(r),
					);

				if (!isOwner && !isStaff) {
					return interaction.reply({
						content: "Only the ticket owner or staff can close this ticket.",
						ephemeral: true,
					});
				}

				await interaction.deferReply({ ephemeral: true });
				await ticketManager.closeTicket(
					interaction.guild,
					serverDocument,
					ticketId,
					interaction.user,
					"Closed via button",
				);

				await interaction.editReply({
					content: "Ticket is being closed...",
				});
			} else if (action === "claim") {
				// Format: ticket_claim_{ticketId}
				const ticketId = parts.slice(2).join("_");

				// Check staff permissions
				const memberBotAdminLevel = this.client.getUserBotAdmin(
					interaction.guild,
					serverDocument,
					interaction.member,
				);
				const isStaff = memberBotAdminLevel >= 1 ||
					(serverDocument.tickets?.support_roles || []).some(r =>
						interaction.member.roles.cache.has(r),
					);

				if (!isStaff) {
					return interaction.reply({
						content: "Only staff can claim tickets.",
						ephemeral: true,
					});
				}

				await interaction.deferReply({ ephemeral: true });
				const ticket = await ticketManager.claimTicket(
					interaction.guild,
					ticketId,
					interaction.member,
				);

				await interaction.editReply({
					content: `You have claimed ticket #${ticket.ticket_number}.`,
				});

				// Update the original message to show claimed status
				try {
					await interaction.message.edit({
						embeds: interaction.message.embeds,
						components: [],
					});
				} catch {
					// May not have permission
				}
			}
		} catch (err) {
			const errorReply = {
				content: `Error: ${err.message}`,
				ephemeral: true,
			};

			if (interaction.deferred) {
				await interaction.editReply(errorReply);
			} else if (!interaction.replied) {
				await interaction.reply(errorReply);
			}
		}
	}
}

module.exports = SlashCommandHandler;
