const Schema = require("../Schema");

/**
 * Server Ticket Schema - Per-server tickets for internal support
 * Used by server owners who install the ticket system (Tier 2)
 */
module.exports = new Schema({
	_id: {
		type: String,
		required: true,
	},
	// Server this ticket belongs to
	server_id: {
		type: String,
		required: true,
	},
	// Auto-incrementing ticket number per server
	ticket_number: {
		type: Number,
		required: true,
	},
	// The Discord channel created for this ticket
	channel_id: {
		type: String,
		required: true,
	},
	// User who opened the ticket
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
	// Ticket category (configured by server owner)
	category_id: {
		type: String,
		default: "general",
	},
	category_name: {
		type: String,
		default: "General",
	},
	// Ticket subject/topic
	subject: {
		type: String,
		default: "Support Request",
	},
	// Ticket status
	status: {
		type: String,
		enum: ["open", "in_progress", "on_hold", "closed"],
		default: "open",
	},
	// Priority level
	priority: {
		type: String,
		enum: ["low", "normal", "high", "urgent"],
		default: "normal",
	},
	// Staff member assigned to this ticket
	assigned_to: {
		type: String,
		default: null,
	},
	assigned_username: {
		type: String,
		default: null,
	},
	// Users added to the ticket (besides the opener)
	participants: [String],
	// Staff who have claimed/participated
	staff_participants: [String],
	// Internal staff notes (not visible to user)
	internal_notes: {
		type: String,
		default: "",
	},
	// Message count for quick stats
	message_count: {
		type: Number,
		default: 0,
	},
	// Transcript channel (where transcript was sent)
	transcript_channel_id: {
		type: String,
		default: null,
	},
	transcript_message_id: {
		type: String,
		default: null,
	},
	// Closed by info
	closed_by: {
		type: String,
		default: null,
	},
	closed_reason: {
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
	last_activity_at: {
		type: Date,
		default: Date.now,
	},
});
