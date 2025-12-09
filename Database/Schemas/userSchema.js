const Schema = require("../Schema");

// User data (past names, profile fields, etc)
module.exports = new Schema({
	_id: {
		type: String,
		required: true,
	},
	past_names: [String],
	points: {
		type: Number,
		default: 1,
	},
	afk_message: String,
	server_nicks: [new Schema({
		_id: {
			type: String,
			required: true,
			lowercase: true,
		},
		server_id: {
			type: String,
			required: true,
		},
	})],
	reminders: [new Schema({
		_id: {
			type: String,
			required: true,
		},
		name: {
			type: String,
			required: true,
		},
		expiry_timestamp: {
			type: Number,
			required: true,
		},
	})],
	location: String,
	weatherunit: String,
	last_seen: Date,
	profile_fields: Schema.Mixed,
	profile_background_image: {
		type: String,
		default: `http://i.imgur.com/8UIlbtg.jpg`,
	},
	isProfilePublic: {
		type: Boolean,
		default: true,
	},
	upvoted_gallery_extensions: [String],
	username: String,

	// Subscription/Tier information
	subscription: new Schema({
		tier_id: {
			type: String,
			default: "free",
		},
		source: {
			type: String,
			enum: ["manual", "stripe", "paypal", "btcpay", "patreon", "gift"],
			default: "manual",
		},
		external_subscription_id: String,
		started_at: Date,
		expires_at: Date,
		is_active: {
			type: Boolean,
			default: true,
		},
		granted_features: [String],
		revoked_features: [String],
		history: [new Schema({
			tier_id: {
				type: String,
				required: true,
			},
			source: String,
			started_at: Date,
			ended_at: Date,
			reason: String,
		})],
	}),

	// Linked OAuth accounts (Google, GitHub, Twitch, Patreon)
	linked_accounts: [new Schema({
		_id: {
			type: String,
			required: true,
		},
		provider_user_id: {
			type: String,
			required: true,
		},
		username: String,
		email: String,
		avatar_url: String,
		linked_at: {
			type: Date,
			default: Date.now,
		},
		access_token_encrypted: String,
		refresh_token_encrypted: String,
		token_expires_at: Date,
	})],

	// Payment provider customer IDs for webhook lookups
	payment_ids: new Schema({
		stripe_customer_id: String,
		paypal_customer_id: String,
		btcpay_customer_id: String,
	}),
});
