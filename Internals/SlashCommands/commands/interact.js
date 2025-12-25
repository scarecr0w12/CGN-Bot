const { SlashCommandBuilder } = require("discord.js");

const interactions = {
	hug: {
		gifs: [
			"https://media.giphy.com/media/l2QDM9Jnim1YVILXa/giphy.gif",
			"https://media.giphy.com/media/3oEdv4hwWTzBhWvaU0/giphy.gif",
			"https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif",
			"https://media.giphy.com/media/ZQN9jsRWp1M76/giphy.gif",
			"https://media.giphy.com/media/lrr9rHuoJOE0w/giphy.gif",
			"https://media.giphy.com/media/wnsgren9NtITS/giphy.gif",
			"https://media.giphy.com/media/PHZ7v9tfQu0o0/giphy.gif",
			"https://media.giphy.com/media/IRUb7GTCaPU8E/giphy.gif",
			"https://media.giphy.com/media/EvYHHSntaIl5m/giphy.gif",
			"https://media.giphy.com/media/xUPGcCh4nUHyCkyuti/giphy.gif",
		],
		color: 0x43B581,
		emoji: "🤗",
		verb: "hugs",
		selfMsg: (name) => `**${name}** hugs themselves... 🥺`,
		botMsg: (name) => `**${name}** hugs me! Thanks! 💕`,
		targetMsg: (author, target) => `**${author}** hugs **${target}**! 🤗`,
		soloMsg: (name) => `**${name}** wants a hug! 🤗`,
	},
	pat: {
		gifs: [
			"https://media.giphy.com/media/L2z7dnOduqEow/giphy.gif",
			"https://media.giphy.com/media/4HP0ddZnNVvKU/giphy.gif",
			"https://media.giphy.com/media/ARSp9T7wwxNcs/giphy.gif",
			"https://media.giphy.com/media/ye7OTQgwmVuVy/giphy.gif",
			"https://media.giphy.com/media/5tmRHwTlHAA9WkVxTU/giphy.gif",
			"https://media.giphy.com/media/Z7x24IHBcmV7W/giphy.gif",
			"https://media.giphy.com/media/osYdfUptPqV0s/giphy.gif",
			"https://media.giphy.com/media/N0CIxcyPLputW/giphy.gif",
			"https://media.giphy.com/media/4owjQaBmYuCze/giphy.gif",
			"https://media.giphy.com/media/xT9DPIBYf0pAviBLzO/giphy.gif",
		],
		color: 0x43B581,
		emoji: "👋",
		verb: "pats",
		selfMsg: (name) => `**${name}** pats themselves... there there 😊`,
		botMsg: (name) => `**${name}** pats me! *happy bot noises* 💖`,
		targetMsg: (author, target) => `**${author}** pats **${target}**! Good job! 👋`,
		soloMsg: (name) => `**${name}** wants headpats! 👋`,
	},
	slap: {
		gifs: [
			"https://media.giphy.com/media/Zau0yrl17uzdK/giphy.gif",
			"https://media.giphy.com/media/jLeyZWgtwgr2U/giphy.gif",
			"https://media.giphy.com/media/RXGNsyRb1hDJm/giphy.gif",
			"https://media.giphy.com/media/Gf3AUz3eBNbTW/giphy.gif",
			"https://media.giphy.com/media/tXWfj6dUjs0Zy/giphy.gif",
			"https://media.giphy.com/media/uG3lKkAuh53wc/giphy.gif",
			"https://media.giphy.com/media/xUO4t2gkWBxDi/giphy.gif",
			"https://media.giphy.com/media/l3YSimA8CV1k11QRy/giphy.gif",
			"https://media.giphy.com/media/WLXO8OZmq0JK8/giphy.gif",
			"https://media.giphy.com/media/3XlEk2RxPS1m8/giphy.gif",
		],
		color: 0xE55B0A,
		emoji: "💥",
		verb: "slaps",
		selfMsg: (name) => `**${name}** slaps themselves... why though? 🤔`,
		botMsg: (name) => `**${name}** tries to slap me! Nice try! 😏`,
		targetMsg: (author, target) => `**${author}** slaps **${target}**! 👋💥`,
		soloMsg: (name) => `**${name}** slaps the air menacingly! 👋`,
	},
	poke: {
		gifs: [
			"https://media.giphy.com/media/WvVzZ9mCyMjsc/giphy.gif",
			"https://media.giphy.com/media/pWd3gD577gOqs/giphy.gif",
			"https://media.giphy.com/media/ovbDDmY4Kphtu/giphy.gif",
			"https://media.giphy.com/media/11JbaLzOXsg6Fq/giphy.gif",
		],
		color: 0x7289DA,
		emoji: "👉",
		verb: "pokes",
		selfMsg: (name) => `**${name}** pokes themselves... boop! 👉`,
		botMsg: (name) => `**${name}** pokes me! Hey! 😤`,
		targetMsg: (author, target) => `**${author}** pokes **${target}**! 👉`,
		soloMsg: (name) => `**${name}** pokes the air! 👉`,
	},
	highfive: {
		gifs: [
			"https://media.giphy.com/media/3oEjHV0z8S7WM4MwnK/giphy.gif",
			"https://media.giphy.com/media/l0MYv4hw2ezStq1hK/giphy.gif",
			"https://media.giphy.com/media/IxTGa7UTTmJ20/giphy.gif",
			"https://media.giphy.com/media/HX3lSnGXMAzntcyWdf/giphy.gif",
		],
		color: 0xFAA61A,
		emoji: "🙌",
		verb: "high-fives",
		selfMsg: (name) => `**${name}** high-fives themselves! Self-five! 🙌`,
		botMsg: (name) => `**${name}** high-fives me! 🙌 Yeah!`,
		targetMsg: (author, target) => `**${author}** high-fives **${target}**! 🙌`,
		soloMsg: (name) => `**${name}** raises their hand for a high-five! 🙌`,
	},
};

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("interact")
		.setDescription("Social interactions with other users")
		.addStringOption(opt =>
			opt.setName("action")
				.setDescription("Type of interaction")
				.setRequired(true)
				.addChoices(
					{ name: "Hug", value: "hug" },
					{ name: "Pat", value: "pat" },
					{ name: "Slap", value: "slap" },
					{ name: "Poke", value: "poke" },
					{ name: "High-five", value: "highfive" },
				),
		)
		.addUserOption(opt =>
			opt.setName("user")
				.setDescription("The user to interact with")
				.setRequired(false),
		),

	async execute (interaction, client, serverDocument) {
		const action = interaction.options.getString("action");
		const target = interaction.options.getUser("user");
		const config = interactions[action];

		if (!config) {
			return interaction.reply({ content: "Invalid action!", ephemeral: true });
		}

		const randomGif = config.gifs[Math.floor(Math.random() * config.gifs.length)];

		const authorMember = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
		const authorName = client.getName(serverDocument, authorMember) || interaction.user.username;

		let description;
		if (target) {
			const targetMember = await interaction.guild.members.fetch(target.id).catch(() => null);
			const targetName = client.getName(serverDocument, targetMember) || target.username;

			if (target.id === interaction.user.id) {
				description = config.selfMsg(authorName);
			} else if (target.id === client.user.id) {
				description = config.botMsg(authorName);
			} else {
				description = config.targetMsg(authorName, targetName);
			}
		} else {
			description = config.soloMsg(authorName);
		}

		return interaction.reply({
			embeds: [{
				color: config.color,
				description,
				image: { url: randomGif },
				footer: { text: config.emoji },
			}],
		});
	},
};
