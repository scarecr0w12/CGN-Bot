const Schema = require("../Schema");

// Feedback entries submitted by users
module.exports = new Schema({
	_id: {
		type: String,
		required: true,
	},
	user_id: {
		type: String,
		required: true,
	},
	username: {
		type: String,
		default: "",
	},
	category: {
		type: String,
		required: true,
		enum: ["bug", "feature", "improvement", "question", "other"],
	},
	message: {
		type: String,
		required: true,
	},
	page_url: {
		type: String,
		default: "",
	},
	status: {
		type: String,
		default: "new",
		enum: ["new", "in_progress", "resolved", "closed"],
	},
	admin_notes: {
		type: String,
		default: "",
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
