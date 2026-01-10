const Schema = require("../Schema.js");

// Simple UUID generator for MariaDB
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

module.exports = new Schema({
	_id: {
		type: String,
		default: generateId,
	},
	server_id: {
		type: String,
		required: true,
	},
	enabled: {
		type: Boolean,
		default: false,
	},
	channel_id: {
		type: String,
		required: true,
	},
	// Alert types
	epic_free_games: {
		type: Boolean,
		default: true,
	},
	steam_sales: {
		type: Boolean,
		default: true,
	},
	steam_free_games: {
		type: Boolean,
		default: true,
	},
	// Notification settings
	role_mention: {
		type: String,
		default: null, // Role ID to mention
	},
	custom_message: {
		type: String,
		default: null,
	},
	// Filters
	min_discount: {
		type: Number,
		default: 50,
	},
	max_price: {
		type: Number,
		default: null,
	},
	free_only: {
		type: Boolean,
		default: false,
	},
	// Tags/genres filter (comma-separated)
	steam_tags: {
		type: Array,
		default: [],
	},
	// Tracking
	last_epic_check: {
		type: Date,
		default: null,
	},
	last_steam_check: {
		type: Date,
		default: null,
	},
	notified_games: {
		type: Array,
		default: [], // Array of game IDs already notified about
	},
	created_at: {
		type: Date,
		default: Date.now,
	},
	updated_at: {
		type: Date,
		default: Date.now,
	},
});
