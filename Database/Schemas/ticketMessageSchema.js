const Schema = require("../Schema");

// Messages within a ticket thread
module.exports = new Schema({
	_id: {
		type: String,
		required: true,
	},
	// Reference to parent ticket
	ticket_id: {
		type: String,
		required: true,
	},
	// Author info
	author_id: {
		type: String,
		required: true,
	},
	author_username: {
		type: String,
		default: "",
	},
	author_avatar: {
		type: String,
		default: "",
	},
	// Whether this is from staff or user
	is_staff: {
		type: Boolean,
		default: false,
	},
	// Message content
	content: {
		type: String,
		required: true,
	},
	// Attachments (URLs)
	attachments: {
		type: Array,
		default: [],
	},
	// Discord message ID (for reference)
	discord_message_id: {
		type: String,
		default: null,
	},
	// Whether this is a system message (status change, assignment, etc.)
	is_system_message: {
		type: Boolean,
		default: false,
	},
	// Timestamp
	created_at: {
		type: Date,
		default: Date.now,
	},
});
