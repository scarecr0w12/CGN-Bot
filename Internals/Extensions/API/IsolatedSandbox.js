const ivm = require("isolated-vm");
const sizeof = require("object-sizeof");
const net = require("net");
const { request: undiciRequest } = require("undici");
const TierManager = require("../../../Modules/TierManager");
const {
	Errors: {
		Error: SkynetError,
	},
	Constants: {
		Scopes,
	},
} = require("../../index");

const EXT_HTTP_DEFAULT_MAX_BYTES = 1024 * 1024;
const EXT_HTTP_DEFAULT_TIMEOUT_MS = 6000;
const EXT_HTTP_MAX_BODY_BYTES = 100 * 1024;
const EXT_HTTP_RATE_WINDOW_MS = 60 * 1000;
const EXT_HTTP_RATE_MAX = 30;

const extensionHttpRate = new Map();

// Default allowlist used when database settings are not available
const DEFAULT_HTTP_ALLOWLIST = [
	"api.jikan.moe",
	"api.mojang.com",
	"sessionserver.mojang.com",
	"api.steampowered.com",
	"steamcommunity.com",
	"mc-heads.net",
	"api.mcsrvstat.us",
	"api.henrikdev.xyz",
	"fortnite-api.com",
	"ddragon.leagueoflegends.com",
	"raw.communitydragon.org",
];

/**
 * Get allowed HTTP hosts for extension sandbox
 * Priority: Environment variable > Database settings > Default list
 * @returns {Promise<string[]>} Array of allowed hostnames
 */
const getAllowedExtensionHttpHosts = async () => {
	// Environment variable takes highest priority (for quick overrides)
	const envRaw = process.env.EXTENSION_HTTP_ALLOWLIST || "";
	const envList = envRaw.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
	if (envList.length) return envList;

	// Try to get from database settings
	try {
		if (typeof SiteSettings !== "undefined" && SiteSettings?.findOne) {
			const settings = await SiteSettings.findOne("main");
			if (settings?.extension_sandbox?.http_allowlist?.length) {
				return settings.extension_sandbox.http_allowlist.map(h => h.toLowerCase());
			}
		}
	} catch (err) {
		logger.warn("IsolatedSandbox: Failed to fetch allowlist from database, using defaults", {}, err);
	}

	return DEFAULT_HTTP_ALLOWLIST;
};

const isPrivateIp = (ip) => {
	if (!ip) return true;
	if (ip === "127.0.0.1" || ip === "::1") return true;
	if (ip.startsWith("10.")) return true;
	if (ip.startsWith("192.168.")) return true;
	if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
	if (ip.startsWith("169.254.")) return true;
	return false;
};

/**
 * Check if URL is allowed based on network capability level
 * @param {string} rawUrl - The URL to check
 * @param {string} networkCapability - The capability level (none, allowlist_only, network, network_advanced)
 * @param {boolean} networkApproved - Whether the capability has been approved
 * @param {string[]} allowlist - The static allowlist for allowlist_only mode
 * @returns {{ok: boolean, url?: URL, error?: string}}
 */
