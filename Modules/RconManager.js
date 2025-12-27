/**
 * RCON Manager - Handles RCON connections for game servers
 * Supports both WebRCON (WebSocket) for Rust and Source RCON (TCP) for other games
 *
 * Used by extensions to send commands to game servers without needing a panel
 */

const WebSocket = require("ws");
const net = require("net");
const Logger = require("../Internals/Logger");
const logger = new Logger("RconManager");

// Connection pool to reuse connections
const connectionPool = new Map();
const CONNECTION_TIMEOUT = 30000; // 30 seconds
const COMMAND_TIMEOUT = 10000; // 10 seconds
const MAX_CONNECTIONS_PER_SERVER = 3;
const POOL_CLEANUP_INTERVAL = 60000; // 1 minute

// Rate limiting per server
const rateLimit = new Map();
const RATE_WINDOW_MS = 60000;
const RATE_MAX_COMMANDS = 30;

/**
 * Check rate limit for a server
 * @param {string} key - Rate limit key (server identifier)
 * @returns {boolean} - True if rate limited
 */
function isRateLimited (key) {
	const now = Date.now();
	const rate = rateLimit.get(key) || { ts: now, count: 0 };

	if (now - rate.ts > RATE_WINDOW_MS) {
		rate.ts = now;
		rate.count = 0;
	}

	rate.count++;
	rateLimit.set(key, rate);

	return rate.count > RATE_MAX_COMMANDS;
}

/**
 * WebRCON client for Rust servers
 * Uses WebSocket protocol as per Facepunch specification
 */
class WebRconClient {
	constructor (host, port, password) {
		this.host = host;
		this.port = port;
		this.password = password;
		this.ws = null;
		this.connected = false;
		this.messageId = 1;
		this.pendingCommands = new Map();
		this.lastActivity = Date.now();
	}

	/**
	 * Connect to the WebRCON server
	 * @returns {Promise<boolean>}
	 */
	connect () {
		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				if (this.ws) {
					this.ws.terminate();
				}
				reject(new Error("Connection timeout"));
			}, CONNECTION_TIMEOUT);

			try {
				const url = `ws://${this.host}:${this.port}/${this.password}`;
				this.ws = new WebSocket(url);

				this.ws.on("open", () => {
					clearTimeout(timeout);
					this.connected = true;
					this.lastActivity = Date.now();
					logger.verbose(`WebRCON connected to ${this.host}:${this.port}`);
					resolve(true);
				});

				this.ws.on("message", (data) => {
					this.lastActivity = Date.now();
					try {
						const message = JSON.parse(data.toString());
						this._handleMessage(message);
					} catch (err) {
						logger.warn(`WebRCON message parse error: ${err.message}`);
					}
				});

				this.ws.on("error", (err) => {
					clearTimeout(timeout);
					logger.warn(`WebRCON error for ${this.host}:${this.port}: ${err.message}`);
					this.connected = false;
					reject(err);
				});

				this.ws.on("close", () => {
					this.connected = false;
					// Reject any pending commands
					for (const [, pending] of this.pendingCommands) {
						pending.reject(new Error("Connection closed"));
					}
					this.pendingCommands.clear();
				});
			} catch (err) {
				clearTimeout(timeout);
				reject(err);
			}
		});
	}

	/**
	 * Handle incoming WebRCON message
	 * @param {Object} message
	 * @private
	 */
	_handleMessage (message) {
		const { Identifier, Message, Type } = message;

		// Type: Generic = 0, Log = 1, Chat = 2, Report = 4, Warning = 5
		const pending = this.pendingCommands.get(Identifier);
		if (pending) {
			this.pendingCommands.delete(Identifier);
			pending.resolve({
				success: true,
				message: Message || "",
				type: Type,
				identifier: Identifier,
			});
		}
	}

	/**
	 * Send a command to the server
	 * @param {string} command - The RCON command to execute
	 * @returns {Promise<Object>}
	 */
	sendCommand (command) {
		return new Promise((resolve, reject) => {
			if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
				reject(new Error("Not connected"));
				return;
			}

			const id = this.messageId++;
			const timeout = setTimeout(() => {
				this.pendingCommands.delete(id);
				reject(new Error("Command timeout"));
			}, COMMAND_TIMEOUT);

			this.pendingCommands.set(id, {
				resolve: (result) => {
					clearTimeout(timeout);
					resolve(result);
				},
				reject: (err) => {
					clearTimeout(timeout);
					reject(err);
				},
			});

			const packet = JSON.stringify({
				Identifier: id,
				Message: command,
				Name: "SkynetBot",
			});

			this.ws.send(packet, (err) => {
				if (err) {
					clearTimeout(timeout);
					this.pendingCommands.delete(id);
					reject(err);
				}
			});

			this.lastActivity = Date.now();
		});
	}

	/**
	 * Disconnect from the server
	 */
	disconnect () {
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
		this.connected = false;
		this.pendingCommands.clear();
	}

	/**
	 * Check if connection is stale
	 * @returns {boolean}
	 */
	isStale () {
		return Date.now() - this.lastActivity > CONNECTION_TIMEOUT;
	}
}

