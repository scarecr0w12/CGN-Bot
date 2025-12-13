const Schema = require("../Schema");

// Global support tickets - users DM the bot to create tickets with maintainers
module.exports = new Schema({
	_id: {
		type: String,
		required: true,
	},
	// Ticket number for display (auto-incremented)
	ticket_number: {
		type: Number,
		required: true,
	},
	// User who created the ticket
	user_id: {
		type: String,
		required: true,
	},
	username: {
		type: String,
		default: "",
	},
	user_avatar: {
		type: String,
		default: "",
	},
	// Ticket subject/title
	subject: {
		type: String,
		required: true,
	},
	// Ticket category
	category: {
		type: String,
		default: "general",
		enum: ["general", "bug", "feature", "billing", "account", "other"],
	},
	// Priority level
	priority: {
		type: String,
		default: "normal",
		enum: ["low", "normal", "high", "urgent"],
	},
	// Current status
	status: {
		type: String,
		default: "open",
		enum: ["open", "in_progress", "awaiting_response", "on_hold", "resolved", "closed"],
	},
	// Assigned maintainer (null if unassigned)
	assigned_to: {
		type: String,
		default: null,
	},
	assigned_to_username: {
		type: String,
		default: "",
	},
	// DM channel ID for communication with user
	dm_channel_id: {
		type: String,
		default: null,
	},
	// Tags for organization
	tags: {
		type: Array,
		default: [],
	},
	// Internal notes (not visible to user)
	internal_notes: {
		type: String,
		default: "",
	},
	// Message count
	message_count: {
		type: Number,
		default: 1,
	},
	// Last message preview
	last_message_preview: {
		type: String,
		default: "",
	},
	// Last activity timestamp
	last_activity_at: {
		type: Date,
		default: Date.now,
	},
	// Resolution notes (when closed)
	resolution_notes: {
		type: String,
		default: "",
	},
	// Timestamps
	created_at: {
		type: Date,
		default: Date.now,
	},
	updated_at: {
		type: Date,
		default: Date.now,
	},
	closed_at: {
		type: Date,
		default: null,
	},
});
