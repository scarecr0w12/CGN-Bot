const ivm = require("isolated-vm");
const {
	Errors: {
		Error: SkynetError,
	},
	Constants: {
		Scopes,
	},
} = require("../../index");

/**
 * Creates an isolated sandbox environment for running extensions using isolated-vm.
 * This replaces the vulnerable vm2 package with a secure V8 isolate.
 */
class IsolatedSandbox {
	/**
	 * @param {ExtensionManager} rawClient - The extension manager client
	 * @param {Object} context - The extension context
	 * @param {Array} scopes - The allowed scopes for this extension
	 */
	constructor (rawClient, context, scopes) {
		this.rawClient = rawClient;
		this.context = context;
		this.scopes = scopes;
		this.isolate = null;
		this.vmContext = null;
	}

	/**
	 * Initialize the isolated environment
	 * @param {Number} timeout - Maximum execution time in milliseconds
	 * @returns {Promise<void>}
	 */
	async initialize (_timeout = 5000) {
		// Create isolate with memory limit (128MB default)
		this.isolate = new ivm.Isolate({ memoryLimit: 128 });
		this.vmContext = await this.isolate.createContext();

		const jail = this.vmContext.global;

		// Set up the global object
		await jail.set("global", jail.derefInto());

		// Set up the require function
		await this._setupRequire(jail);

		// Set up console.log (limited)
		await this._setupConsole(jail);
	}

	/**
	 * Set up the custom require function in the isolate
	 * @param {ivm.Reference} jail - The global reference
	 * @private
	 */
	async _setupRequire (jail) {
		// Build the modules map for serialization
		const modulesData = this._buildModulesData();

		// Pass serializable module data to the isolate
		await jail.set("__modulesData__", new ivm.ExternalCopy(modulesData).copyInto());

		// Create callbacks for dynamic module resolution
		const requireCallback = new ivm.Callback((name) => this._resolveModule(name));
		await jail.set("__requireCallback__", requireCallback);

		// Set up economy/points write callbacks
		await this._setupPointsCallbacks(jail);

		// Set up the require function in the isolate
		await this.vmContext.eval(`
			const require = (name) => {
				const moduleData = __modulesData__[name];
				if (!moduleData) {
					throw new Error("Unknown module: " + name);
				}
				if (moduleData.needsCallback) {
					let module = __requireCallback__(name);
					
					// Wrap points/economy module with callback functions
					if (name === 'points' || name === 'economy') {
						module = {
							...module,
							// Read methods (from serialized data)
							getSelf: () => module.self,
							getLeaderboard: (limit) => module._leaderboardData.slice(0, limit || 10),
							getRanks: () => module.ranks,
							getStats: () => module.stats,
							getTotalMembers: () => module.totalMembers,
							
							// Write methods (via callbacks)
							addPoints: (userId, amount, reason) => {
								const result = __pointsAddCallback__(userId, amount, reason || 'Extension');
								return JSON.parse(result);
							},
							removePoints: (userId, amount, reason) => {
								const result = __pointsRemoveCallback__(userId, amount, reason || 'Extension');
								return JSON.parse(result);
							},
							transfer: (fromUserId, toUserId, amount, reason) => {
								const result = __pointsTransferCallback__(fromUserId, toUserId, amount, reason || 'Transfer');
								return JSON.parse(result);
							},
							setPoints: (userId, amount, reason) => {
								const result = __pointsSetCallback__(userId, amount, reason || 'Set by extension');
								return JSON.parse(result);
							},
							getUser: (userId) => {
								const result = __pointsGetCallback__(userId);
								return JSON.parse(result);
							},
						};
					}
					return module;
				}
				return moduleData.value;
			};
		`);
	}

