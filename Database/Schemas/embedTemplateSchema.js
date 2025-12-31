const Schema = require("../Schema");

/**
 * Embed Template Schema
 * Stores saved embed templates for easy reuse
 */
const embedTemplateSchema = new Schema({
	_id: {
		type: String,
		required: true,
	},
	server_id: {
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
		maxlength: 200,
	},
	embed_data: {
		type: Object,
		required: true,
		default: {},
	},
	created_by: {
		type: String,
		required: true,
	},
	created_at: {
		type: Date,
		default: Date.now,
	},
	updated_at: {
		type: Date,
		default: Date.now,
	},
	use_count: {
		type: Number,
		default: 0,
	},
});

module.exports = embedTemplateSchema;
