const { get } = require("./Utils/SnekfetchShim");
const { loadConfigs } = require("../Configurations/env.js");
const { auth: { tokens: { giphyAPI } } } = loadConfigs();
const { APIs } = require("../Internals/Constants");
const { SkynetError } = require("../Internals/Errors");

/**
 * Fetches a random gif from Giphy
 * @param {String} query
 * @param {?String} [nsfw="pg-13"]
 * @returns {Promise<Object>} Giphy API return
 */
module.exports = async (query, nsfw = "pg-13") => {
	if (!query) throw new SkynetError("MISSING_GIPHY_QUERY");
	const res = await get(APIs.GIPHY(giphyAPI, query, nsfw));
	if (res.statusCode === 200 && res.body && res.body.data) return res.body.data;
	else throw new SkynetError("NO_GIPHY_RESULT");
};
