const Schema = require("../Schema");

// Schema for tracking invite usage and who invited whom
const inviteTrackingSchema = new Schema({
	_id: {
		type: String,
		required: true,
	},
	server_id: {
		type: String,
		required: true,
	},
	// The invite code
	code: {
		type: String,
		required: true,
	},
	// Who created the invite
	inviter_id: {
		type: String,
		required: true,
	},
	// Total uses of this invite
	uses: {
		type: Number,
		default: 0,
	},
	// Members who joined using this invite
	members: [new Schema({
		_id: {
			type: String,
			required: true,
		},
		joined_at: {
			type: Date,
			default: Date.now,
		},
		// Track if they're still in the server
		left: {
			type: Boolean,
			default: false,
		},
		left_at: {
			type: Date,
		},
	})],
	// When the invite was created
	created_at: {
		type: Date,
		default: Date.now,
	},
	// Optional: max uses, expiry, etc.
	max_uses: {
		type: Number,
		default: 0,
	},
	expires_at: {
		type: Date,
	},
	// Channel the invite is for
	channel_id: {
		type: String,
	},
	// Custom label for the invite
	label: {
		type: String,
		maxlength: 50,
	},
});

module.exports = inviteTrackingSchema;
