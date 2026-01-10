const Schema = require("../Schema.js");

// Simple UUID generator for MariaDB
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

module.exports = new Schema({
	_id: {
		type: String,
		default: generateId,
	},
	server_id: {
		type: String,
		required: true,
	},
	enabled: {
		type: Boolean,
		default: false,
	},
	channel_id: {
		type: String,
		default: null,
	},
	template_id: {
		type: String,
		required: true,
	},
	// Template configuration
	background_type: {
		type: String,
		enum: ["builtin", "custom", "color"],
		default: "builtin",
	},
	background_value: {
		type: String,
		default: null, // URL for custom, hex for color, template name for builtin
	},
	avatar_enabled: {
		type: Boolean,
		default: true,
	},
	avatar_x: {
		type: Number,
		default: 50,
	},
	avatar_y: {
		type: Number,
		default: 30,
	},
	avatar_size: {
		type: Number,
		default: 150,
	},
	avatar_border_enabled: {
		type: Boolean,
		default: true,
	},
	avatar_border_color: {
		type: String,
		default: "#FFFFFF",
	},
	avatar_border_width: {
		type: Number,
		default: 5,
	},
	text_enabled: {
		type: Boolean,
		default: true,
	},
	text_template: {
		type: String,
		default: "Welcome {username}!",
	},
	text_font: {
		type: String,
		default: "Arial",
	},
	text_size: {
		type: Number,
		default: 48,
	},
	text_color: {
		type: String,
		default: "#FFFFFF",
	},
	text_x: {
		type: Number,
		default: 50,
	},
	text_y: {
		type: Number,
		default: 70,
	},
	text_align: {
		type: String,
		enum: ["left", "center", "right"],
		default: "center",
	},
	text_stroke_enabled: {
		type: Boolean,
		default: true,
	},
	text_stroke_color: {
		type: String,
		default: "#000000",
	},
	text_stroke_width: {
		type: Number,
		default: 2,
	},
	subtitle_enabled: {
		type: Boolean,
		default: true,
	},
	subtitle_template: {
		type: String,
		default: "Member #{memberCount}",
	},
	subtitle_font: {
		type: String,
		default: "Arial",
	},
	subtitle_size: {
		type: Number,
		default: 24,
	},
	subtitle_color: {
		type: String,
		default: "#CCCCCC",
	},
	subtitle_x: {
		type: Number,
		default: 50,
	},
	subtitle_y: {
		type: Number,
		default: 80,
	},
	subtitle_align: {
		type: String,
		enum: ["left", "center", "right"],
		default: "center",
	},
	// Image settings
	width: {
		type: Number,
		default: 1024,
	},
	height: {
		type: Number,
		default: 450,
	},
	format: {
		type: String,
		enum: ["png", "jpeg"],
		default: "png",
	},
	quality: {
		type: Number,
		default: 90,
		min: 1,
		max: 100,
	},
	created_at: {
		type: Date,
		default: Date.now,
	},
	updated_at: {
		type: Date,
		default: Date.now,
	},
});
