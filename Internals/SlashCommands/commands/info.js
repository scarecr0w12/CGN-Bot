const { SlashCommandBuilder, ChannelType } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("info")
		.setDescription("Display server information"),

	async execute (interaction) {
		const { guild } = interaction;

		const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
		const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
		const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size;

		const online = guild.members.cache.filter(m => m.presence && m.presence.status !== "offline").size;
		const bots = guild.members.cache.filter(m => m.user.bot).size;
		const humans = guild.memberCount - bots;

		const owner = await guild.fetchOwner();

		return interaction.reply({
			embeds: [{
				color: 0x3669FA,
				title: guild.name,
				thumbnail: { url: guild.iconURL({ size: 256 }) || "" },
				fields: [
					{ name: "Owner", value: `<@${owner.id}>`, inline: true },
					{ name: "Created", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
					{ name: "Members", value: `${guild.memberCount} (${humans} humans, ${bots} bots)`, inline: false },
					{ name: "Online", value: `${online}`, inline: true },
					{ name: "Roles", value: `${guild.roles.cache.size}`, inline: true },
					{ name: "Emojis", value: `${guild.emojis.cache.size}`, inline: true },
					{ name: "Channels", value: `${textChannels} text, ${voiceChannels} voice, ${categories} categories`, inline: false },
					{ name: "Boost Level", value: `Level ${guild.premiumTier} (${guild.premiumSubscriptionCount} boosts)`, inline: true },
					{ name: "Verification", value: guild.verificationLevel.toString(), inline: true },
				],
				footer: { text: `ID: ${guild.id}` },
			}],
		});
	},
};
