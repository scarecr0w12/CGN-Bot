const Schema = require("../Schema");

/**
 * Role Panel Schema
 * Stores configuration for reaction/button/dropdown role panels
 */
const rolePanelSchema = new Schema({
	_id: {
		type: String,
		required: true,
	},
	server_id: {
		type: String,
		required: true,
	},
	channel_id: {
		type: String,
		required: true,
	},
	message_id: {
		type: String,
		required: true,
	},
	name: {
		type: String,
		required: true,
		maxlength: 100,
	},
	description: {
		type: String,
		maxlength: 1000,
	},
	type: {
		type: String,
		required: true,
		enum: ["reaction", "button", "dropdown"],
		default: "button",
	},
	mode: {
		type: String,
		enum: ["normal", "unique", "verify", "reverse"],
		default: "normal",
	},
	max_roles: {
		type: Number,
		default: 0,
		min: 0,
		max: 25,
	},
	require_role_id: {
		type: String,
		default: null,
	},
	roles: [new Schema({
		_id: {
			type: String,
			required: true,
		},
		role_id: {
			type: String,
			required: true,
		},
		label: {
			type: String,
			maxlength: 80,
		},
		description: {
			type: String,
			maxlength: 100,
		},
		emoji: {
			type: String,
			maxlength: 100,
		},
		style: {
			type: String,
			enum: ["Primary", "Secondary", "Success", "Danger"],
			default: "Primary",
		},
	})],
	color: {
		type: Number,
		default: 0x5865F2,
	},
	created_at: {
		type: Date,
		default: Date.now,
	},
	created_by: {
		type: String,
		required: true,
	},
});

module.exports = rolePanelSchema;
