const Schema = require("../Schema");

module.exports = new Schema({
	_id: {
		type: String,
		required: true,
	},
	max_score: {
		type: Number,
		required: true,
	},
});
