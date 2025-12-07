const { loadConfigs } = require("../Configurations/env.js");
const { auth } = loadConfigs();
const MSTranslator = require("mstranslator");

module.exports = new MSTranslator({
	api_key: auth.tokens.microsoftTranslation,
}, true);
