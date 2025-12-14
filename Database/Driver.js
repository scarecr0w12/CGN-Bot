/* eslint node/exports-style: ["error", "exports"] */

// Load environment variables early - this file may be required before main app loads dotenv
require("dotenv").config();

// Database backend selection based on DATABASE_TYPE environment variable
const databaseType = process.env.DATABASE_TYPE || "mongodb";

// If using MariaDB, delegate to DriverSQL
if (databaseType === "mariadb") {
	// eslint-disable-next-line node/exports-style
	module.exports = require("./DriverSQL");
} else {
	// MongoDB implementation (default)
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
			Votes,
			VoteRewardTransactions,
			GlobalFilters,
			GlobalRanks,
			GlobalRSSFeeds,
			GlobalStatusMessages,
			GlobalTagReactions,
			GlobalTags,
			GlobalTrivia,
			SiteSettings,
			Feedback,
			Tickets,
			TicketMessages,
			ServerTickets,
			ServerTicketMessages,
			ServerAnalytics,
			RolePanels,
			TempRoles,
			InviteTracking,
			Snippets,
		] = [
			new Model(db, "servers", require("./Schemas/serverSchema")),
			new Model(db, "users", require("./Schemas/userSchema")),
			new Model(db, "gallery", require("./Schemas/gallerySchema")),
			new Model(db, "blog", require("./Schemas/blogSchema")),
			new Model(db, "wiki", require("./Schemas/wikiSchema")),
			new Model(db, "traffic", require("./Schemas/trafficSchema")),
			new Model(db, "votes", require("./Schemas/votesSchema")),
			new Model(db, "vote_reward_transactions", require("./Schemas/voteRewardTransactionSchema")),
			new Model(db, "global_filters", require("./Schemas/globalFilterSchema")),
			new Model(db, "global_ranks", require("./Schemas/globalRankSchema")),
			new Model(db, "global_rss_feeds", require("./Schemas/globalRSSFeedSchema")),
			new Model(db, "global_status_messages", require("./Schemas/globalStatusMessageSchema")),
			new Model(db, "global_tag_reactions", require("./Schemas/globalTagReactionSchema")),
			new Model(db, "global_tags", require("./Schemas/globalTagSchema")),
			new Model(db, "global_trivia", require("./Schemas/globalTriviaSchema")),
			new Model(db, "site_settings", require("./Schemas/siteSettingsSchema")),
			new Model(db, "feedback", require("./Schemas/feedbackSchema")),
			new Model(db, "tickets", require("./Schemas/ticketSchema")),
			new Model(db, "ticket_messages", require("./Schemas/ticketMessageSchema")),
			new Model(db, "server_tickets", require("./Schemas/serverTicketSchema")),
			new Model(db, "server_ticket_messages", require("./Schemas/serverTicketMessageSchema")),
			new Model(db, "server_analytics", require("./Schemas/serverAnalyticsSchema")),
			new Model(db, "role_panels", require("./Schemas/rolePanelSchema")),
			new Model(db, "temp_roles", require("./Schemas/tempRoleSchema")),
			new Model(db, "invite_tracking", require("./Schemas/inviteTrackingSchema")),
			new Model(db, "snippets", require("./Schemas/snippetSchema")),
		];
		addToGlobal("Servers", Servers);
		addToGlobal("Users", Users);
		addToGlobal("Gallery", Gallery);
		addToGlobal("Blog", Blog);
		addToGlobal("Wiki", Wiki);
		addToGlobal("Votes", Votes);
		addToGlobal("VoteRewardTransactions", VoteRewardTransactions);
		addToGlobal("GlobalFilters", GlobalFilters);
		addToGlobal("GlobalRanks", GlobalRanks);
		addToGlobal("GlobalRSSFeeds", GlobalRSSFeeds);
		addToGlobal("GlobalStatusMessages", GlobalStatusMessages);
		addToGlobal("GlobalTagReactions", GlobalTagReactions);
		addToGlobal("GlobalTags", GlobalTags);
		addToGlobal("GlobalTrivia", GlobalTrivia);
		addToGlobal("SiteSettings", SiteSettings);
		addToGlobal("Feedback", Feedback);
		addToGlobal("Tickets", Tickets);
		addToGlobal("TicketMessages", TicketMessages);
		addToGlobal("ServerTickets", ServerTickets);
		addToGlobal("ServerTicketMessages", ServerTicketMessages);
		addToGlobal("ServerAnalytics", ServerAnalytics);
		addToGlobal("RolePanels", RolePanels);
		addToGlobal("TempRoles", TempRoles);
		addToGlobal("InviteTracking", InviteTracking);
		addToGlobal("Snippets", Snippets);
		addToGlobal("Client", db);
		addToGlobal("Database", {
			Servers, servers: Servers,
			Users, users: Users,
			Gallery, gallery: Gallery,
			Blog, blog: Blog,
			Wiki, wiki: Wiki,
			Traffic, traffic: Traffic,
			Votes, votes: Votes,
			VoteRewardTransactions, voteRewardTransactions: VoteRewardTransactions,
			GlobalFilters, globalFilters: GlobalFilters,
			GlobalRanks, globalRanks: GlobalRanks,
			GlobalRSSFeeds, globalRSSFeeds: GlobalRSSFeeds,
			GlobalStatusMessages, globalStatusMessages: GlobalStatusMessages,
			GlobalTagReactions, globalTagReactions: GlobalTagReactions,
			GlobalTags, globalTags: GlobalTags,
			GlobalTrivia, globalTrivia: GlobalTrivia,
			SiteSettings, siteSettings: SiteSettings,
			Feedback, feedback: Feedback,
			Tickets, tickets: Tickets,
			TicketMessages, ticketMessages: TicketMessages,
			ServerTickets, serverTickets: ServerTickets,
			ServerTicketMessages, serverTicketMessages: ServerTicketMessages,
			ServerAnalytics, serverAnalytics: ServerAnalytics,
			RolePanels, rolePanels: RolePanels,
			TempRoles, tempRoles: TempRoles,
			InviteTracking, inviteTracking: InviteTracking,
			Snippets, snippets: Snippets,
			client: db,
			mongoClient,
		});
		return global.Database.client;
	};

	exports.get = exports.getConnection = () => global.Database;
}
