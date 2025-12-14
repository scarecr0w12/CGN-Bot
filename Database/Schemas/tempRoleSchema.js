const Schema = require("../Schema");

/**
 * Temporary Role Schema
 * Stores temporary role assignments with expiry times
 */
const tempRoleSchema = new Schema({
	_id: {
		type: String,
		required: true,
	},
	server_id: {
		type: String,
		required: true,
	},
	user_id: {
		type: String,
		required: true,
	},
	role_id: {
		type: String,
		required: true,
	},
	assigned_by: {
		type: String,
		required: true,
	},
	assigned_at: {
		type: Date,
		default: Date.now,
	},
	expires_at: {
		type: Date,
		required: true,
	},
	reason: {
		type: String,
		maxlength: 500,
	},
	notified: {
		type: Boolean,
		default: false,
	},
});

module.exports = tempRoleSchema;