	/**
	 * Set up callbacks for points/economy write operations
	 * @param {ivm.Reference} jail - The global reference
	 * @private
	 */
	async _setupPointsCallbacks (jail) {
		const createPointsModule = require("./Modules/Points");
		const pointsModule = createPointsModule(this.context, this.scopes);

		// Store reference for use in callbacks
		this._pointsModule = pointsModule;

		// Create callbacks for write operations
		const addPointsCallback = new ivm.Callback((userId, amount, reason) => {
			try {
				return JSON.stringify(pointsModule.addPoints(userId, amount, reason));
			} catch (err) {
				return JSON.stringify({ success: false, error: err.message });
			}
		});

		const removePointsCallback = new ivm.Callback((userId, amount, reason) => {
			try {
				return JSON.stringify(pointsModule.removePoints(userId, amount, reason));
			} catch (err) {
				return JSON.stringify({ success: false, error: err.message });
			}
		});

		const transferPointsCallback = new ivm.Callback((fromUserId, toUserId, amount, reason) => {
			try {
				return JSON.stringify(pointsModule.transfer(fromUserId, toUserId, amount, reason));
			} catch (err) {
				return JSON.stringify({ success: false, error: err.message });
			}
		});

		const setPointsCallback = new ivm.Callback((userId, amount, reason) => {
			try {
				return JSON.stringify(pointsModule.setPoints(userId, amount, reason));
			} catch (err) {
				return JSON.stringify({ success: false, error: err.message });
			}
		});

		const getPointsCallback = new ivm.Callback((userId) => {
			try {
				return JSON.stringify(pointsModule.getUser(userId));
			} catch (err) {
				return JSON.stringify({ found: false, error: err.message });
			}
		});

		await jail.set("__pointsAddCallback__", addPointsCallback);
		await jail.set("__pointsRemoveCallback__", removePointsCallback);
		await jail.set("__pointsTransferCallback__", transferPointsCallback);
		await jail.set("__pointsSetCallback__", setPointsCallback);
		await jail.set("__pointsGetCallback__", getPointsCallback);
	}

	/**
	 * Build serializable module data for the isolate
	 * @returns {Object} Module data map
	 * @private
	 */
	_buildModulesData () {
		const { extensionDocument, versionDocument, msg, serverDocument, extensionConfigDocument } = this.context;
		const modules = {};

		// Command module data
		if (versionDocument.type === "command") {
			modules.command = {
				value: {
					prefix: serverDocument.config.command_prefix,
					suffix: msg?.suffix?.trim() || "",
					key: extensionConfigDocument.key,
				},
			};
		}

		// Keyword module data
		if (versionDocument.type === "keyword" && extensionConfigDocument.keywords) {
			modules.keyword = {
				value: {
					keywords: extensionConfigDocument.keywords,
				},
			};
		}

		// Extension info
		modules.extension = {
			value: {
				name: extensionDocument.name,
				version: versionDocument.version,
				type: versionDocument.type,
			},
		};

		// Mark complex modules that need callback resolution
		modules.message = { needsCallback: true };
		modules.channel = { needsCallback: true };
		modules.guild = { needsCallback: true };
		modules.config = { needsCallback: true };
		modules.bot = { needsCallback: true };
		modules.event = { needsCallback: true };
		modules.moment = { needsCallback: true };
		modules.rss = { needsCallback: true };
		modules.fetch = { needsCallback: true };
		modules.xmlparser = { needsCallback: true };

		// New modules
		modules.utils = { needsCallback: true };
		modules.member = { needsCallback: true };
		modules.user = { needsCallback: true };
		modules.author = { needsCallback: true };
		modules.roles = { needsCallback: true };
		modules.embed = { needsCallback: true };
		modules.points = { needsCallback: true };
		modules.economy = { needsCallback: true }; // Alias for points

		return modules;
	}

