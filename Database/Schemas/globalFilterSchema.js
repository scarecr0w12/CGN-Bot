const Schema = require("../Schema");

module.exports = new Schema({
	word: {
		type: String,
		required: true,
		unique: true,
	},
});
