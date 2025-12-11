/* eslint node/exports-style: ["error", "exports"] */

// Lazy load mariadb - only require when initialize() is called
let mariadb = null;
let ModelSQL = null;

const { addToGlobal } = require("../Modules/Utils/GlobalDefines.js");

let pool = null;

/**
 * Prepares models, creates and connects a connection pool to MariaDB
 * @param {object} config A set of MariaDB config options
 * @returns {Promise<Object>}
 */
exports.initialize = async () => {
	// Lazy load dependencies
	if (!mariadb) mariadb = require("mariadb");
	if (!ModelSQL) ModelSQL = require("./ModelSQL");

	// Read MariaDB config from environment variables
	const host = process.env.MARIADB_HOST || "localhost";
	const port = parseInt(process.env.MARIADB_PORT || "3306", 10);
	const user = process.env.MARIADB_USER;
	const password = process.env.MARIADB_PASSWORD;
	const database = process.env.MARIADB_DATABASE;
	const connectionLimit = parseInt(process.env.MARIADB_POOL_SIZE || "10", 10);

	console.log(`[MariaDB] Connecting to ${host}:${port}/${database} as ${user}`);

	pool = mariadb.createPool({
		host,
		port,
		user,
		password,
		database,
		connectionLimit,
		acquireTimeout: 30000,
		// Enable JSON support
		insertIdAsNumber: true,
		bigIntAsNumber: true,
		// Helpful for debugging
		trace: process.env.NODE_ENV === "development",
	});

	// Test connection
	let conn;
	try {
		conn = await pool.getConnection();
		await conn.query("SELECT 1");
		console.log("[MariaDB] Connection pool established successfully");
	} finally {
		if (conn) conn.release();
	}

	// Helper function to get the pool
	const getPool = () => pool;

	const [
		Servers,
		Users,
		Gallery,
		Blog,
		Wiki,
		Traffic,
		Votes,
		GlobalFilters,
		GlobalRanks,
		GlobalRSSFeeds,
		GlobalStatusMessages,
		GlobalTagReactions,
		GlobalTags,
		GlobalTrivia,
		SiteSettings,
		Feedback,
	] = [
		new ModelSQL(getPool, "servers", require("./Schemas/serverSchema")),
		new ModelSQL(getPool, "users", require("./Schemas/userSchema")),
		new ModelSQL(getPool, "gallery", require("./Schemas/gallerySchema")),
		new ModelSQL(getPool, "blog", require("./Schemas/blogSchema")),
		new ModelSQL(getPool, "wiki", require("./Schemas/wikiSchema")),
		new ModelSQL(getPool, "traffic", require("./Schemas/trafficSchema")),
		new ModelSQL(getPool, "votes", require("./Schemas/votesSchema")),
		new ModelSQL(getPool, "global_filters", require("./Schemas/globalFilterSchema")),
		new ModelSQL(getPool, "global_ranks", require("./Schemas/globalRankSchema")),
		new ModelSQL(getPool, "global_rss_feeds", require("./Schemas/globalRSSFeedSchema")),
		new ModelSQL(getPool, "global_status_messages", require("./Schemas/globalStatusMessageSchema")),
		new ModelSQL(getPool, "global_tag_reactions", require("./Schemas/globalTagReactionSchema")),
		new ModelSQL(getPool, "global_tags", require("./Schemas/globalTagSchema")),
		new ModelSQL(getPool, "global_trivia", require("./Schemas/globalTriviaSchema")),
		new ModelSQL(getPool, "site_settings", require("./Schemas/siteSettingsSchema")),
		new ModelSQL(getPool, "feedback", require("./Schemas/feedbackSchema")),
	];

	addToGlobal("Servers", Servers);
	addToGlobal("Users", Users);
	addToGlobal("Gallery", Gallery);
	addToGlobal("Blog", Blog);
	addToGlobal("Wiki", Wiki);
	addToGlobal("Votes", Votes);
	addToGlobal("GlobalFilters", GlobalFilters);
	addToGlobal("GlobalRanks", GlobalRanks);
	addToGlobal("GlobalRSSFeeds", GlobalRSSFeeds);
	addToGlobal("GlobalStatusMessages", GlobalStatusMessages);
	addToGlobal("GlobalTagReactions", GlobalTagReactions);
	addToGlobal("GlobalTags", GlobalTags);
	addToGlobal("GlobalTrivia", GlobalTrivia);
	addToGlobal("SiteSettings", SiteSettings);
	addToGlobal("Feedback", Feedback);
	addToGlobal("Client", pool);
	addToGlobal("Database", {
		Servers, servers: Servers,
		Users, users: Users,
		Gallery, gallery: Gallery,
		Blog, blog: Blog,
		Wiki, wiki: Wiki,
		Traffic, traffic: Traffic,
		Votes, votes: Votes,
		GlobalFilters, globalFilters: GlobalFilters,
		GlobalRanks, globalRanks: GlobalRanks,
		GlobalRSSFeeds, globalRSSFeeds: GlobalRSSFeeds,
		GlobalStatusMessages, globalStatusMessages: GlobalStatusMessages,
		GlobalTagReactions, globalTagReactions: GlobalTagReactions,
		GlobalTags, globalTags: GlobalTags,
		GlobalTrivia, globalTrivia: GlobalTrivia,
		SiteSettings, siteSettings: SiteSettings,
		Feedback, feedback: Feedback,
		client: pool,
		pool,
	});

	return global.Database.client;
};

exports.get = exports.getConnection = () => global.Database;

/**
 * Get a connection from the pool for transactions
 * @returns {Promise<Connection>}
 */
exports.getPoolConnection = async () => {
	if (!pool) throw new Error("Database not initialized");
	return pool.getConnection();
};

/**
 * Execute a raw query
 * @param {string} sql SQL query string
 * @param {Array} params Query parameters
 * @returns {Promise<Array>}
 */
exports.query = async (sql, params = []) => {
	let conn;
	try {
		conn = await pool.getConnection();
		return await conn.query(sql, params);
	} finally {
		if (conn) conn.release();
	}
};

/**
 * Execute a transaction
 * @param {Function} callback Async function receiving connection
 * @returns {Promise<*>}
 */
exports.transaction = async callback => {
	let conn;
	try {
		conn = await pool.getConnection();
		await conn.beginTransaction();
		const result = await callback(conn);
		await conn.commit();
		return result;
	} catch (err) {
		if (conn) await conn.rollback();
		throw err;
	} finally {
		if (conn) conn.release();
	}
};

/**
 * Gracefully close the connection pool
 */
exports.close = async () => {
	if (pool) {
		await pool.end();
		pool = null;
		console.log("[MariaDB] Connection pool closed");
	}
};
