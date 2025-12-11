const Schema = require("../Schema");

// Server Schema
module.exports = new Schema({
	_id: {
		type: String,
		required: true,
	},
	added_timestamp: {
		type: Date,
		default: Date.now,
	},

	// Server Subscription/Tier information (premium is per-server, not per-user)
	subscription: new Schema({
		tier_id: {
			type: String,
			default: "free",
		},
		source: {
			type: String,
			enum: ["manual", "stripe", "paypal", "btcpay", "patreon", "gift", "system"],
			default: "manual",
		},
		external_subscription_id: String,
		// User who purchased/manages the subscription
		purchased_by: String,
		started_at: Date,
		expires_at: Date,
		is_active: {
			type: Boolean,
			default: true,
		},
		// Features granted/revoked at the server level
		granted_features: [String],
		revoked_features: [String],
		// Subscription history
		history: [new Schema({
			tier_id: {
				type: String,
				required: true,
			},
			source: String,
			purchased_by: String,
			started_at: Date,
			ended_at: Date,
			reason: String,
		})],
	}),

	// Payment provider customer IDs for webhook lookups (server-level)
	payment_ids: new Schema({
		stripe_customer_id: String,
		paypal_customer_id: String,
		btcpay_customer_id: String,
	}),

	config: require("./serverConfigSchema.js"),
	extensions: [require("./serverGallerySchema.js")],
	members: require("./serverMembersSchema.js"),
	games: [require("./serverGamesSchema.js")],
	channels: require("./serverChannelsSchema.js"),
	command_usage: {
		type: Object,
		default: {},
	},
	messages_today: {
		type: Number,
		default: 0,
	},
	stats_timestamp: {
		type: Date,
		default: Date.now,
	},
	voice_data: [new Schema({
		_id: {
			type: String,
			required: true,
		},
		started_timestamp: {
			type: Date,
			required: true,
		},
	})],
	logs: [new Schema({
		timestamp: {
			type: Date,
			required: false,
			default: Date.now,
		},
		level: {
			type: String,
			required: true,
		},
		content: {
			type: String,
			required: true,
		},
		userid: {
			type: String,
			required: false,
		},
		channelid: {
			type: String,
			required: false,
		},
	}, { _id: false })],
	modlog: require("./serverModlogSchema.js"),
});
