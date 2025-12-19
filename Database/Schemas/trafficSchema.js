const Schema = require("../Schema");

// Traffic Schema - supports both aggregate stats and detailed request logging
module.exports = new Schema({
	_id: {
		type: String,
		required: true,
	},
	// For aggregate hourly stats (type: 'aggregate')
	pageViews: {
		type: Number,
		default: 0,
	},
	authViews: {
		type: Number,
		default: 0,
	},
	uniqueUsers: {
		type: Number,
		default: 0,
	},
	// Record type: 'aggregate' for hourly stats, 'request' for individual requests
	type: {
		type: String,
		enum: ["aggregate", "request"],
		default: "aggregate",
	},
	// For detailed request logging (type: 'request')
	timestamp: {
		type: Date,
		default: Date.now,
	},
	path: {
		type: String,
		maxlength: 512,
	},
	method: {
		type: String,
		maxlength: 10,
	},
	status_code: {
		type: Number,
	},
	response_time: {
		type: Number,
	},
	user_agent: {
		type: String,
		maxlength: 1024,
	},
	ip_hash: {
		type: String,
		maxlength: 64,
	},
	referrer: {
		type: String,
		maxlength: 512,
	},
	user_id: {
		type: String,
	},
	session_id: {
		type: String,
	},
	country: {
		type: String,
		maxlength: 2,
	},
});
