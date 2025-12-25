const cluster = require("cluster");
const ProcessAsPromised = require("process-as-promised");

// Lazy-load metrics to avoid circular dependencies
let metrics = null;
const getMetrics = () => {
	if (!metrics) {
		try {
			metrics = require("../Modules/Metrics");
		} catch (err) {
			// Metrics module not available
		}
	}
	return metrics;
};

// Default IPC timeout (30 seconds)
const DEFAULT_IPC_TIMEOUT = 30000;
// Maximum restart delay (30 seconds)
const MAX_RESTART_DELAY = 30000;
// Restart delay increment per failure (5 seconds)
const RESTART_DELAY_INCREMENT = 5000;
// Heartbeat interval (30 seconds)
const HEARTBEAT_INTERVAL = 30000;
// Heartbeat timeout (10 seconds)
const HEARTBEAT_TIMEOUT = 10000;
// Failures reset after this period of stability (5 minutes)
const FAILURE_RESET_PERIOD = 300000;

class Shard {
	constructor (id, proc, sharder, worker) {
		this.process = proc;
		this.sharder = sharder;
		this.worker = worker;
		this.id = id;
		this.logger = sharder.logger;
		this.process.setMaxListeners(0);
		this.IPC = new ProcessAsPromised(this.process);

		// Health tracking
		this.failures = 0;
		this.lastFailure = null;
		this.lastHeartbeat = Date.now();
		this.ready = false;
		this.heartbeatInterval = null;

		this.process.once("exit", (code, signal) => {
			this.cleanup();
			const exitReason = signal ? `signal ${signal}` : `code ${code}`;
			this.logger.info(`Shard ${this.id} exited (${exitReason}).${!this.sharder.shutdown ? " Scheduling respawn..." : ""}`, { id: this.id, code, signal });

			if (!this.sharder.shutdown) {
				// Reset failure count if shard was stable for a while
				if (this.lastFailure && (Date.now() - this.lastFailure) > FAILURE_RESET_PERIOD) {
					this.failures = 0;
				}

				this.failures++;
				this.lastFailure = Date.now();

				// Calculate backoff delay
				const delay = Math.min(MAX_RESTART_DELAY, this.failures * RESTART_DELAY_INCREMENT);
				this.logger.info(`Shard ${this.id} will respawn in ${delay}ms (failure #${this.failures})`, { id: this.id, delay, failures: this.failures });

				setTimeout(() => {
					if (!this.sharder.shutdown) {
						this.sharder.create(this.id, this.failures);
					}
				}, delay);
			}
		});

		this.sharder.IPC.onEvents.forEach((callback, event) => {
			this.IPC.on(event, (...args) => {
				if (!this.sharder.shutdown) return callback(...args);
			});
		});
		this.sharder.IPC.onceEvents.forEach((callback, event) => this.IPC.once(event, callback));
	}

	/**
	 * Start heartbeat monitoring for this shard
	 */
	startHeartbeat () {
		if (this.heartbeatInterval) return;

		this.heartbeatInterval = setInterval(async () => {
			try {
				const start = Date.now();
				await this.send("heartbeat", { timestamp: start }, HEARTBEAT_TIMEOUT);
				this.lastHeartbeat = Date.now();
				const latency = this.lastHeartbeat - start;

				if (latency > 5000) {
					this.logger.warn(`Shard ${this.id} heartbeat latency is high: ${latency}ms`, { id: this.id, latency });
				}
			} catch (err) {
				const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat;
				this.logger.warn(`Shard ${this.id} missed heartbeat (${timeSinceLastHeartbeat}ms since last)`, { id: this.id, timeSinceLastHeartbeat });

				// If shard hasn't responded in 3 heartbeat intervals, consider it dead
				if (timeSinceLastHeartbeat > HEARTBEAT_INTERVAL * 3) {
					this.logger.error(`Shard ${this.id} appears frozen, forcing restart`, { id: this.id });
					this.worker.kill("SIGTERM");
				}
			}
		}, HEARTBEAT_INTERVAL);
	}

