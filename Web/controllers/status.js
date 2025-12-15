const moment = require("moment");
const uptimeKuma = require("../../Modules/UptimeKuma");
const { getRoundedUptime } = require("../helpers");

module.exports = async (req, { res }) => {
	const uptime = process.uptime();
	const guildSize = await req.app.client.guilds.totalCount;
	const userSize = await req.app.client.users.totalCount;

	// Get Uptime Kuma status data
	const statusData = await uptimeKuma.getStatusData();

	res.setPageData({
		page: "status.ejs",
		rawServerCount: guildSize,
		rawUserCount: `${Math.floor(userSize / 1000)}K`,
		rawUptime: moment.duration(uptime, "seconds").humanize(),
		roundedUptime: getRoundedUptime(uptime),
		uptimeKuma: statusData,
		lastUpdated: new Date().toISOString(),
	});

	res.render();
};

// API endpoint for status data
module.exports.api = async (req, res) => {
	const uptime = process.uptime();
	const guildSize = await req.app.client.guilds.totalCount;
	const userSize = await req.app.client.users.totalCount;
	const statusData = await uptimeKuma.getStatusData();

	res.json({
		bot: {
			uptime: uptime,
			uptimeFormatted: getRoundedUptime(uptime),
			servers: guildSize,
			users: userSize,
		},
		monitors: statusData.monitors,
		overallStatus: statusData.overallStatus,
		uptimePercentage: statusData.uptimePercentage,
		available: statusData.available,
		lastUpdated: new Date().toISOString(),
	});
};

// API endpoint for shard health metrics
module.exports.shards = async (req, res) => {
	try {
		const client = req.app.client;

		// Get shard data from current shard
		const currentShardData = {
			id: parseInt(client.shardID),
			users: client.users.cache.size,
			guilds: client.guilds.cache.size,
			ping: Math.floor(client.ws.ping),
			rss: Math.floor((process.memoryUsage().rss / 1024) / 1024),
			uptime: Math.round(((process.uptime() / 60) / 60) * 10) / 10,
			pid: process.pid,
			ready: client.isReady,
		};

		// Try to get data from all shards via IPC broadcast
		let allShardData = [currentShardData];
		try {
			const ipcResults = await client.IPC.send("shardData", {}, "*");
			if (Array.isArray(ipcResults)) {
				allShardData = ipcResults.map((data, idx) => ({
					id: data?.ID ?? idx,
					users: data?.users ?? 0,
					guilds: data?.guilds ?? 0,
					ping: data?.ping ?? -1,
					rss: data?.rss ?? 0,
					uptime: data?.uptime ?? 0,
					pid: data?.PID ?? null,
					ready: !data?.isFrozen,
					worker: data?.worker ?? null,
				}));
			}
		} catch (err) {
			// If IPC fails, just return current shard data
		}

		const totalShards = parseInt(process.env.SHARD_COUNT) || 1;
		const readyShards = allShardData.filter(s => s.ready).length;

		res.json({
			totalShards,
			readyShards,
			shards: allShardData,
			timestamp: new Date().toISOString(),
		});
	} catch (err) {
		res.status(500).json({ error: "Failed to fetch shard metrics" });
	}
};
