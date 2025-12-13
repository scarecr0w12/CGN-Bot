const { ObjectId } = require("mongodb");
const Schema = require("../Schema");

module.exports = Schema.Map({
	_id: {
		type: String,
		required: true,
	},
	messages: {
		type: Number,
		default: 0,
		min: 0,
	},
	voice: {
		type: Number,
		default: 0,
		min: 0,
	},
	rank: {
		type: String,
		default: "No Rank",
	},
	rank_score: {
		type: Number,
		default: 0,
		min: 0,
	},
	afk_message: String,
	last_active: Date,
	cannotAutokick: {
		type: Boolean,
		default: false,
	},
	strikes: [new Schema({
		_id: {
			type: String,
			default: () => new ObjectId().toString(),
		},
		admin: {
			type: String,
			required: true,
		},
		reason: {
			type: String,
			required: true,
			maxlength: 2000,
		},
		timestamp: {
			type: Date,
			default: Date.now,
		},
		modlog_entry: {
			type: Number,
		},
	})],
	profile_fields: Schema.Mixed,
	// Server-specific profile
	server_profile: new Schema({
		bio: {
			type: String,
			maxlength: 500,
		},
		banner_color: {
			type: String,
			default: "#5865F2",
		},
		visibility: {
			type: String,
			enum: ["public", "members_only", "private"],
			default: "public",
		},
	}),
	// Track when user joined server (for profile display)
	joined_at: Date,
	muted: [new Schema({
		_id: {
			type: String,
			required: true,
		},
		since: {
			type: Date,
			default: Date.now,
		},
	})],
});
