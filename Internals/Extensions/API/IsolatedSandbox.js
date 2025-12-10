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

		// Set up the require function in the isolate
		await this.vmContext.eval(`
			const require = (name) => {
				const moduleData = __modulesData__[name];
				if (!moduleData) {
					throw new Error("Unknown module: " + name);
				}
				if (moduleData.needsCallback) {
					return __requireCallback__(name);
				}
				return moduleData.value;
			};
		`);
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
