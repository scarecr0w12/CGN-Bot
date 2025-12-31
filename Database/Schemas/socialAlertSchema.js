const Schema = require("../Schema");

module.exports = new Schema({
	server_id: {
		type: String,
		required: true,
	},
	channel_id: {
		type: String,
		required: true,
	},
	platform: {
		type: String,
		required: true,
		enum: ["twitch", "youtube", "twitter", "reddit"],
	},
	account_id: {
		type: String,
		required: true,
	},
	account_name: {
		type: String,
		required: true,
	},
	template: {
		type: Object,
		default: {},
	},
	role_mentions: {
		type: Array,
		default: [],
	},
	last_check: {
		type: Date,
		default: null,
	},
	last_status: {
		type: Object,
		default: {},
	},
	enabled: {
		type: Boolean,
		default: true,
	},
	created_at: {
		type: Date,
		default: Date.now,
	},
});
