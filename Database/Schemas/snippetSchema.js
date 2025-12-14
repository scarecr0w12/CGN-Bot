const Schema = require("../Schema");

module.exports = new Schema({
	_id: {
		type: String,
		required: true,
	},
	user_id: {
		type: String,
		required: true,
		index: true,
	},
	server_id: {
		type: String,
		required: true,
		index: true,
	},
	name: {
		type: String,
		required: true,
	},
	language: {
		type: String,
		default: "txt",
	},
	code: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		default: "",
	},
	is_public: {
		type: Boolean,
		default: false,
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