// Source RCON packet types
const RCON_SERVERDATA_AUTH = 3;
const RCON_SERVERDATA_EXECCOMMAND = 2;

/**
 * Source RCON client for games using Valve's Source RCON protocol
 * Works with games like Minecraft, ARK, 7 Days to Die, etc.
 */
class SourceRconClient {
	constructor (host, port, password) {
		this.host = host;
		this.port = port;
		this.password = password;
		this.socket = null;
		this.connected = false;
		this.authenticated = false;
		this.requestId = 1;
		this.pendingCommands = new Map();
		this.lastActivity = Date.now();
		this.buffer = Buffer.alloc(0);
	}

	/**
	 * Connect and authenticate
	 * @returns {Promise<boolean>}
	 */
	connect () {
		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				if (this.socket) {
					this.socket.destroy();
				}
				reject(new Error("Connection timeout"));
			}, CONNECTION_TIMEOUT);

			this.socket = new net.Socket();

			this.socket.on("connect", async () => {
				this.connected = true;
				this.lastActivity = Date.now();

				try {
					const authResult = await this._authenticate();
					clearTimeout(timeout);
					if (authResult) {
						this.authenticated = true;
						logger.verbose(`Source RCON connected to ${this.host}:${this.port}`);
						resolve(true);
					} else {
						reject(new Error("Authentication failed"));
					}
				} catch (err) {
					clearTimeout(timeout);
					reject(err);
				}
			});

			this.socket.on("data", (data) => {
				this.lastActivity = Date.now();
				this._handleData(data);
			});

			this.socket.on("error", (err) => {
				clearTimeout(timeout);
				this.connected = false;
				this.authenticated = false;
				reject(err);
			});

			this.socket.on("close", () => {
				this.connected = false;
				this.authenticated = false;
				for (const [, pending] of this.pendingCommands) {
					pending.reject(new Error("Connection closed"));
				}
				this.pendingCommands.clear();
			});

			this.socket.connect(this.port, this.host);
		});
	}

	/**
	 * Handle incoming data
	 * @param {Buffer} data
	 * @private
	 */
	_handleData (data) {
		this.buffer = Buffer.concat([this.buffer, data]);

		while (this.buffer.length >= 4) {
			const size = this.buffer.readInt32LE(0);
			if (this.buffer.length < size + 4) break;

			const packet = this.buffer.slice(0, size + 4);
			this.buffer = this.buffer.slice(size + 4);

			this._handlePacket(packet);
		}
	}

	/**
	 * Handle a complete packet
	 * @param {Buffer} packet
	 * @private
	 */
	_handlePacket (packet) {
		const size = packet.readInt32LE(0);
		const packetId = packet.readInt32LE(4);
		const type = packet.readInt32LE(8);
		const body = packet.slice(12, size + 2).toString("utf8").replace(/\0/g, "");

		const pending = this.pendingCommands.get(packetId);
		if (pending) {
			this.pendingCommands.delete(packetId);

			// Auth response: id of -1 means auth failed
			if (pending.isAuth) {
				pending.resolve(packetId !== -1);
			} else {
				pending.resolve({
					success: true,
					message: body,
					type,
					identifier: packetId,
				});
			}
		}
	}

	/**
	 * Send a packet
	 * @param {number} type
	 * @param {string} body
	 * @param {boolean} isAuth
	 * @returns {Promise<any>}
	 * @private
	 */
	_sendPacket (type, body, isAuth = false) {
		return new Promise((resolve, reject) => {
			if (!this.socket || !this.connected) {
				reject(new Error("Not connected"));
				return;
			}

			const id = this.requestId++;
			const bodyBuffer = Buffer.from(body, "utf8");
			const packet = Buffer.alloc(14 + bodyBuffer.length);

			packet.writeInt32LE(10 + bodyBuffer.length, 0); // Size
			packet.writeInt32LE(id, 4); // ID
			packet.writeInt32LE(type, 8); // Type
			bodyBuffer.copy(packet, 12);
			packet.writeInt16LE(0, 12 + bodyBuffer.length); // Null terminators

			const timeout = setTimeout(() => {
				this.pendingCommands.delete(id);
				reject(new Error("Command timeout"));
			}, COMMAND_TIMEOUT);

			this.pendingCommands.set(id, {
				resolve: (result) => {
					clearTimeout(timeout);
					resolve(result);
				},
				reject: (err) => {
					clearTimeout(timeout);
					reject(err);
				},
				isAuth,
			});

			this.socket.write(packet, (err) => {
				if (err) {
					clearTimeout(timeout);
					this.pendingCommands.delete(id);
					reject(err);
				}
			});
		});
	}

	/**
	 * Authenticate with the server
	 * @returns {Promise<boolean>}
	 * @private
	 */
	_authenticate () {
		return this._sendPacket(RCON_SERVERDATA_AUTH, this.password, true);
	}

	/**
	 * Send a command
	 * @param {string} command
	 * @returns {Promise<Object>}
	 */
	sendCommand (command) {
		if (!this.authenticated) {
			return Promise.reject(new Error("Not authenticated"));
		}
		return this._sendPacket(RCON_SERVERDATA_EXECCOMMAND, command);
	}

	/**
	 * Disconnect
	 */
	disconnect () {
		if (this.socket) {
			this.socket.destroy();
			this.socket = null;
		}
		this.connected = false;
		this.authenticated = false;
		this.pendingCommands.clear();
	}

	/**
	 * Check if connection is stale
	 * @returns {boolean}
	 */
	isStale () {
		return Date.now() - this.lastActivity > CONNECTION_TIMEOUT;
	}
}

