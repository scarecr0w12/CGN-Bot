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

		if (!isWorker) setInterval(this.fetch.bind(this), 3600000);
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
			_id: Date.now(),
			pageViews,
			authViews,
			uniqueUsers,
		});
		await this.db.traffic.delete({ _id: { $lt: Date.now() - 2629746000 } });
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

	async data () {
		const data = {};
		data.current = {
			pageViews: this.pageViews,
			authViews: this.authViews,
			uniqueUsers: this.uniqueUsers,
		};

		const rawData = await this.db.traffic.find({}).exec();

		// Parse _id to number (stored as string in MariaDB)
		rawData.forEach(t => {
			t._id = parseInt(t._id, 10);
		});

		// Sort by timestamp for proper graphing
		rawData.sort((a, b) => a._id - b._id);

		// Last 24 hours - hourly data points
		const dayAgo = Date.now() - 86400000;
		data.day = rawData
			.filter(traffic => traffic._id > dayAgo)
			.map(t => {
				const obj = t.toObject ? t.toObject() : { ...t };
				obj._id = parseInt(obj._id, 10);
				return obj;
			});

		// Aggregate by day for monthly view
		data.days = {};
		rawData.forEach(traffic => {
			const timestamp = parseInt(traffic._id, 10);
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