const isAllowedUrl = (rawUrl, networkCapability, networkApproved, allowlist) => {
	let url;
	try {
		url = new URL(String(rawUrl));
	} catch (_) {
		return { ok: false, error: "INVALID_URL" };
	}

	// Check protocol based on capability
	const isHttps = url.protocol === "https:";
	const isHttp = url.protocol === "http:";

	if (!isHttps && !isHttp) return { ok: false, error: "INVALID_PROTOCOL" };

	// Only network_advanced allows HTTP
	if (isHttp && networkCapability !== "network_advanced") {
		return { ok: false, error: "ONLY_HTTPS" };
	}

	if (!url.hostname) return { ok: false, error: "INVALID_HOST" };

	const host = url.hostname.toLowerCase();
	if (host === "localhost") return { ok: false, error: "HOST_NOT_ALLOWED" };

	// Block private IPs regardless of capability
	const ipType = net.isIP(host);
	if (ipType && isPrivateIp(host)) return { ok: false, error: "PRIVATE_IP_BLOCKED" };

	// Handle based on capability level
	switch (networkCapability) {
		case "none":
			return { ok: false, error: "NETWORK_NOT_ENABLED" };

		case "allowlist_only": {
			// Use static allowlist (auto-approved, no approval check needed)
			const allowed = allowlist.some(a => host === a || host.endsWith(`.${a}`));
			if (!allowed) return { ok: false, error: "HOST_NOT_ALLOWED" };
			return { ok: true, url };
		}

		case "network":
		case "network_advanced":
			// Requires maintainer approval
			if (!networkApproved) {
				return { ok: false, error: "NETWORK_NOT_APPROVED" };
			}
			// Any HTTPS host allowed (or HTTP for network_advanced)
			return { ok: true, url };

		default:
			return { ok: false, error: "INVALID_CAPABILITY" };
	}
};

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

		// Set up extension storage callbacks
		await this._setupExtensionStoreCallbacks(jail);

		// Set up message reply callbacks
		await this._setupMessageCallbacks(jail);

		// Set up interaction callbacks (slash commands)
		await this._setupInteractionCallbacks(jail);

		await this._setupHttpCallbacks(jail);

		// Set up RCON callbacks for game server control
		await this._setupRconCallbacks(jail);

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
							getMemberIds: (limit) => {
								if (!Array.isArray(module.memberIds)) return [];
								if (!limit) return module.memberIds;
								return module.memberIds.slice(0, limit);
							},
							
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

					
					if (name === 'http') {
						const safeParse = (input) => {
							if (!input) return { success: false, error: 'NO_RESPONSE' };
							try { return JSON.parse(input); } catch (_) { return { success: false, error: 'BAD_RESPONSE' }; }
						};
						module = {
							...module,
							request: async (options) => {
								const res = await __httpRequestCallback__(JSON.stringify(options || {}));
								return safeParse(res);
							},
						};
					}

					// Wrap extension module to expose per-server storage and settings
					if (name === 'extension') {
						const safeParse = (input) => {
							if (!input) return null;
							try { return JSON.parse(input); } catch (_) { return null; }
						};
						module = {
							...module,
							storage: {
								get: (key) => {
									if (!module.store) return undefined;
									return module.store[key];
								},
								write: async (key, value) => {
									const res = safeParse(__extensionStoreWriteCallback__(String(key), JSON.stringify(value)));
									if (res && res.success) {
										module.store = res.store;
										return res.value;
									}
									throw new Error((res && res.error) ? res.error : 'Failed to write extension storage');
								},
								delete: async (key) => {
									const res = safeParse(__extensionStoreDeleteCallback__(String(key)));
									if (res && res.success) {
										module.store = res.store;
										return key;
									}
									throw new Error((res && res.error) ? res.error : 'Failed to delete extension storage key');
								},
								clear: async () => {
									const res = safeParse(__extensionStoreClearCallback__());
									if (res && res.success) {
										module.store = res.store;
										return true;
									}
									throw new Error((res && res.error) ? res.error : 'Failed to clear extension storage');
								},
							},
							// Server-admin configured settings (read-only)
							settings: {
								get: (key) => {
									if (!module.settings) return undefined;
									return module.settings[key];
								},
								getAll: () => {
									return module.settings || {};
								},
							},
						};
					}

					// Wrap message module to expose reply
					if (name === 'message') {
						const safeParse = (input) => {
							if (!input) return {};
							try { return JSON.parse(input); } catch (_) { return {}; }
						};
						const call = (cb, payload) => {
							const result = cb(JSON.stringify(payload || {}));
							return safeParse(result);
						};
						module = {
							...module,
							reply: (payload) => call(__messageReplyCallback__, (typeof payload === 'string') ? { content: payload } : payload),
						};
					}

					// Wrap interaction module for slash commands
					if (name === 'interaction') {
						const call = (cb, payload) => {
							const result = cb(JSON.stringify(payload || {}));
							try {
								return JSON.parse(result);
							} catch (_) {
								return { success: false, error: 'Invalid interaction callback response' };
							}
						};
						module = {
							...module,
							reply: (payload) => call(__interactionReplyCallback__, (typeof payload === 'string') ? { content: payload } : payload),
							deferReply: (payload) => call(__interactionDeferCallback__, payload),
							editReply: (payload) => call(__interactionEditReplyCallback__, (typeof payload === 'string') ? { content: payload } : payload),
							followUp: (payload) => call(__interactionFollowUpCallback__, (typeof payload === 'string') ? { content: payload } : payload),
						};
					}

					// Wrap rcon module for game server RCON commands
					if (name === 'rcon') {
						const safeParse = (input) => {
							if (!input) return { success: false, error: 'NO_RESPONSE' };
							try { return JSON.parse(input); } catch (_) { return { success: false, error: 'BAD_RESPONSE' }; }
						};
						module = {
							...module,
							sendCommand: async (options) => {
								const res = await __rconSendCommandCallback__(JSON.stringify(options || {}));
								return safeParse(res);
							},
							testConnection: async (options) => {
								const res = await __rconTestConnectionCallback__(JSON.stringify(options || {}));
								return safeParse(res);
							},
						};
					}
					return module;
				}
				return moduleData.value;
			};
		`);
	}

	async _setupHttpCallbacks (jail) {
		const { serverDocument, extensionConfigDocument, extensionDocument, versionDocument } = this.context;
		const allowlist = getAllowedExtensionHttpHosts();

		// Get network capability from version document
		const networkCapability = versionDocument?.network_capability || "none";
		const networkApproved = versionDocument?.network_approved || false;

		const safeParse = (input) => {
			if (!input) return {};
			try {
				return JSON.parse(input);
			} catch (_) {
				return {};
			}
		};

		const rateKey = `${serverDocument?._id || "unknown"}:${extensionConfigDocument?._id || extensionDocument?._id || "unknown"}`;

		const requestCallback = new ivm.Callback(async (payloadJSON) => {
			try {
				if (!this.scopes.includes(Scopes.http_request.scope)) {
					return JSON.stringify({ success: false, error: "MISSING_SCOPES" });
				}

				// Check network capability first
				if (networkCapability === "none") {
					return JSON.stringify({ success: false, error: "NETWORK_NOT_ENABLED" });
				}

				// Tier 2 required for network and network_advanced capabilities
				// allowlist_only can work on Tier 1
				const svrid = serverDocument?._id;
				if (svrid && (networkCapability === "network" || networkCapability === "network_advanced")) {
					const hasTier2 = await TierManager.hasMinimumTierLevel(String(svrid), 2);
					if (!hasTier2) {
						return JSON.stringify({ success: false, error: "TIER_REQUIRED" });
					}
				}

				const rate = extensionHttpRate.get(rateKey) || { ts: Date.now(), count: 0 };
				const now = Date.now();
				if (now - rate.ts > EXT_HTTP_RATE_WINDOW_MS) {
					rate.ts = now;
					rate.count = 0;
				}
				rate.count++;
				extensionHttpRate.set(rateKey, rate);
				if (rate.count > EXT_HTTP_RATE_MAX) {
					return JSON.stringify({ success: false, error: "RATE_LIMIT" });
				}

				const payload = safeParse(payloadJSON);
				const method = String(payload.method || "GET").toUpperCase();
				const urlRaw = payload.url;
				const headers = payload.headers && typeof payload.headers === "object" ? payload.headers : {};
				const timeoutMs = Math.max(1000, Math.min(parseInt(payload.timeoutMs || EXT_HTTP_DEFAULT_TIMEOUT_MS), 15000));
				const maxBytes = Math.max(1024, Math.min(parseInt(payload.maxBytes || EXT_HTTP_DEFAULT_MAX_BYTES), EXT_HTTP_DEFAULT_MAX_BYTES));
				const responseType = ["json", "text"].includes(payload.responseType) ? payload.responseType : "json";

				if (!urlRaw) return JSON.stringify({ success: false, error: "MISSING_URL" });
				if (!["GET", "POST"].includes(method)) return JSON.stringify({ success: false, error: "METHOD_NOT_ALLOWED" });

				// Inject secrets into headers if requested
				if (payload.injectSecrets && typeof payload.injectSecrets === "object" && extensionConfigDocument?.secrets) {
					for (const [headerName, secretId] of Object.entries(payload.injectSecrets)) {
						const secretValue = extensionConfigDocument.secrets[secretId];
						if (secretValue) {
							headers[headerName] = secretValue;
						}
					}
				}

				const allowRes = isAllowedUrl(urlRaw, networkCapability, networkApproved, allowlist);
				if (!allowRes.ok) return JSON.stringify({ success: false, error: allowRes.error });
				const url = allowRes.url;

				let body = payload.body;
				if (typeof body === "object" && body !== null) {
					body = JSON.stringify(body);
					headers["content-type"] = headers["content-type"] || "application/json";
				}
				if (typeof body === "string" && Buffer.byteLength(body) > EXT_HTTP_MAX_BODY_BYTES) {
					return JSON.stringify({ success: false, error: "BODY_TOO_LARGE" });
				}

				headers["user-agent"] = headers["user-agent"] || "SkynetExtensions/1.0";

				const res = await undiciRequest(url.toString(), {
					method,
					headers,
					body: method === "POST" ? body : undefined,
					maxRedirections: 0,
					headersTimeout: timeoutMs,
					bodyTimeout: timeoutMs,
				});

				let bytes = 0;
				let text = "";
				for await (const chunk of res.body) {
					bytes += chunk.length;
					if (bytes > maxBytes) {
						if (res.body && typeof res.body.destroy === "function") res.body.destroy();
						return JSON.stringify({ success: false, error: "RESPONSE_TOO_LARGE" });
					}
					text += chunk.toString("utf8");
				}

				let json = null;
				if (responseType === "json") {
					try {
						json = JSON.parse(text);
					} catch (_) {
						json = null;
					}
				}

				return JSON.stringify({
					success: true,
					status: res.statusCode,
					headers: res.headers || {},
					body: text,
					json,
				});
			} catch (err) {
				logger.warn("Extension HTTP request failed", {
					svrid: this.context?.guild?.id,
					extid: extensionDocument?._id,
					extv: versionDocument?._id,
				}, err);
				return JSON.stringify({ success: false, error: err.message || "HTTP_FAILED" });
			}
		}, { async: true });

		await jail.set("__httpRequestCallback__", requestCallback);
	}

	/**
	 * Set up callbacks for RCON operations (game server control)
	 * @param {ivm.Reference} jail
	 * @private
	 */
	async _setupRconCallbacks (jail) {
		const { serverDocument, versionDocument, extensionConfigDocument } = this.context;
		const RconManager = require("../../../Modules/RconManager");

		// Get network capability - RCON requires network_advanced
		const networkCapability = versionDocument?.network_capability || "none";
		const networkApproved = versionDocument?.network_approved || false;

		const safeParse = (input) => {
			if (!input) return {};
			try {
				return JSON.parse(input);
			} catch (_) {
				return {};
			}
		};

		const sendCommandCallback = new ivm.Callback(async (payloadJSON) => {
			try {
				// RCON requires network_advanced capability and approval
				if (networkCapability !== "network_advanced") {
					return JSON.stringify({ success: false, error: "RCON_REQUIRES_NETWORK_ADVANCED" });
				}
				if (!networkApproved) {
					return JSON.stringify({ success: false, error: "NETWORK_NOT_APPROVED" });
				}

				// Tier 2 required for RCON
				const svrid = serverDocument?._id;
				if (svrid) {
					const TierManager = require("../../../Modules/TierManager");
					const hasTier2 = await TierManager.hasMinimumTierLevel(String(svrid), 2);
					if (!hasTier2) {
						return JSON.stringify({ success: false, error: "TIER_REQUIRED" });
					}
				}

				const payload = safeParse(payloadJSON);

				// Get credentials from extension settings (secrets)
				let host = payload.host;
				let port = payload.port;
				let password = payload.password;

				// Allow injecting from secrets
				if (payload.injectSecrets && extensionConfigDocument?.secrets) {
					if (payload.injectSecrets.host && extensionConfigDocument.secrets[payload.injectSecrets.host]) {
						host = extensionConfigDocument.secrets[payload.injectSecrets.host];
					}
					if (payload.injectSecrets.port && extensionConfigDocument.secrets[payload.injectSecrets.port]) {
						port = parseInt(extensionConfigDocument.secrets[payload.injectSecrets.port], 10);
					}
					if (payload.injectSecrets.password && extensionConfigDocument.secrets[payload.injectSecrets.password]) {
						password = extensionConfigDocument.secrets[payload.injectSecrets.password];
					}
				}

				const result = await RconManager.sendCommand({
					type: payload.type || "webrcon",
					host,
					port: typeof port === "number" ? port : parseInt(port, 10),
					password,
					command: payload.command,
					serverId: `${svrid || "unknown"}:${extensionConfigDocument?._id || "unknown"}`,
				});

				return JSON.stringify(result);
			} catch (err) {
				return JSON.stringify({ success: false, error: err.message || "RCON_FAILED" });
			}
		}, { async: true });

		const testConnectionCallback = new ivm.Callback(async (payloadJSON) => {
			try {
				if (networkCapability !== "network_advanced" || !networkApproved) {
					return JSON.stringify({ success: false, error: "RCON_NOT_AVAILABLE" });
				}

				const payload = safeParse(payloadJSON);

				// Get credentials from extension settings (secrets)
				let host = payload.host;
				let port = payload.port;
				let password = payload.password;

				if (payload.injectSecrets && extensionConfigDocument?.secrets) {
					if (payload.injectSecrets.host && extensionConfigDocument.secrets[payload.injectSecrets.host]) {
						host = extensionConfigDocument.secrets[payload.injectSecrets.host];
					}
					if (payload.injectSecrets.port && extensionConfigDocument.secrets[payload.injectSecrets.port]) {
						port = parseInt(extensionConfigDocument.secrets[payload.injectSecrets.port], 10);
					}
					if (payload.injectSecrets.password && extensionConfigDocument.secrets[payload.injectSecrets.password]) {
						password = extensionConfigDocument.secrets[payload.injectSecrets.password];
					}
				}

				const result = await RconManager.testConnection({
					type: payload.type || "webrcon",
					host,
					port: typeof port === "number" ? port : parseInt(port, 10),
					password,
				});

				return JSON.stringify(result);
			} catch (err) {
				return JSON.stringify({ success: false, error: err.message || "TEST_FAILED" });
			}
		}, { async: true });

		await jail.set("__rconSendCommandCallback__", sendCommandCallback);
		await jail.set("__rconTestConnectionCallback__", testConnectionCallback);
	}

	/**
	 * Set up callbacks for extension store operations
	 * @param {ivm.Reference} jail
	 * @private
	 */
	async _setupExtensionStoreCallbacks (jail) {
		const { serverDocument, extensionConfigDocument } = this.context;
		const maxSize = 25000;

		const writeCallback = new ivm.Callback((key, valueJSON) => {
			try {
				const parsed = JSON.parse(valueJSON);
				const store = extensionConfigDocument.store && typeof extensionConfigDocument.store === "object" ? JSON.parse(JSON.stringify(extensionConfigDocument.store)) : {};
				store[key] = parsed;
				if (sizeof(store) > maxSize) {
					return JSON.stringify({ success: false, error: "STORAGE_SIZE_MAX" });
				}
				extensionConfigDocument.store = store;
				serverDocument.markModified("extensions");
				return JSON.stringify({ success: true, store, value: parsed });
			} catch (err) {
				return JSON.stringify({ success: false, error: err.message });
			}
		});

		const deleteCallback = new ivm.Callback((key) => {
			try {
				const store = extensionConfigDocument.store && typeof extensionConfigDocument.store === "object" ? JSON.parse(JSON.stringify(extensionConfigDocument.store)) : {};
				delete store[key];
				extensionConfigDocument.store = store;
				serverDocument.markModified("extensions");
				return JSON.stringify({ success: true, store });
			} catch (err) {
				return JSON.stringify({ success: false, error: err.message });
			}
		});

		const clearCallback = new ivm.Callback(() => {
			try {
				extensionConfigDocument.store = {};
				serverDocument.markModified("extensions");
				return JSON.stringify({ success: true, store: {} });
			} catch (err) {
				return JSON.stringify({ success: false, error: err.message });
			}
		});

		await jail.set("__extensionStoreWriteCallback__", writeCallback);
		await jail.set("__extensionStoreDeleteCallback__", deleteCallback);
		await jail.set("__extensionStoreClearCallback__", clearCallback);
	}

	/**
	 * Set up callbacks for message reply operations
	 * @param {ivm.Reference} jail
	 * @private
	 */
	async _setupMessageCallbacks (jail) {
		const { msg } = this.context;
		if (!msg) return;

		const safeParse = input => {
			if (!input) return {};
			try {
				return JSON.parse(input);
			} catch (_) {
				return {};
			}
		};

		const replyCallback = new ivm.Callback(async payloadJSON => {
			const payload = safeParse(payloadJSON);
			try {
				if (!this.scopes.includes(Scopes.messages_write.scope)) {
					return JSON.stringify({ success: false, error: "MISSING_SCOPES" });
				}
				await msg.reply(payload);
				return JSON.stringify({ success: true });
			} catch (err) {
				return JSON.stringify({ success: false, error: err.message });
			}
		}, { async: true });

		await jail.set("__messageReplyCallback__", replyCallback);
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
	 * Set up callbacks for interaction reply operations (slash commands)
	 * @param {ivm.Reference} jail - The global reference
	 * @private
	 */
	async _setupInteractionCallbacks (jail) {
		if (!this.context || !this.context.interaction) return;

		const interaction = this.context.interaction;

		const safeParse = input => {
			if (!input) return {};
			try {
				return JSON.parse(input);
			} catch (_) {
				return {};
			}
		};

		const replyCallback = new ivm.Callback(async payloadJSON => {
			const payload = safeParse(payloadJSON);
			try {
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp(payload);
				} else {
					await interaction.reply(payload);
				}
				return JSON.stringify({ success: true });
			} catch (err) {
				return JSON.stringify({ success: false, error: err.message });
			}
		}, { async: true });

		const deferCallback = new ivm.Callback(async payloadJSON => {
			const payload = safeParse(payloadJSON);
			try {
				if (!interaction.deferred && !interaction.replied) {
					await interaction.deferReply(payload);
				}
				return JSON.stringify({ success: true });
			} catch (err) {
				return JSON.stringify({ success: false, error: err.message });
			}
		}, { async: true });

		const editReplyCallback = new ivm.Callback(async payloadJSON => {
			const payload = safeParse(payloadJSON);
			try {
				if (interaction.deferred || interaction.replied) {
					await interaction.editReply(payload);
				} else {
					await interaction.reply(payload);
				}
				return JSON.stringify({ success: true });
			} catch (err) {
				return JSON.stringify({ success: false, error: err.message });
			}
		}, { async: true });

		const followUpCallback = new ivm.Callback(async payloadJSON => {
			const payload = safeParse(payloadJSON);
			try {
				if (!interaction.deferred && !interaction.replied) {
					await interaction.reply(payload);
				} else {
					await interaction.followUp(payload);
				}
				return JSON.stringify({ success: true });
			} catch (err) {
				return JSON.stringify({ success: false, error: err.message });
			}
		}, { async: true });

		await jail.set("__interactionReplyCallback__", replyCallback);
		await jail.set("__interactionDeferCallback__", deferCallback);
		await jail.set("__interactionEditReplyCallback__", editReplyCallback);
		await jail.set("__interactionFollowUpCallback__", followUpCallback);
	}

	/**
	 * Build serializable module data for the isolate
	 * @returns {Object} Module data map
	 * @private
	 */
	_buildModulesData () {
		const { versionDocument, msg, serverDocument, extensionConfigDocument, interaction } = this.context;
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

		// Extension module (needs callback for storage)
		modules.extension = { needsCallback: true };

		// Mark complex modules that need callback resolution
		modules.message = { needsCallback: true };
		modules.channel = { needsCallback: true };
		modules.guild = { needsCallback: true };
		modules.config = { needsCallback: true };
		modules.bot = { needsCallback: true };
		modules.event = { needsCallback: true };
		if (interaction) modules.interaction = { needsCallback: true };
		modules.moment = { needsCallback: true };
		modules.fetch = { needsCallback: true };
		modules.xmlparser = { needsCallback: true };
		modules.http = { needsCallback: true };

		// New modules
		modules.utils = { needsCallback: true };
		modules.member = { needsCallback: true };
		modules.user = { needsCallback: true };
		modules.author = { needsCallback: true };
		modules.roles = { needsCallback: true };
		modules.embed = { needsCallback: true };
		modules.points = { needsCallback: true };
		modules.economy = { needsCallback: true }; // Alias for points
		modules.rcon = { needsCallback: true }; // RCON for game server control

		return modules;
	}

	/**
	 * Resolve a module by name (called from isolate via callback)
	 * @param {String} name - Module name
	 * @returns {*} The resolved module value
	 * @private
	 */
	_resolveModule (name) {
		const { msg, guild, serverDocument, eventData, interaction, extensionConfigDocument } = this.context;
		const { scopes } = this;
		const { rawClient } = this;
		const Utils = require("./Modules/Utils");

		switch (name) {
			case "extension": {
				const extConfig = extensionConfigDocument || {};
				const store = extConfig.store && typeof extConfig.store === "object" ?
					JSON.parse(JSON.stringify(extConfig.store)) : {};
				const settings = extConfig.settings && typeof extConfig.settings === "object" ?
					JSON.parse(JSON.stringify(extConfig.settings)) : {};
				return { store, settings };
			}
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
			case "interaction":
				if (!interaction) throw new SkynetError("UNKNOWN_MODULE", name);
				return this._serializeInteraction(interaction);
			case "moment":
				return { now: Date.now() };
			case "utils":
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
				return this._getEmbedHelper();
			case "points":
			case "economy": {
				const createPointsModule = require("./Modules/Points");
				const pointsModule = createPointsModule(this.context, scopes);
				return this._serializePointsModule(pointsModule);
			}
			case "http":
				return { available: true };
			case "rcon":
				return { available: true, types: ["webrcon", "source"] };
			case "rss":
			case "fetch":
			case "xmlparser":
				return { available: false, reason: "Async modules not available in isolated-vm" };
			default:
				throw new SkynetError("UNKNOWN_MODULE", name);
		}
	}

	/**
	 * Serialize an interaction for the isolate
	 * @param {Interaction} interaction
	 * @returns {Object}
	 * @private
	 */
	_serializeInteraction (interaction) {
		const optionsMap = {};
		try {
			const data = interaction.options && Array.isArray(interaction.options.data) ? interaction.options.data : [];
			data.forEach(opt => {
				if (!opt || !opt.name) return;
				let value = opt.value;
				if (opt.user) value = { id: opt.user.id, type: "user" };
				else if (opt.member) value = { id: opt.member.id, type: "member" };
				else if (opt.channel) value = { id: opt.channel.id, type: "channel" };
				else if (opt.role) value = { id: opt.role.id, type: "role" };
				else if (opt.attachment) value = { id: opt.attachment.id, type: "attachment", url: opt.attachment.url, name: opt.attachment.name };
				optionsMap[opt.name] = value;
			});
		} catch (_) {
			// Ignore parsing errors
		}

		return {
			id: interaction.id,
			commandName: interaction.commandName,
			guildId: interaction.guildId,
			channelId: interaction.channelId,
			user: interaction.user ? {
				id: interaction.user.id,
				username: interaction.user.username,
				tag: interaction.user.tag,
				bot: interaction.user.bot,
			} : null,
			member: interaction.member ? { id: interaction.member.id } : null,
			options: optionsMap,
		};
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
					return (color[0] * 65536) + (color[1] * 256) + color[2];
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
				memberIds: pointsModule.getMemberIds(250),

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
				memberIds: [],
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
