const Schema = require("../Schema");
const { AllowedEvents } = require("../../Internals/Constants");

/*
 * Schema for commands, keywords, and timers (third-party and gallery)
 */
module.exports = new Schema({
	name: {
		type: String,
		minlength: 2,
		maxlength: 100,
		required: true,
	},
	level: {
		type: String,
		enum: [
			"third",
			"gallery",
		],
		required: true,
	},
	description: {
		type: String,
		maxlength: 2000,
	},
	tags: [String],
	points: {
		type: Number,
		default: 0,
		min: 0,
	},
	// Premium extension settings (purchasable with vote reward points)
	premium: new Schema({
		is_premium: {
			type: Boolean,
			default: false,
		},
		approved: {
			type: Boolean,
			default: false,
		},
		price_points: {
			type: Number,
			default: 0,
		},
		purchases: {
			type: Number,
			default: 0,
		},
		developer_earnings: {
			type: Number,
			default: 0,
		},
		revenue_share: {
			type: Number,
			default: 70,
			min: 0,
			max: 100,
		},
		lifetime_revenue: {
			type: Number,
			default: 0,
		},
	}),
	// Track users who have purchased this premium extension
	purchased_by: [String],
	purchase_history: [new Schema({
		transaction_id: String,
		user_id: String,
		purchased_at: Date,
		points_paid: Number,
		extension_creator_share: Number,
	})],
	owner_id: String,
	code_id: String,
	featured: Boolean,
	last_updated: Date,
	state: {
		type: String,
		enum: [
			// Latest version in gallery, no version in queue
			"gallery",
			// Existing version in gallery, latest version in queue
			"version_queue",
			// No version in gallery, latest version in queue
			"queue",
			// No version in gallery, no version in queue
			"saved",
		],
	},
	versions: [
		new Schema({
			_id: {
				type: Number,
				required: true,
			},
			code_id: String,
			accepted: Boolean,
			type: {
				type: String,
				enum: [
					"command",
					"slash",
					"keyword",
					"timer",
					"event",
				],
				required: true,
			},
			key: {
				type: String,
				minlength: 2,
				maxlength: 25,
			},
			slash_description: {
				type: String,
				maxlength: 100,
			},
			slash_options: Schema.Mixed,
			keywords: [String],
			case_sensitive: Boolean,
			interval: {
				type: Number,
				min: 300000,
				max: 86400000,
			},
			usage_help: {
				type: String,
				maxlength: 150,
			},
			extended_help: {
				type: String,
				maxlength: 1000,
			},
			event: {
				type: String,
				enum: AllowedEvents,
			},
			scopes: [String],
			timeout: {
				type: Number,
				default: 5000,
				min: 100,
				max: 10000,
			},
			fields: [
				new Schema({
					_id: {
						type: String,
						required: true,
					},
					name: String,
					value: String,
				}),
			],
			// Network capability level for external API access
			network_capability: {
				type: String,
				enum: [
					"none", // No external requests (default)
					"allowlist_only", // Only pre-approved public APIs
					"network", // Any external HTTPS endpoint (requires approval)
					"network_advanced", // HTTP + custom ports + webhooks (requires approval)
				],
				default: "none",
			},
			// Whether network capability has been approved by maintainer
			network_approved: {
				type: Boolean,
				default: false,
			},
			network_approved_by: String,
			network_approved_at: Date,
			// Approval history for audit trail
			approval_history: [new Schema({
				action: {
					type: String,
					enum: ["network_approved", "network_revoked", "accepted", "rejected"],
					required: true,
				},
				by: String,
				at: {
					type: Date,
					default: Date.now,
				},
				reason: String,
			})],
			// Dashboard settings schema (defines what server admins can configure)
			dashboard_settings: new Schema({
				enabled: {
					type: Boolean,
					default: false,
				},
				sections: [new Schema({
					id: {
						type: String,
						required: true,
					},
					title: String,
					fields: [new Schema({
						id: {
							type: String,
							required: true,
						},
						type: {
							type: String,
							enum: [
								"text",
								"textarea",
								"number",
								"secret",
								"toggle",
								"select",
								"multi_select",
								"channel_select",
								"role_select",
								"color",
							],
							required: true,
						},
						label: String,
						placeholder: String,
						help: String,
						required: Boolean,
						default: Schema.Mixed,
						min: Number,
						max: Number,
						options: [new Schema({
							value: String,
							label: String,
						})],
					})],
				})],
			}),
			// Dashboard pages (custom pages in server dashboard)
			dashboard_pages: [new Schema({
				id: {
					type: String,
					required: true,
				},
				title: String,
				icon: String,
				approved: {
					type: Boolean,
					default: false,
				},
			})],
		}),
	],
	version: Number,
	published_version: Number,
});
