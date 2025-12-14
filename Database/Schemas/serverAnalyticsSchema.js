const Schema = require("../Schema");

/**
 * Server Analytics Schema
 * Stores historical analytics data for premium servers
 * Data is aggregated daily and stored for trend analysis
 */
module.exports = new Schema({
	_id: {
		type: String,
		required: true,
	},
	server_id: {
		type: String,
		required: true,
	},
	date: {
		type: Date,
		required: true,
	},
	// Daily message counts per channel
	channel_activity: [new Schema({
		_id: {
			type: String,
			required: true,
		},
		channel_name: {
			type: String,
		},
		message_count: {
			type: Number,
			default: 0,
		},
	})],
	// Daily message counts per hour (0-23) for heatmap
	hourly_activity: [new Schema({
		_id: {
			type: Number,
			min: 0,
			max: 23,
		},
		message_count: {
			type: Number,
			default: 0,
		},
	})],
	// Daily member activity
	member_activity: new Schema({
		active_members: {
			type: Number,
			default: 0,
		},
		new_messages: {
			type: Number,
			default: 0,
		},
		voice_minutes: {
			type: Number,
			default: 0,
		},
	}),
	// Join/leave tracking
	join_leave: new Schema({
		joins: {
			type: Number,
			default: 0,
		},
		leaves: {
			type: Number,
			default: 0,
		},
		net_change: {
			type: Number,
			default: 0,
		},
	}),
	// Command usage stats
	command_usage: Schema.Mixed,
	// Role engagement (members per role)
	role_engagement: [new Schema({
		_id: {
			type: String,
			required: true,
		},
		role_name: {
			type: String,
		},
		member_count: {
			type: Number,
			default: 0,
		},
		active_members: {
			type: Number,
			default: 0,
		},
	})],
	// Summary stats
	summary: new Schema({
		total_messages: {
			type: Number,
			default: 0,
		},
		total_members: {
			type: Number,
			default: 0,
		},
		peak_hour: {
			type: Number,
			min: 0,
			max: 23,
		},
		most_active_channel: {
			type: String,
		},
	}),
	created_at: {
		type: Date,
		default: Date.now,
	},
});
