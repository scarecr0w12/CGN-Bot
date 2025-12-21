const crypto = require("crypto");

class Traffic {
	constructor (IPC, isWorker) {
		this.db = Database;
		this.IPC = IPC;
		this.logger = logger;
		this.isWorker = isWorker;

		this.pageViews = 0;
		this.authViews = 0;
		this.uniqueUsers = 0;
		this.seenUsers = new Set();

		// Buffer for detailed request logs (flush periodically)
		this.requestBuffer = [];
		this.REQUEST_BUFFER_SIZE = 50;
		this.REQUEST_BUFFER_FLUSH_INTERVAL = 30000; // 30 seconds

		if (!isWorker) setInterval(this.fetch.bind(this), 3600000);

		// Flush request buffer periodically
		setInterval(() => this.flushRequestBuffer(), this.REQUEST_BUFFER_FLUSH_INTERVAL);
	}

	hashIP (ip) {
		if (!ip) return null;
		return crypto.createHash("sha256")
			.update(ip + (process.env.IP_HASH_SALT || "skynet"))
			.digest("hex")
			.substring(0, 16);
	}

	getAndReset () {
		const res = {
			pageViews: this.pageViews,
			authViews: this.authViews,
			uniqueUsers: this.uniqueUsers,
		};
		this.pageViews = 0;
		this.authViews = 0;
		this.uniqueUsers = 0;
		this.seenUsers.clear();
		return res;
	}

	async flush (pageViews, authViews, uniqueUsers) {
		if (pageViews === 0 && authViews === 0 && uniqueUsers === 0) {
			this.logger.verbose(`Skipping traffic flush - no data to save.`);
			return;
		}
		this.logger.verbose(`Flushing traffic data to DB: ${pageViews} views, ${authViews} auth, ${uniqueUsers} unique`);
		await this.db.traffic.create({
			_id: `agg_${Date.now()}`,
			type: "aggregate",
			timestamp: new Date(),
			pageViews,
			authViews,
			uniqueUsers,
		});
		// Clean up old aggregate records (older than 1 month)
		const oneMonthAgo = Date.now() - 2629746000;
		await this.db.traffic.delete({ type: "aggregate", timestamp: { $lt: new Date(oneMonthAgo) } });
		// Clean up old request records (older than 7 days to save space)
		const sevenDaysAgo = Date.now() - 604800000;
		await this.db.traffic.delete({ type: "request", timestamp: { $lt: new Date(sevenDaysAgo) } });
	}

	async fetch () {
		this.logger.debug(`Fetching traffic data from all shards.`);
		try {
			const msg = await this.IPC.send("traffic", {}, "*");

			if (!msg || !Array.isArray(msg) || msg.length === 0) {
				this.logger.warn(`No traffic data received from shards.`);
				return;
			}

			const payload = msg.reduce((acc, val) => ({
				pageViews: acc.pageViews + (val.pageViews || 0),
				authViews: acc.authViews + (val.authViews || 0),
				uniqueUsers: acc.uniqueUsers + (val.uniqueUsers || 0),
			}), { pageViews: 0, authViews: 0, uniqueUsers: 0 });

			this.logger.silly(`Fetched traffic data: `, payload);
			await this.flush(payload.pageViews, payload.authViews, payload.uniqueUsers);
		} catch (err) {
			this.logger.error(`Failed to fetch traffic data:`, err);
		}
	}

	count (userIdentifier, authenticated) {
		this.pageViews++;
		if (authenticated) this.authViews++;
		if (userIdentifier && !this.seenUsers.has(userIdentifier)) {
			this.seenUsers.add(userIdentifier);
			this.uniqueUsers++;
		} else if (!userIdentifier) {
			this.uniqueUsers++;
		}
	}

	logRequest (requestData) {
		const record = {
			_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			type: "request",
			timestamp: new Date(),
			path: requestData.path ? requestData.path.substring(0, 512) : null,
			method: requestData.method || "GET",
			status_code: requestData.statusCode || null,
			response_time: requestData.responseTime || null,
			user_agent: requestData.userAgent ? requestData.userAgent.substring(0, 1024) : null,
			ip_hash: this.hashIP(requestData.ip),
			referrer: requestData.referrer ? requestData.referrer.substring(0, 512) : null,
			user_id: requestData.userId || null,
			session_id: requestData.sessionId || null,
			country: requestData.country || null,
		};

		this.requestBuffer.push(record);

		if (this.requestBuffer.length >= this.REQUEST_BUFFER_SIZE) {
			this.flushRequestBuffer();
		}
	}

	async flushRequestBuffer () {
		if (this.requestBuffer.length === 0) return;

		const records = [...this.requestBuffer];
		this.requestBuffer = [];

		try {
			for (const record of records) {
				await this.db.traffic.create(record);
			}
			this.logger.debug(`Flushed ${records.length} request logs to database.`);
		} catch (err) {
			this.logger.error(`Failed to flush request logs:`, err);
			this.requestBuffer.unshift(...records);
		}
	}

	async data () {
		const data = {};
		data.current = {
			pageViews: this.pageViews,
			authViews: this.authViews,
			uniqueUsers: this.uniqueUsers,
		};

		// Only get aggregate records for stats display
		const rawData = await this.db.traffic.find({ type: "aggregate" }).exec();

		// Convert timestamp to numeric _id for chart compatibility
		rawData.forEach(t => {
			// Use timestamp field (Date) instead of _id which has "agg_" prefix
			t._id = t.timestamp instanceof Date ? t.timestamp.getTime() : new Date(t.timestamp).getTime();
		});

		// Sort by timestamp for proper graphing
		rawData.sort((a, b) => a._id - b._id);

		// Last 24 hours - hourly data points
		const dayAgo = Date.now() - 86400000;
		data.day = rawData
			.filter(traffic => traffic._id > dayAgo)
			.map(t => {
				const obj = t.toObject ? t.toObject() : { ...t };
				obj._id = t._id; // Already converted to timestamp
				return obj;
			});

		// Aggregate by day for monthly view
		data.days = {};
		rawData.forEach(traffic => {
			const timestamp = traffic._id; // Already numeric from conversion above
			if (!timestamp || isNaN(timestamp)) return;
			const date = new Date(timestamp);
			if (isNaN(date.getTime())) return;
			const dateKey = date.toISOString().split("T")[0];
			if (!data.days[dateKey]) {
				data.days[dateKey] = {
					_id: new Date(dateKey).getTime(),
					date: dateKey,
					pageViews: 0,
					authViews: 0,
					uniqueUsers: 0,
				};
			}
			data.days[dateKey].pageViews += traffic.pageViews || 0;
			data.days[dateKey].authViews += traffic.authViews || 0;
			data.days[dateKey].uniqueUsers += traffic.uniqueUsers || 0;
		});

		// Last 7 days
		const weekAgo = Date.now() - 604800000;
		data.week = Object.values(data.days)
			.filter(traffic => traffic._id > weekAgo)
			.sort((a, b) => a._id - b._id);

		// Last 30 days
		const monthAgo = Date.now() - 2592000000;
		data.month = Object.values(data.days)
			.filter(traffic => traffic._id > monthAgo)
			.sort((a, b) => a._id - b._id);

		return data;
	}
}

module.exports = Traffic;