	/**
	 * Resolve a module by name (called from isolate via callback)
	 * @param {String} name - Module name
	 * @returns {*} The resolved module value
	 * @private
	 */
	_resolveModule (name) {
		const { msg, guild, serverDocument, eventData } = this.context;
		const { scopes } = this;
		const { rawClient } = this;
		const Utils = require("./Modules/Utils");

		switch (name) {
			case "message":
				if (!msg) throw new SkynetError("UNKNOWN_MODULE", name);
				return this._serializeMessage(msg);
			case "channel":
				if (!msg) throw new SkynetError("UNKNOWN_MODULE", name);
				if (!scopes.includes(Scopes.channels_read.scope)) throw new SkynetError("MISSING_SCOPES");
				return this._serializeChannel(msg.channel);
			case "guild":
				if (!scopes.includes(Scopes.guild_read.scope)) throw new SkynetError("MISSING_SCOPES");
				return this._serializeGuild(guild);
			case "config":
				if (!scopes.includes(Scopes.config.scope)) throw new SkynetError("MISSING_SCOPES");
				return JSON.parse(JSON.stringify(serverDocument.config));
			case "bot":
				return this._serializeBot(rawClient, guild, serverDocument);
			case "event":
				if (!eventData) throw new SkynetError("UNKNOWN_MODULE", name);
				return this._serializeEvent(eventData);
			case "moment":
				// Return current timestamp - moment functions can't be passed
				return { now: Date.now() };
			case "utils":
				// Return utility functions
				return Utils.getSerializableFunctions();
			case "member":
				if (!msg || !msg.member) throw new SkynetError("UNKNOWN_MODULE", name);
				if (!scopes.includes(Scopes.members_read.scope)) throw new SkynetError("MISSING_SCOPES");
				return this._serializeMember(msg.member);
			case "user":
			case "author":
				if (!msg) throw new SkynetError("UNKNOWN_MODULE", name);
				return this._serializeUser(msg.author);
			case "roles":
				if (!scopes.includes(Scopes.roles_read.scope)) throw new SkynetError("MISSING_SCOPES");
				return this._serializeRoles(guild);
			case "embed":
				// Return embed builder helper
				return this._getEmbedHelper();
			case "points":
			case "economy": {
				// Return points/economy module
				const createPointsModule = require("./Modules/Points");
				const pointsModule = createPointsModule(this.context, scopes);
				return this._serializePointsModule(pointsModule);
			}
			case "rss":
			case "fetch":
			case "xmlparser":
				// These require async operations - return a marker
				return { available: false, reason: "Async modules not available in isolated-vm" };
			default:
				throw new SkynetError("UNKNOWN_MODULE", name);
		}
	}

	/**
	 * Serialize a message for the isolate
	 * @param {Message} msg
	 * @returns {Object}
	 * @private
	 */
	_serializeMessage (msg) {
		return {
			id: msg.id,
			content: msg.content,
			author: {
				id: msg.author.id,
				username: msg.author.username,
				discriminator: msg.author.discriminator,
				tag: msg.author.tag,
				bot: msg.author.bot,
			},
			channel: {
				id: msg.channel.id,
				name: msg.channel.name,
				type: msg.channel.type,
			},
			guild: msg.guild ? {
				id: msg.guild.id,
				name: msg.guild.name,
			} : null,
			createdAt: msg.createdAt.toISOString(),
			suffix: msg.suffix || "",
		};
	}

	/**
	 * Serialize a channel for the isolate
	 * @param {Channel} channel
	 * @returns {Object}
	 * @private
	 */
	_serializeChannel (channel) {
		return {
			id: channel.id,
			name: channel.name,
			type: channel.type,
			topic: channel.topic || null,
			nsfw: channel.nsfw || false,
		};
	}

	/**
	 * Serialize a guild for the isolate
	 * @param {Guild} guild
	 * @returns {Object}
	 * @private
	 */
	_serializeGuild (guild) {
		return {
			id: guild.id,
			name: guild.name,
			memberCount: guild.memberCount,
			ownerId: guild.ownerId,
			icon: guild.icon,
		};
	}

	/**
	 * Serialize bot info for the isolate
	 * @param {Client} client
	 * @param {Guild} guild
	 * @param {Document} serverDocument
	 * @returns {Object}
	 * @private
	 */
	_serializeBot (client, guild, serverDocument) {
		return {
			user: {
				id: client.user.id,
				username: client.user.username,
				tag: client.user.tag,
			},
			prefix: serverDocument.config.command_prefix,
		};
	}

