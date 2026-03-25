/**
 * LavalinkManager - Manages Lavalink music playback using erela.js
 * Replaces the old AudioManager with a more robust solution
 */
const { Manager } = require("erela.js");
const { EventEmitter } = require("events");

class LavalinkManager extends EventEmitter {
	constructor (client) {
		super();
		this.client = client;
		this.manager = null;
		this.ready = false;
	}

	/**
	 * Initialize the Lavalink manager
	 */
	async initialize () {
		const lavalinkHost = process.env.LAVALINK_HOST || "127.0.0.1";
		const lavalinkPort = process.env.LAVALINK_PORT || "2333";
		const lavalinkPassword = process.env.LAVALINK_PASSWORD || "youshallnotpass";

		this.manager = new Manager({
			nodes: [
				{
					host: lavalinkHost,
					port: parseInt(lavalinkPort),
					password: lavalinkPassword,
					secure: false,
					retryAmount: 5,
					retryDelay: 3000,
				},
			],
			send: (id, payload) => {
				const guild = this.client.guilds.cache.get(id);
				if (guild) guild.shard.send(payload);
			},
			autoPlay: true,
		});

		this.setupEvents();

		// Initialize after client is ready
		this.manager.init(this.client.user.id);
		logger.info("LavalinkManager initialized successfully");
		this.ready = false;
	}

	hasAvailableNodes () {
		if (!this.manager || !this.manager.nodes) return false;

		// Erela.js uses a Map-like structure for nodes.
		const nodes = this.manager.nodes;
		if (typeof nodes.values === "function") {
			for (const node of nodes.values()) {
				if (node && node.connected) return true;
			}
			return false;
		}

		// Fallback for any array-based implementations.
		if (Array.isArray(nodes)) {
			return nodes.some(n => n && n.connected);
		}

		return false;
	}

	/**
	 * Setup event handlers
	 */
	setupEvents () {
		this.manager
			.on("nodeConnect", node => {
				logger.info(`Lavalink node connected: ${node.options.identifier}`);
				this.ready = this.hasAvailableNodes();
			})
			.on("nodeDisconnect", (node, _reason) => {
				logger.warn(`Lavalink node disconnected: ${node.options.identifier}`);
				this.ready = this.hasAvailableNodes();
			})
			.on("nodeError", (node, error) => {
				if (error && typeof error.message === "string" && error.message.includes("Unexpected op \"ready\"")) {
					logger.debug(`Ignoring Lavalink node error (unexpected ready op): ${node.options.identifier}`, {});
					return;
				}

				// Connection-level errors should mark node availability as down.
				if (error && (error.code === "ECONNRESET" || error.code === "ECONNREFUSED")) {
					this.ready = this.hasAvailableNodes();
				}
				logger.error(`Lavalink node error: ${node.options.identifier}`, {}, error);
			})
			.on("trackStart", (player, track) => {
				const channel = this.client.channels.cache.get(player.textChannel);
				if (channel) {
					channel.send({
						embeds: [{
							color: 0x00aa00,
							title: "🎵 Now Playing",
							description: `[${track.title}](${track.uri})`,
							fields: [
								{ name: "Duration", value: this.formatDuration(track.duration), inline: true },
								{ name: "Requested By", value: `<@${track.requester}>`, inline: true },
							],
							thumbnail: track.thumbnail ? { url: track.thumbnail } : undefined,
						}],
					}).catch(() => { /* Ignore send errors */ });
				}
			})
			.on("trackEnd", (_player, _track) => {
				// Auto-play handles next track automatically
			})
			.on("queueEnd", player => {
				const channel = this.client.channels.cache.get(player.textChannel);
				if (channel) {
					channel.send({
						embeds: [{
							color: 0x0099ff,
							description: "📭 Queue finished! Add more songs with `!play`",
						}],
					}).catch(() => { /* Ignore send errors */ });
				}
				// Disconnect after 5 minutes of inactivity
				setTimeout(() => {
					if (!player.playing && player.queue.size === 0) {
						player.destroy();
					}
				}, 300000);
			})
			.on("playerMove", (player, _oldChannel, newChannel) => {
				player.voiceChannel = newChannel;
			})
			.on("playerDisconnect", player => {
				player.destroy();
			})
			.on("trackStuck", (player, track, threshold) => {
				logger.warn("Track stuck", { track: track.title, threshold });
			})
			.on("trackError", (player, track, error) => {
				logger.error("Track error", { track: track.title }, error);
				const channel = this.client.channels.cache.get(player.textChannel);
				if (channel) {
					channel.send({
						embeds: [{
							color: 0xff0000,
							description: `❌ Failed to play **${track.title}**`,
						}],
					}).catch(() => { /* Ignore send errors */ });
				}
			});
	}

	/**
	 * Search for tracks
	 * @param {string} query - Search query or URL
	 * @param {string} requester - User ID of requester
	 * @returns {Promise<Array>} Array of tracks
	 */
	async search (query, requester) {
		try {
			// Determine search type
			let searchQuery = query;
			if (!query.startsWith("http")) {
				searchQuery = `ytsearch:${query}`;
			}

			const res = await this.manager.search(searchQuery, requester);

			if (res.loadType === "NO_MATCHES" || !res.tracks.length) {
				logger.debug("No search results", { query });
				return [];
			}

			logger.debug("Search results found", { query, count: res.tracks.length });
			return res.tracks;
		} catch (error) {
			logger.error("Lavalink search error", { query }, error);
			throw error;
		}
	}

	/**
	 * Get or create a player for a guild
	 * @param {string} guildId - Guild ID
	 * @param {Object} voiceChannel - Voice channel to join
	 * @param {Object} textChannel - Text channel for messages
	 * @returns {Player} Erela.js player
	 */
	createPlayer (guildId, voiceChannel, textChannel) {
		const existing = this.manager.players.get(guildId);
		if (existing) return existing;

		return this.manager.create({
			guild: guildId,
			voiceChannel: voiceChannel.id,
			textChannel: textChannel.id,
			selfDeafen: true,
			volume: 100,
		});
	}

	/**
	 * Get existing player
	 * @param {string} guildId - Guild ID
	 * @returns {Player|null} Erela.js player or null
	 */
	getPlayer (guildId) {
		return this.manager.players.get(guildId);
	}

	/**
	 * Format duration from milliseconds
	 * @param {number} ms - Duration in milliseconds
	 * @returns {string} Formatted duration
	 */
	formatDuration (ms) {
		if (!ms || ms === 0) return "Live";
		const seconds = Math.floor(ms / 1000);
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
		}
		return `${minutes}:${secs.toString().padStart(2, "0")}`;
	}

	/**
	 * Destroy all players (cleanup)
	 */
	destroyAll () {
		this.manager.players.forEach(player => player.destroy());
		logger.info("All Lavalink players destroyed");
	}
}

module.exports = LavalinkManager;
