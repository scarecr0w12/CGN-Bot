const Schema = require("../Schema");

module.exports = new Schema({
	content: {
		type: String,
		required: true,
	},
});
