const { get: getDatabase } = require("../../Database/Driver");

let cachedFilters = null;
let lastFetch = 0;
const CACHE_TTL = 3600000; // 1 hour

const getFilters = async () => {
	if (cachedFilters && Date.now() - lastFetch < CACHE_TTL) return cachedFilters;
	const DB = getDatabase();
	const docs = await DB.GlobalFilters.find({}).exec();
	cachedFilters = docs.map(d => d.word);
	lastFetch = Date.now();
	return cachedFilters;
};

// Check if a message contains a filtered string, and whether filtering is enabled
/* eslint-disable max-len */
module.exports = async (serverDocument, channel, string, isNsfw, isCustom, nsfwOverride) => {
	if (serverDocument.config.moderation.isEnabled) {
		if (isNsfw && serverDocument.config.moderation.filters.nsfw_filter.isEnabled && !serverDocument.config.moderation.filters.nsfw_filter.disabled_channel_ids.includes(channel.id)) {
			if (nsfwOverride) return true;

			const nsfwWords = await getFilters();
			for (let i = 0; i < nsfwWords.length; i++) {
				if (` ${string} `.toLowerCase().includes(` ${nsfwWords[i]} `)) {
					return true;
				}
			}
		} else if (isCustom && serverDocument.config.moderation.filters.custom_filter.isEnabled && !serverDocument.config.moderation.filters.custom_filter.disabled_channel_ids.includes(channel.id)) {
			for (let i = 0; i < serverDocument.config.moderation.filters.custom_filter.keywords.length; i++) {
				if (` ${string} `.toLowerCase().includes(` ${serverDocument.config.moderation.filters.custom_filter.keywords[i]} `)) {
					return true;
				}
			}
		}
	}
	return false;
};
