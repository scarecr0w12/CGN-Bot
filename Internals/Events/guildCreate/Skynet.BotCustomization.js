/**
 * Apply bot customization when joining a guild
 */
module.exports = async (client, guild) => {
	try {
		if (client.botCustomization) {
			await client.botCustomization.applyOnGuildJoin(guild);
		}
	} catch (error) {
		client.logger.error(`Error applying bot customization on guild join: ${error.message}`);
	}
};
