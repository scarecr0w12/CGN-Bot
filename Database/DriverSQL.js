/* eslint node/exports-style: ["error", "exports"] */
const mariadb = require("mariadb");

const ModelSQL = require("./ModelSQL");
const { addToGlobal } = require("../Modules/Utils/GlobalDefines.js");

let pool = null;

/**
 * Prepares models, creates and connects a connection pool to MariaDB
 * @param {object} config A set of MariaDB config options
 * @returns {Promise<Object>}
 */
exports.initialize = async config => {
	pool = mariadb.createPool({
		host: config.host || "localhost",
		port: config.port || 3306,
		user: config.user,
		password: config.password,
		database: config.database,
		connectionLimit: config.connectionLimit || 10,
		acquireTimeout: config.acquireTimeout || 30000,
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
		new ModelSQL(pool, "servers", require("./Schemas/serverSchema")),
		new ModelSQL(pool, "users", require("./Schemas/userSchema")),
		new ModelSQL(pool, "gallery", require("./Schemas/gallerySchema")),
		new ModelSQL(pool, "blog", require("./Schemas/blogSchema")),
		new ModelSQL(pool, "wiki", require("./Schemas/wikiSchema")),
		new ModelSQL(pool, "traffic", require("./Schemas/trafficSchema")),
		new ModelSQL(pool, "votes", require("./Schemas/votesSchema")),
		new ModelSQL(pool, "global_filters", require("./Schemas/globalFilterSchema")),
		new ModelSQL(pool, "global_ranks", require("./Schemas/globalRankSchema")),
		new ModelSQL(pool, "global_rss_feeds", require("./Schemas/globalRSSFeedSchema")),
		new ModelSQL(pool, "global_status_messages", require("./Schemas/globalStatusMessageSchema")),
		new ModelSQL(pool, "global_tag_reactions", require("./Schemas/globalTagReactionSchema")),
		new ModelSQL(pool, "global_tags", require("./Schemas/globalTagSchema")),
		new ModelSQL(pool, "global_trivia", require("./Schemas/globalTriviaSchema")),
		new ModelSQL(pool, "site_settings", require("./Schemas/siteSettingsSchema")),
		new ModelSQL(pool, "feedback", require("./Schemas/feedbackSchema")),
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
