const Schema = require("../Schema");

module.exports = new Schema({
	server_id: {
		type: String,
		required: true,
	},
	name: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		default: "",
	},
	fields: {
		type: Array,
		default: [],
	},
	submit_channel: {
		type: String,
		default: null,
	},
	review_channel: {
		type: String,
		default: null,
	},
	auto_role_id: {
		type: String,
		default: null,
	},
	webhook_url: {
		type: String,
		default: null,
	},
	enabled: {
		type: Boolean,
		default: true,
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
