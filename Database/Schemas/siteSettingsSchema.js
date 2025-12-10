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
