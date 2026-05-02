const { AttachmentBuilder } = require("discord.js");
const Logger = require("../../Logger");
const logger = new Logger("WelcomeImage");

module.exports = async (client, member) => {
	try {
		const welcomeGenerator = client.welcomeImageGenerator;
		if (!welcomeGenerator) {
			return;
		}

		// Get server configuration
		const config = await welcomeGenerator.getServerConfig(member.guild.id);
		if (!config || !config.enabled || !config.channel_id) {
			return;
		}

		// Generate the welcome image
		const imageBuffer = await welcomeGenerator.generateWelcomeImage(member, config);

		// Get the channel
		const channel = member.guild.channels.cache.get(config.channel_id);
		if (!channel || !channel.isTextBased()) {
			logger.warn(`Welcome channel ${config.channel_id} not found or not text-based for guild ${member.guild.id}`);
			return;
		}

		// Send the welcome image
		const attachment = new AttachmentBuilder(imageBuffer, {
			name: `welcome-${member.id}.${config.format || "png"}`,
		});

		await channel.send({
			content: `Welcome ${member}! 🎉`,
			files: [attachment],
		});

		logger.info(`Sent welcome image for ${member.user.username} in ${member.guild.name}`);
	} catch (err) {
		logger.error("Failed to send welcome image:", err);
	}
};
