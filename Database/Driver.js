/* eslint node/exports-style: ["error", "exports"] */
const { MongoClient } = require("mongodb");

const Model = require("./Model");
const { addToGlobal } = require("../Modules/Utils/GlobalDefines.js");

/**
 * Prepares models, creates and connects a client to MongoDB
 * @param {object} config A set of MongoDB config options
 * @returns {Promise<Object>}
 */
exports.initialize = async config => {
	const mongoClient = new MongoClient(config.URL, config.options);
	await mongoClient.connect();
	const db = mongoClient.db(config.db);
	const [
		Servers,
		Users,
		Gallery,
		Blog,
		Wiki,
		Traffic,
		GlobalFilters,
		GlobalRanks,
		GlobalRSSFeeds,
		GlobalStatusMessages,
		GlobalTagReactions,
		GlobalTags,
		GlobalTrivia,
	] = [
		new Model(db, "servers", require("./Schemas/serverSchema")),
		new Model(db, "users", require("./Schemas/userSchema")),
		new Model(db, "gallery", require("./Schemas/gallerySchema")),
		new Model(db, "blog", require("./Schemas/blogSchema")),
		new Model(db, "wiki", require("./Schemas/wikiSchema")),
		new Model(db, "traffic", require("./Schemas/trafficSchema")),
		new Model(db, "global_filters", require("./Schemas/globalFilterSchema")),
		new Model(db, "global_ranks", require("./Schemas/globalRankSchema")),
		new Model(db, "global_rss_feeds", require("./Schemas/globalRSSFeedSchema")),
		new Model(db, "global_status_messages", require("./Schemas/globalStatusMessageSchema")),
		new Model(db, "global_tag_reactions", require("./Schemas/globalTagReactionSchema")),
		new Model(db, "global_tags", require("./Schemas/globalTagSchema")),
		new Model(db, "global_trivia", require("./Schemas/globalTriviaSchema")),
	];
	addToGlobal("Servers", Servers);
	addToGlobal("Users", Users);
	addToGlobal("Gallery", Gallery);
	addToGlobal("Blog", Blog);
	addToGlobal("Wiki", Wiki);
	addToGlobal("GlobalFilters", GlobalFilters);
	addToGlobal("GlobalRanks", GlobalRanks);
	addToGlobal("GlobalRSSFeeds", GlobalRSSFeeds);
	addToGlobal("GlobalStatusMessages", GlobalStatusMessages);
	addToGlobal("GlobalTagReactions", GlobalTagReactions);
	addToGlobal("GlobalTags", GlobalTags);
	addToGlobal("GlobalTrivia", GlobalTrivia);
	addToGlobal("Client", db);
	addToGlobal("Database", {
		Servers, servers: Servers,
		Users, users: Users,
		Gallery, gallery: Gallery,
		Blog, blog: Blog,
		Wiki, wiki: Wiki,
		Traffic, traffic: Traffic,
		GlobalFilters, globalFilters: GlobalFilters,
		GlobalRanks, globalRanks: GlobalRanks,
		GlobalRSSFeeds, globalRSSFeeds: GlobalRSSFeeds,
		GlobalStatusMessages, globalStatusMessages: GlobalStatusMessages,
		GlobalTagReactions, globalTagReactions: GlobalTagReactions,
		GlobalTags, globalTags: GlobalTags,
		GlobalTrivia, globalTrivia: GlobalTrivia,
		client: db,
		mongoClient,
	});
	return global.Database.client;
};

exports.get = exports.getConnection = () => global.Database;
