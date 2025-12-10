const Schema = require("../Schema");

// Track user votes from bot list sites
module.exports = new Schema({
	_id: {
		type: String,
		required: true,
	},
	user_id: {
		type: String,
		required: true,
	},
	site: {
		type: String,
		required: true,
	},
	timestamp: {
		type: Date,
		default: Date.now,
	},
	is_weekend: {
		type: Boolean,
		default: false,
	},
	points_awarded: {
		type: Number,
		default: 0,
	},
	username: String,
	avatar: String,
});
