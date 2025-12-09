const Schema = require("../Schema");

module.exports = new Schema({
	_id: {
		type: String,
		required: true,
	},
	url: {
		type: String,
		required: true,
	},
	streaming: new Schema({
		isEnabled: {
			type: Boolean,
			default: false,
		},
		enabled_channel_ids: [String],
	}),
});