	/**
	 * Serialize event data for the isolate
	 * @param {Object} eventData
	 * @returns {Object}
	 * @private
	 */
	_serializeEvent (eventData) {
		// Return a safe copy of event data
		try {
			return JSON.parse(JSON.stringify(eventData));
		} catch {
			return { type: "unknown" };
		}
	}

	/**
	 * Serialize a member for the isolate
	 * @param {GuildMember} member
	 * @returns {Object}
	 * @private
	 */
	_serializeMember (member) {
		return {
			id: member.id,
			nickname: member.nickname,
			displayName: member.displayName,
			joinedTimestamp: member.joinedTimestamp,
			premiumSinceTimestamp: member.premiumSinceTimestamp,
			pending: member.pending || false,
			communicationDisabledUntil: member.communicationDisabledUntilTimestamp,
			roles: Array.from(member.roles.cache.keys()),
			user: this._serializeUser(member.user),
			avatarURL: member.displayAvatarURL({ format: "webp", size: 128 }),
			kickable: member.kickable,
			bannable: member.bannable,
			manageable: member.manageable,
			isOwner: member.id === member.guild.ownerId,
		};
	}

	/**
	 * Serialize a user for the isolate
	 * @param {User} user
	 * @returns {Object}
	 * @private
	 */
	_serializeUser (user) {
		return {
			id: user.id,
			username: user.username,
			displayName: user.displayName || user.globalName || user.username,
			discriminator: user.discriminator,
			tag: user.tag,
			bot: user.bot,
			system: user.system || false,
			avatar: user.avatar,
			banner: user.banner || null,
			accentColor: user.accentColor || null,
			createdTimestamp: user.createdTimestamp,
			avatarURL: user.displayAvatarURL({ format: "webp", size: 128 }),
			defaultAvatarURL: user.defaultAvatarURL,
		};
	}

	/**
	 * Serialize guild roles for the isolate
	 * @param {Guild} guild
	 * @returns {Object}
	 * @private
	 */
	_serializeRoles (guild) {
		const roles = {};
		guild.roles.cache.forEach(role => {
			roles[role.id] = {
				id: role.id,
				name: role.name,
				color: role.color,
				hexColor: role.hexColor,
				position: role.position,
				hoist: role.hoist,
				mentionable: role.mentionable,
				managed: role.managed,
				permissions: role.permissions.bitfield.toString(),
				members: role.members.size,
			};
		});
		return {
			list: Object.values(roles),
			byId: roles,
			count: guild.roles.cache.size,
			highest: guild.roles.highest ? {
				id: guild.roles.highest.id,
				name: guild.roles.highest.name,
			} : null,
			everyone: guild.roles.everyone ? {
				id: guild.roles.everyone.id,
				name: guild.roles.everyone.name,
			} : null,
		};
	}

	/**
	 * Get embed builder helper functions
	 * @returns {Object}
	 * @private
	 */
	_getEmbedHelper () {
		return {
			/**
			 * Create a new embed object
			 */
			create: (options = {}) => ({
				title: options.title || null,
				description: options.description || null,
				url: options.url || null,
				color: options.color || null,
				timestamp: options.timestamp || null,
				footer: options.footer || null,
				thumbnail: options.thumbnail || null,
				image: options.image || null,
				author: options.author || null,
				fields: options.fields || [],
			}),

			/**
			 * Color constants
			 */
			colors: {
				DEFAULT: 0x000000,
				AQUA: 0x1ABC9C,
				GREEN: 0x2ECC71,
				BLUE: 0x3498DB,
				PURPLE: 0x9B59B6,
				GOLD: 0xF1C40F,
				ORANGE: 0xE67E22,
				RED: 0xE74C3C,
				GREY: 0x95A5A6,
				NAVY: 0x34495E,
				DARK_AQUA: 0x11806A,
				DARK_GREEN: 0x1F8B4C,
				DARK_BLUE: 0x206694,
				DARK_PURPLE: 0x71368A,
				DARK_GOLD: 0xC27C0E,
				DARK_ORANGE: 0xA84300,
				DARK_RED: 0x992D22,
				DARK_GREY: 0x979C9F,
				LIGHT_GREY: 0xBCC0C0,
				DARK_NAVY: 0x2C3E50,
				BLURPLE: 0x5865F2,
				GREYPLE: 0x99AAB5,
				WHITE: 0xFFFFFF,
				SUCCESS: 0x00FF00,
				ERROR: 0xFF0000,
				WARNING: 0xFFA500,
				INFO: 0x3498DB,
			},

			/**
			 * Parse a color value
			 */
			resolveColor: color => {
				if (typeof color === "string") {
					if (color === "RANDOM") return Math.floor(Math.random() * (0xFFFFFF + 1));
					if (color.startsWith("#")) return parseInt(color.slice(1), 16);
					return parseInt(color, 16);
				}
				if (Array.isArray(color)) {
					return (color[0] << 16) + (color[1] << 8) + color[2];
				}
				return color;
			},
		};
	}

