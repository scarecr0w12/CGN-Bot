const Schema = require("../Schema");

module.exports = new Schema({
	isEnabled: {
		type: Boolean,
		default: false,
	},
	channel_id: String,
	current_id: {
		type: Number,
		default: 0,
	},
	retention_days: {
		type: Number,
		default: 90,
	},
	events: new Schema({
		strikes: {
			type: Boolean,
			default: true,
		},
		kicks: {
			type: Boolean,
			default: true,
		},
		bans: {
			type: Boolean,
			default: true,
		},
		mutes: {
			type: Boolean,
			default: true,
		},
		filter_violations: {
			type: Boolean,
			default: true,
		},
		raid_alerts: {
			type: Boolean,
			default: true,
		},
		alt_detection: {
			type: Boolean,
			default: true,
		},
		message_deleted: {
			type: Boolean,
			default: true,
		},
		message_edited: {
			type: Boolean,
			default: true,
		},
		member_joined: {
			type: Boolean,
			default: true,
		},
		member_left: {
			type: Boolean,
			default: true,
		},
		role_created: {
			type: Boolean,
			default: true,
		},
		role_deleted: {
			type: Boolean,
			default: true,
		},
		role_modified: {
			type: Boolean,
			default: true,
		},
		channel_created: {
			type: Boolean,
			default: true,
		},
		channel_deleted: {
			type: Boolean,
			default: true,
		},
		channel_modified: {
			type: Boolean,
			default: true,
		},
		bulk_delete: {
			type: Boolean,
			default: true,
		},
	}),
	entries: [new Schema({
		_id: {
			type: Number,
			required: true,
		},
		timestamp: {
			type: Date,
			default: Date.now,
		},
		type: {
			type: String,
			enum: [
				"Add Role",
				"Ban",
				"Block",
				"Kick",
				"Mute",
				"Other",
				"Remove Role",
				"Softban",
				"Unban",
				"Unmute",
				"Strike",
				"Strike Removed",
				"Strikes Cleared",
				"Temp Ban",
				"Temp Mute",
				"Delete Role",
				"Modify Role",
				"Create Role",
				"Filter Violation",
				"Spam Detected",
				"Raid Detected",
				"Kick (Alt Detection)",
				"Ban (Alt Detection)",
				"Quarantine",
				"Message Deleted",
				"Message Edited",
				"Member Joined",
				"Member Left",
				"Channel Created",
				"Channel Deleted",
				"Channel Modified",
				"Bulk Delete",
			],
			required: true,
		},
		affected_user: {
			type: String,
		},
		affected_role: {
			type: String,
		},
		affected_channel: {
			type: String,
		},
		creator: {
			type: String,
			required: true,
		},
		message_id: {
			type: String,
			required: true,
		},
		reason: {
			type: String,
			maxlength: 1500,
		},
		severity: {
			type: String,
			enum: ["low", "medium", "high", "critical"],
			default: "medium",
		},
		isValid: {
			type: Boolean,
			default: true,
		},
		canEdit: {
			type: Boolean,
			default: true,
		},
		edit_history: [new Schema({
			edited_at: Date,
			edited_by: String,
			old_reason: String,
			new_reason: String,
		})],
		metadata: Schema.Mixed,
	})],
});
