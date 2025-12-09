const Schema = require("../Schema");

module.exports = new Schema({
	category: {
		type: String,
		required: true,
	},
	question: {
		type: String,
		required: true,
	},
	answer: {
		type: String,
		required: true,
	},
});
