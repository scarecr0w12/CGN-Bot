const Schema = require("../Schema");

/**
 * Server Ticket Message Schema - Messages within server tickets
 * Stored separately for easier querying and transcript generation
 */
module.exports = new Schema({
	_id: {
		type: String,
		required: true,
	},
	// Reference to the parent ticket
	ticket_id: {
		type: String,
		required: true,
	},
	// Server ID for indexing
	server_id: {
		type: String,
		required: true,
	},
	// Discord message ID for reference
	discord_message_id: {
		type: String,
		default: null,
	},
	// Author information
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
	// Whether this is from a staff member
	is_staff: {
		type: Boolean,
		default: false,
	},
	// Message content
	content: {
		type: String,
		default: "",
	},
	// Attachments (URLs)
	attachments: [String],
	// Embeds (stored as JSON)
	embeds: [Object],
	// System message (ticket opened, closed, user added, etc.)
	is_system_message: {
		type: Boolean,
		default: false,
	},
	system_action: {
		type: String,
		enum: [null, "opened", "closed", "claimed", "unclaimed", "user_added", "user_removed",
			"priority_changed", "category_changed", "renamed", "reopened"],
		default: null,
	},
	// Timestamp
	created_at: {
		type: Date,
		default: Date.now,
	},
});