	/**
	 * Serialize the points module for the isolate
	 * @param {Object} pointsModule - Points module instance
	 * @returns {Object} Serialized points data and functions
	 * @private
	 */
	_serializePointsModule (pointsModule) {
		// Since we can't pass functions through isolated-vm,
		// we need to pre-compute the data and return static values
		// Write methods are exposed via global callbacks
		try {
			return {
				isEnabled: pointsModule.isEnabled,
				canWrite: pointsModule.canWrite,
				self: pointsModule.getSelf(),
				leaderboard: pointsModule.getLeaderboard(25),
				ranks: pointsModule.getRanks(),
				stats: pointsModule.getStats(),
				totalMembers: pointsModule.getTotalMembers(),

				// Helper functions that work on the pre-loaded data
				_leaderboardData: pointsModule.getLeaderboard(100),

				// Write method wrappers - these call the global callbacks
				// Extensions should use: economy.addPoints(userId, amount)
				addPoints: "__USE_CALLBACK__",
				removePoints: "__USE_CALLBACK__",
				transfer: "__USE_CALLBACK__",
				setPoints: "__USE_CALLBACK__",
				getUser: "__USE_CALLBACK__",
			};
		} catch (err) {
			// Return minimal data if there's an error (e.g., missing scopes)
			return {
				isEnabled: false,
				canWrite: false,
				self: null,
				leaderboard: [],
				ranks: [],
				stats: null,
				totalMembers: 0,
				error: err.message,
				addPoints: "__USE_CALLBACK__",
				removePoints: "__USE_CALLBACK__",
				transfer: "__USE_CALLBACK__",
				setPoints: "__USE_CALLBACK__",
				getUser: "__USE_CALLBACK__",
			};
		}
	}


	/**
	 * Set up console.log in the isolate (limited functionality)
	 * @param {ivm.Reference} jail
	 * @private
	 */
	async _setupConsole (jail) {
		const logCallback = new ivm.Callback((...args) => {
			logger.debug(`[Extension] ${args.join(" ")}`);
		});
		await jail.set("__logCallback__", logCallback);
		await this.vmContext.eval(`
			const console = {
				log: (...args) => __logCallback__(...args.map(a => String(a))),
				warn: (...args) => __logCallback__("[WARN]", ...args.map(a => String(a))),
				error: (...args) => __logCallback__("[ERROR]", ...args.map(a => String(a))),
			};
		`);
	}

	/**
	 * Run code in the isolated environment
	 * @param {String} code - The code to execute
	 * @param {Number} timeout - Maximum execution time in ms
	 * @returns {Promise<{success: Boolean, err: ?Error}>}
	 */
	async run (code, timeout = 5000) {
		try {
			await this.vmContext.eval(`(async () => {\n${code}\n})()`, { timeout });
			return { success: true, err: null };
		} catch (err) {
			return { success: false, err };
		}
	}

	/**
	 * Clean up the isolate resources
	 */
	dispose () {
		if (this.vmContext) {
			this.vmContext.release();
			this.vmContext = null;
		}
		if (this.isolate) {
			this.isolate.dispose();
			this.isolate = null;
		}
	}
}

module.exports = IsolatedSandbox;
