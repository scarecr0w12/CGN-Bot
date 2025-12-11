const Schema = require("../Schema");

// Vote Reward Transaction Schema
// Tracks all vote reward point transactions (earnings, purchases, redemptions)
module.exports = new Schema({
	_id: {
		type: String,
		required: true,
	},
	user_id: {
		type: String,
		required: true,
	},
	type: {
		type: String,
		enum: [
			"vote",
			"purchase",
			"redeem_tier",
			"redeem_extension",
			"admin_grant",
			"admin_revoke",
			"refund",
		],
		required: true,
	},
	amount: {
		type: Number,
		required: true,
	},
	balance_after: {
		type: Number,
		required: true,
	},
	timestamp: {
		type: Date,
		default: Date.now,
	},
	// Metadata varies by transaction type
	metadata: new Schema({
		// For vote transactions
		vote_site: String,
		is_weekend: Boolean,
		// For purchase transactions
		payment_provider: String,
		payment_id: String,
		amount_paid: Number,
		currency: String,
		// For tier redemption
		server_id: String,
		tier_id: String,
		duration_days: Number,
		// For extension redemption
		extension_id: String,
		extension_name: String,
		// For admin actions
		admin_id: String,
		reason: String,
	}),
});
