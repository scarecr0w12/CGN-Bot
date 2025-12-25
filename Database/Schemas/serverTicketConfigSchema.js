const Schema = require("../Schema");

/**
 * Server Ticket Config Schema - Embedded in serverSchema.js
 * Configuration for the per-server ticket system
 */
module.exports = new Schema({
	// Whether the ticket system is enabled
	enabled: {
		type: Boolean,
		default: false,
	},
	// Category (Discord channel category) for ticket channels
	ticket_category_id: {
		type: String,
		default: null,
	},
	// Channel for ticket transcripts
	transcript_channel_id: {
		type: String,
		default: null,
	},
	// Log channel for ticket events
	log_channel_id: {
		type: String,
		default: null,
	},
	// Support roles that can manage tickets
	support_roles: [String],
	// Ticket categories users can choose from
	categories: [new Schema({
		_id: {
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
		emoji: {
			type: String,
			default: "🎫",
		},
		// Specific roles notified for this category
		ping_roles: [String],
		// Welcome message for this category
		welcome_message: {
			type: String,
			default: "",
		},
	})],
	// Default welcome message if category doesn't have one
	default_welcome_message: {
		type: String,
		default: "Thank you for creating a ticket! A staff member will be with you shortly.",
	},
	// Ticket naming pattern
	channel_name_pattern: {
		type: String,
		default: "ticket-{number}",
	},
	// Auto-close settings
	auto_close: new Schema({
		enabled: {
			type: Boolean,
			default: false,
		},
		// Hours of inactivity before auto-close warning
		inactive_hours: {
			type: Number,
			default: 48,
		},
		// Hours after warning before actual close
		warning_hours: {
			type: Number,
			default: 24,
		},
	}),
	// Maximum open tickets per user
	max_tickets_per_user: {
		type: Number,
		default: 3,
	},
	// Ticket counter for auto-increment
	next_ticket_number: {
		type: Number,
		default: 1,
	},
	// Panel messages (ticket creation embeds)
	panels: [new Schema({
		_id: {
			type: String,
			required: true,
		},
		channel_id: {
			type: String,
			required: true,
		},
		message_id: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			default: "Create a Ticket",
		},
		description: {
			type: String,
			default: "Click the button below to create a support ticket.",
		},
		color: {
			type: String,
			default: "#5865F2",
		},
		// Which categories are available from this panel
		category_ids: [String],
		created_at: {
			type: Date,
			default: Date.now,
		},
	})],
	// Statistics
	total_tickets: {
		type: Number,
		default: 0,
	},
	closed_tickets: {
		type: Number,
		default: 0,
	},
});
