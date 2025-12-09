const Schema = require("../Schema");

module.exports = new Schema({
	_id: {
		type: String,
		required: true,
	},
	content: {
		type: String,
		required: true,
	},
});
