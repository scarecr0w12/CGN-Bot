const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("animal")
		.setDescription("Get random animal pictures and facts")
		.addStringOption(opt =>
			opt.setName("type")
				.setDescription("Type of animal")
				.setRequired(true)
				.addChoices(
					{ name: "Cat", value: "cat" },
					{ name: "Dog", value: "dog" },
					{ name: "Fox", value: "fox" },
					{ name: "Bird", value: "bird" },
				),
		)
		.addStringOption(opt =>
			opt.setName("content")
				.setDescription("What to get")
				.setRequired(false)
				.addChoices(
					{ name: "Picture", value: "picture" },
					{ name: "Fact", value: "fact" },
				),
		),

	async execute (interaction) {
		const type = interaction.options.getString("type");
		const content = interaction.options.getString("content") || "picture";

		await interaction.deferReply();

		try {
			if (content === "picture") {
				const imageData = await fetchImage(type);
				if (!imageData) {
					return interaction.editReply(`Couldn't find a ${type} picture!`);
				}

				return interaction.editReply({
					embeds: [{
						color: 0x3669FA,
						title: `${getEmoji(type)} Random ${capitalize(type)}`,
						image: { url: imageData },
					}],
				});
			} else {
				const fact = await fetchFact(type);
				if (!fact) {
					return interaction.editReply(`Couldn't find a ${type} fact!`);
				}

				return interaction.editReply({
					embeds: [{
						color: 0x3669FA,
						title: `${getEmoji(type)} ${capitalize(type)} Fact`,
						description: fact,
					}],
				});
			}
		} catch (err) {
			return interaction.editReply(`Failed to fetch ${type} ${content}!`);
		}
	},
};

function getEmoji (type) {
	const emojis = { cat: "🐱", dog: "🐕", fox: "🦊", bird: "🐦" };
	return emojis[type] || "🐾";
}

function capitalize (str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

async function fetchImage (type) {
	switch (type) {
		case "cat": {
			const res = await fetch("https://api.thecatapi.com/v1/images/search");
			const data = await res.json();
			return data?.[0]?.url || null;
		}
		case "dog": {
			const res = await fetch("https://dog.ceo/api/breeds/image/random");
			const data = await res.json();
			return data?.status === "success" ? data.message : null;
		}
		case "fox": {
			const res = await fetch("https://randomfox.ca/floof/");
			const data = await res.json();
			return data?.image || null;
		}
		case "bird": {
			const res = await fetch("https://some-random-api.com/animal/bird");
			const data = await res.json();
			return data?.image || null;
		}
		default:
			return null;
	}
}

async function fetchFact (type) {
	switch (type) {
		case "cat": {
			const res = await fetch("https://catfact.ninja/fact");
			const data = await res.json();
			return data?.fact || null;
		}
		case "dog": {
			const res = await fetch("https://dogapi.dog/api/v2/facts?limit=1");
			const data = await res.json();
			return data?.data?.[0]?.attributes?.body || null;
		}
		case "fox": {
			const res = await fetch("https://some-random-api.com/animal/fox");
			const data = await res.json();
			return data?.fact || null;
		}
		case "bird": {
			const res = await fetch("https://some-random-api.com/animal/bird");
			const data = await res.json();
			return data?.fact || null;
		}
		default:
			return null;
	}
}
