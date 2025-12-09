/**
 * Profile Command - View user profile information
 */
module.exports = async ({ client, Constants: { Colors } }, documents, msg, commandData) => {
	const { userDocument } = documents;
	const targetUser = msg.suffix ? await client.memberSearch(msg.suffix, msg.guild) : msg.member;

	if (!targetUser) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "I couldn't find that user.",
			}],
		});
	}

	const user = targetUser.user || targetUser;
	const userData = userDocument || {};

	msg.send({
		embeds: [{
			color: Colors.INFO,
			author: {
				name: `${user.username}'s Profile`,
				icon_url: user.displayAvatarURL(),
			},
			thumbnail: {
				url: user.displayAvatarURL({ size: 256 }),
			},
			fields: [
				{
					name: "User ID",
					value: user.id,
					inline: true,
				},
				{
					name: "Account Created",
					value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
					inline: true,
				},
				{
					name: "SkynetPoints",
					value: `${userData.points || 0}`,
					inline: true,
				},
			],
			footer: {
				text: "Use the dashboard to customize your profile",
			},
		}],
	});
};