	/**
	 * Clean up shard resources
	 */
	cleanup () {
		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
			this.heartbeatInterval = null;
		}
		this.ready = false;
	}

	/**
	 * Send a message to this shard with timeout
	 * @param {string} event - Event name
	 * @param {*} data - Data to send
	 * @param {number} [timeout] - Timeout in ms (default: 30000)
	 */
	send (event, data, timeout = DEFAULT_IPC_TIMEOUT) {
		return this.IPC.send(event, data, timeout);
	}

	// noinspection JSAnnotator
	eval (code) {
		return new Promise(resolve => this.IPC.send("eval", code).then(res => resolve(res)));
	}

	getGuild (guildID, settings) {
		return new Promise((resolve, reject) => {
			this.send("getGuild", { target: guildID, settings: settings }).then(msg => resolve(msg.result)).catch(err => {
				reject(err);
			});
		});
	}

	getGuilds (settings) {
		return new Promise((resolve, reject) => {
			this.send("getGuild", { target: "*", settings: settings }).then(msg => resolve(msg.result)).catch(err => {
				reject(err);
			});
		});
	}
}

class Sharder {
	constructor (token, count, logger) {
		this.cluster = cluster;
		this.cluster.setupMaster({
			exec: "SkynetBot.js",
		});
		this.logger = logger;
		this.token = token ? token : process.env.CLIENT_TOKEN;
		this.host = process.env.SKYNET_HOST ? process.env.SKYNET_HOST : undefined;
		this.count = count;
		this.mode = process.env.NODE_ENV === "production" ? "production" : "development";
		this.SharderIPC = require("./").SharderIPC;
		this.Collection = require("discord.js").Collection;
		this.IPC = new this.SharderIPC(this, logger);
		this.shards = new this.Collection();
		this.guilds = new this.Collection();
		this.shutdown = false;
	}

	spawn () {
		this.logger.verbose("Spawning shards.");
		for (let i = 0; i < this.count; i++) {
			this.create(i);
		}
	}

	/**
	 * Create a new shard instance
	 * @param {number} id - Shard ID
	 * @param {number} [inheritedFailures=0] - Failure count from previous instance
	 */
	create (id, inheritedFailures = 0) {
		this.logger.verbose("Creating new shard instance and process.", { id: id, inheritedFailures });

		// Record restart in Prometheus metrics (if this is a restart, not initial spawn)
		if (inheritedFailures > 0) {
			const metricsModule = getMetrics();
			if (metricsModule?.recordShardRestart) {
				metricsModule.recordShardRestart(id);
			}
		}

		const worker = this.cluster.fork({
			CLIENT_TOKEN: this.token,
			SHARDS: id,
			SHARD_COUNT: this.count,
			SKYNET_HOST: this.host,
			NODE_ENV: this.mode,
		});
		const shard = new Shard(id, worker.process, this, worker);
		// Inherit failure count from previous instance for backoff calculation
		shard.failures = inheritedFailures;
		this.shards.set(id, shard);
	}

	broadcast (subject, message, timeout) {
		this.logger.silly("Broadcasting message to all shards.", { msg: message });
		const promises = [];
		for (const shard of this.shards.values()) promises.push(shard.send(subject, message, timeout));
		return Promise.all(promises);
	}

	/**
	 * Get health metrics for all shards
	 * @returns {Object} Metrics object with shard health data
	 */
	getHealthMetrics () {
		const data = {
			totalShards: this.count,
			readyShards: 0,
			shards: [],
		};

		for (const [id, shard] of this.shards) {
			const shardMetrics = {
				id,
				ready: shard.ready,
				failures: shard.failures,
				lastHeartbeat: shard.lastHeartbeat,
				timeSinceHeartbeat: Date.now() - shard.lastHeartbeat,
				pid: shard.worker?.process?.pid || null,
			};
			data.shards.push(shardMetrics);
			if (shard.ready) data.readyShards++;
		}

		return data;
	}

	/**
	 * Start heartbeat monitoring for all shards
	 */
	startAllHeartbeats () {
		for (const shard of this.shards.values()) {
			shard.startHeartbeat();
		}
	}
}

module.exports = Sharder;
