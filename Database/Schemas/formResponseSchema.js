const Schema = require("../Schema");

module.exports = new Schema({
	form_id: {
		type: String,
		required: true,
	},
	server_id: {
		type: String,
		required: true,
	},
	user_id: {
		type: String,
		required: true,
	},
	responses: {
		type: Object,
		required: true,
	},
	status: {
		type: String,
		enum: ["pending", "approved", "rejected"],
		default: "pending",
	},
	reviewed_by: {
		type: String,
		default: null,
	},
	review_notes: {
		type: String,
		default: null,
	},
	submitted_at: {
		type: Date,
		default: Date.now,
	},
	reviewed_at: {
		type: Date,
		default: null,
	},
});
