module.exports = async ({ Constants: { Colors }, client }, { serverDocument, userDocument, userQueryDocument }, msg) => {
	const getEconomy = doc => doc.economy || { wallet: 0, bank: 0, bank_capacity: 5000 };

	if (msg.suffix === "me" || !msg.suffix) {
		const economy = getEconomy(userDocument);
		const total = (economy.wallet || 0) + (economy.bank || 0);

		msg.send({
			embeds: [{
				color: Colors.RESPONSE,
				author: {
					name: `${msg.author.username}'s Balance`,
					icon_url: msg.author.displayAvatarURL(),
				},
				fields: [
					{
						name: "💵 Wallet",
						value: `${(economy.wallet || 0).toLocaleString()} coins`,
						inline: true,
					},
					{
						name: "🏦 Bank",
						value: `${(economy.bank || 0).toLocaleString()} / ${(economy.bank_capacity || 5000).toLocaleString()} coins`,
						inline: true,
					},
					{
						name: "💰 Net Worth",
						value: `${total.toLocaleString()} coins`,
						inline: true,
					},
				],
				footer: {
					text: `Use ${msg.guild.commandPrefix}daily to claim your daily reward!`,
				},
			}],
		});
	} else {
		const member = await client.memberSearch(msg.suffix, msg.guild).catch(() => null);
		if (member && member.user.bot) {
			msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: "Bots don't have bank accounts! 🤖",
				}],
			});
		} else if (member) {
			let targetUserDocument = await Users.findOne(member.id);
			if (!targetUserDocument) targetUserDocument = Users.new({ _id: member.id });

			const economy = getEconomy(targetUserDocument);
			const total = (economy.wallet || 0) + (economy.bank || 0);

			msg.send({
				embeds: [{
					color: Colors.RESPONSE,
					author: {
						name: `${member.user.username}'s Balance`,
						icon_url: member.user.displayAvatarURL(),
					},
					fields: [
						{
							name: "💵 Wallet",
							value: `${(economy.wallet || 0).toLocaleString()} coins`,
							inline: true,
						},
						{
							name: "🏦 Bank",
							value: `${(economy.bank || 0).toLocaleString()} / ${(economy.bank_capacity || 5000).toLocaleString()} coins`,
							inline: true,
						},
						{
							name: "💰 Net Worth",
							value: `${total.toLocaleString()} coins`,
							inline: true,
						},
					],
				}],
			});
		} else {
			msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: "I couldn't find that user! 🔍",
				}],
			});
		}
	}
};
