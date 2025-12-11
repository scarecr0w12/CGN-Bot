const Schema = require("../Schema");

// Site-wide settings stored in MongoDB
module.exports = new Schema({
	_id: {
		type: String,
		default: "main",
	},
	donateSubtitle: {
		type: String,
		default: "",
	},
	charities: [new Schema({
		name: {
			type: String,
			required: true,
		},
		country: {
			type: String,
			default: "",
		},
		donate_url: {
			type: String,
			required: true,
		},
		icon_url: {
			type: String,
			required: true,
		},
	})],
	vote_sites: [new Schema({
		name: {
			type: String,
			required: true,
		},
		url: {
			type: String,
			required: true,
		},
		icon_url: {
			type: String,
			default: "",
		},
	})],
	homepageMessageHTML: {
		type: String,
		default: "",
	},
	headerImage: {
		type: String,
		default: "header.png",
	},
	injection: new Schema({
		headScript: {
			type: String,
			default: "",
		},
		footerHTML: {
			type: String,
			default: "",
		},
	}),

	// ============================================
	// TIERED MEMBERSHIP SYSTEM
	// ============================================

	// Feature Registry - all gateable features in the system
	features: [new Schema({
		_id: {
			type: String,
			required: true,
		},
		name: {
			type: String,
			required: true,
		},
		description: String,
		category: {
			type: String,
			default: "general",
		},
		isEnabled: {
			type: Boolean,
			default: true,
		},
	})],

	// Dynamic Tiers - configurable from maintainer console
	tiers: [new Schema({
		_id: {
			type: String,
			required: true,
		},
		name: {
			type: String,
			required: true,
		},
		level: {
			type: Number,
			default: 0,
		},
		description: String,
		features: [String],
		badge_icon: String,
		color: String,
		price_monthly: Number,
		price_yearly: Number,
		yearly_discount: {
			type: Number,
			default: 0,
		},
		is_purchasable: {
			type: Boolean,
			default: false,
		},
		is_default: {
			type: Boolean,
			default: false,
		},
	})],

	// OAuth Provider Configuration
	oauth_providers: new Schema({
		google: new Schema({
			isEnabled: {
				type: Boolean,
				default: false,
			},
			client_id: String,
		}),
		github: new Schema({
			isEnabled: {
				type: Boolean,
				default: false,
			},
			client_id: String,
		}),
		twitch: new Schema({
			isEnabled: {
				type: Boolean,
				default: false,
			},
			client_id: String,
		}),
		patreon: new Schema({
			isEnabled: {
				type: Boolean,
				default: false,
			},
			client_id: String,
			tier_mapping: [new Schema({
				_id: {
					type: String,
					required: true,
				},
				local_tier_id: {
					type: String,
					required: true,
				},
			})],
		}),
	}),

	// ============================================
	// BOT LIST INTEGRATIONS
	// ============================================

	bot_lists: new Schema({
		topgg: new Schema({
			isEnabled: {
				type: Boolean,
				default: false,
			},
			api_token: String,
			webhook_secret: String,
			auto_post_stats: {
				type: Boolean,
				default: true,
			},
		}),
		discordbotlist: new Schema({
			isEnabled: {
				type: Boolean,
				default: false,
			},
			api_token: String,
			webhook_secret: String,
			auto_post_stats: {
				type: Boolean,
				default: true,
			},
			sync_commands: {
				type: Boolean,
				default: false,
			},
		}),
	}),

	// Vote reward settings
	vote_rewards: new Schema({
		isEnabled: {
			type: Boolean,
			default: false,
		},
		points_per_vote: {
			type: Number,
			default: 100,
		},
		weekend_multiplier: {
			type: Number,
			default: 2,
		},
		notification_channel_id: String,
		// Point redemption settings
		redemption: new Schema({
			isEnabled: {
				type: Boolean,
				default: false,
			},
			points_per_dollar: {
				type: Number,
				default: 1000, // 1000 points = $1
			},
			redeemable_tier_id: String, // Which tier can be purchased with points
			min_redemption_days: {
				type: Number,
				default: 7, // Minimum days to redeem at once
			},
			max_redemption_days: {
				type: Number,
				default: 365, // Maximum days per redemption
			},
		}),
	}),

	// Payment Provider Configuration
	payment_providers: new Schema({
		stripe: new Schema({
			isEnabled: {
				type: Boolean,
				default: false,
			},
			publishable_key: String,
			product_mapping: [new Schema({
				_id: {
					type: String,
					required: true,
				},
				stripe_price_id: {
					type: String,
					required: true,
				},
				tier_id: {
					type: String,
					required: true,
				},
			})],
		}),
		paypal: new Schema({
			isEnabled: {
				type: Boolean,
				default: false,
			},
			client_id: String,
			plan_mapping: [new Schema({
				_id: {
					type: String,
					required: true,
				},
				tier_id: {
					type: String,
					required: true,
				},
			})],
		}),
		btcpay: new Schema({
			isEnabled: {
				type: Boolean,
				default: false,
			},
			server_url: String,
			store_id: String,
		}),
	}),
});
