const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("about")
		.setDescription("Information about SkynetBot"),

	async execute (interaction, client) {
		const uptime = formatUptime(client.uptime);

		return interaction.reply({
			embeds: [{
				color: 0x3669FA,
				title: "About SkynetBot 🤖",
				thumbnail: { url: client.user.displayAvatarURL() },
				fields: [
					{ name: "Version", value: process.env.BOT_VERSION || "Unknown", inline: true },
					{ name: "Servers", value: `${client.guilds.cache.size}`, inline: true },
					{ name: "Uptime", value: uptime, inline: true },
					{ name: "Node.js", value: process.version, inline: true },
					{ name: "Discord.js", value: require("discord.js").version, inline: true },
					{ name: "Memory", value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`, inline: true },
				],
				footer: { text: "Made with ❤️" },
			}],
		});
	},
};

function formatUptime (ms) {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
	if (hours > 0) return `${hours}h ${minutes % 60}m`;
	if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
	return `${seconds}s`;
}