/**
 * Get or create a connection from the pool
 * @param {string} type - "webrcon" or "source"
 * @param {string} host
 * @param {number} port
 * @param {string} password
 * @returns {Promise<WebRconClient|SourceRconClient>}
 */
async function getConnection (type, host, port, password) {
	const key = `${type}:${host}:${port}`;

	let pool = connectionPool.get(key);
	if (!pool) {
		pool = [];
		connectionPool.set(key, pool);
	}

	// Find an available connection
	for (const conn of pool) {
		if (conn.connected && !conn.isStale()) {
			conn.lastActivity = Date.now();
			return conn;
		}
	}

	// Remove stale connections
	connectionPool.set(key, pool.filter(c => c.connected && !c.isStale()));
	pool = connectionPool.get(key);

	// Create new connection if under limit
	if (pool.length < MAX_CONNECTIONS_PER_SERVER) {
		const ClientClass = type === "webrcon" ? WebRconClient : SourceRconClient;
		const client = new ClientClass(host, port, password);

		try {
			await client.connect();
			pool.push(client);
			connectionPool.set(key, pool);
			return client;
		} catch (err) {
			throw err;
		}
	}

	// All connections busy, wait for one
	throw new Error("All connections busy");
}

/**
 * Clean up stale connections periodically
 */
