/**
 * The Skynet Extension Code API.
 * @namespace API
 */
module.exports = {
	// Modules
	Client: require("./Modules/Client"),
	Extension: require("./Modules/Extension"),
	Utils: require("./Modules/Utils"),

	// Structures
	Message: require("./Structures/Message"),
	User: require("./Structures/User"),
	Guild: require("./Structures/Guild"),
	Channel: require("./Structures/Channel"),
	Member: require("./Structures/Member"),
	Emoji: require("./Structures/Emoji"),
	Embed: require("./Structures/Embed"),

	// Utilities
	ScopeManager: require("./Utils/ScopeManager"),
	APIUtils: require("./Utils/Utils"),
};