setInterval(() => {
	for (const [poolKey, pool] of connectionPool) {
		const active = pool.filter(conn => {
			if (!conn.connected || conn.isStale()) {
				conn.disconnect();
				return false;
			}
			return true;
		});

		if (active.length === 0) {
			connectionPool.delete(poolKey);
		} else {
			connectionPool.set(poolKey, active);
		}
	}

	// Clean up old rate limit entries
	const now = Date.now();
	for (const [rateKey, rate] of rateLimit) {
		if (now - rate.ts > RATE_WINDOW_MS * 2) {
			rateLimit.delete(rateKey);
		}
	}
}, POOL_CLEANUP_INTERVAL);

/**
 * RconManager - Main interface for extensions
 */
class RconManager {
	/**
	 * Send an RCON command to a game server
	 * @param {Object} options
	 * @param {string} options.type - "webrcon" (Rust) or "source" (other games)
	 * @param {string} options.host - Server hostname or IP
	 * @param {number} options.port - RCON port
	 * @param {string} options.password - RCON password
	 * @param {string} options.command - Command to execute
	 * @param {string} [options.serverId] - Server identifier for rate limiting
	 * @returns {Promise<Object>}
	 */
	static async sendCommand (options) {
		const { type, host, port, password, command, serverId } = options;

		// Validate inputs
		if (!type || !["webrcon", "source"].includes(type)) {
			return { success: false, error: "INVALID_TYPE" };
		}
		if (!host || typeof host !== "string") {
			return { success: false, error: "INVALID_HOST" };
		}
		if (!port || typeof port !== "number" || port < 1 || port > 65535) {
			return { success: false, error: "INVALID_PORT" };
		}
		if (!password || typeof password !== "string") {
			return { success: false, error: "INVALID_PASSWORD" };
		}
		if (!command || typeof command !== "string") {
			return { success: false, error: "INVALID_COMMAND" };
		}

		// Block private IPs
		if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
			return { success: false, error: "LOCALHOST_BLOCKED" };
		}
		if (host.startsWith("10.") || host.startsWith("192.168.") || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) {
			return { success: false, error: "PRIVATE_IP_BLOCKED" };
		}

		// Rate limiting
		const rateKey = serverId || `${host}:${port}`;
		if (isRateLimited(rateKey)) {
			return { success: false, error: "RATE_LIMITED" };
		}

		try {
			const client = await getConnection(type, host, port, password);
			const result = await client.sendCommand(command);

			logger.verbose(`RCON command sent to ${host}:${port}: ${command.substring(0, 50)}`);

			return {
				success: true,
				message: result.message || "",
				type: result.type,
			};
		} catch (err) {
			logger.warn(`RCON error for ${host}:${port}: ${err.message}`);
			return {
				success: false,
				error: err.message || "CONNECTION_FAILED",
			};
		}
	}

	/**
	 * Test RCON connection
	 * @param {Object} options
	 * @returns {Promise<Object>}
	 */
	static async testConnection (options) {
		const { type, host, port, password } = options;

		try {
			const ClientClass = type === "webrcon" ? WebRconClient : SourceRconClient;
			const client = new ClientClass(host, port, password);

			await client.connect();

			// Send a test command
			let result;
			if (type === "webrcon") {
				result = await client.sendCommand("serverinfo");
			} else {
				result = await client.sendCommand("status");
			}

			client.disconnect();

			return {
				success: true,
				message: "Connection successful",
				response: result.message,
			};
		} catch (err) {
			return {
				success: false,
				error: err.message || "CONNECTION_FAILED",
			};
		}
	}

	/**
	 * Close all connections (for shutdown)
	 */
	static closeAll () {
		for (const [, pool] of connectionPool) {
			for (const conn of pool) {
				conn.disconnect();
			}
		}
		connectionPool.clear();
		rateLimit.clear();
	}
}

module.exports = RconManager;
