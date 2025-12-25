const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("weather")
		.setDescription("Get the weather for a location")
		.addStringOption(opt =>
			opt.setName("location")
				.setDescription("The city or location")
				.setRequired(true),
		),

	async execute (interaction) {
		const location = interaction.options.getString("location");
		const apiKey = process.env.OPENWEATHERMAP_KEY;

		if (!apiKey) {
			return interaction.reply({
				content: "Weather service is not configured!",
				ephemeral: true,
			});
		}

		await interaction.deferReply();

		try {
			const response = await fetch(
				`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`,
			);
			const data = await response.json();

			if (data.cod !== 200) {
				return interaction.editReply("Couldn't find that location!");
			}

			const tempF = Math.round(((data.main.temp * 9) / 5) + 32);
			const feelsLikeF = Math.round(((data.main.feels_like * 9) / 5) + 32);

			return interaction.editReply({
				embeds: [{
					color: 0x3669FA,
					title: `🌤️ Weather in ${data.name}, ${data.sys.country}`,
					thumbnail: { url: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png` },
					fields: [
						{ name: "Condition", value: data.weather[0].description, inline: true },
						{ name: "Temperature", value: `${Math.round(data.main.temp)}°C / ${tempF}°F`, inline: true },
						{ name: "Feels Like", value: `${Math.round(data.main.feels_like)}°C / ${feelsLikeF}°F`, inline: true },
						{ name: "Humidity", value: `${data.main.humidity}%`, inline: true },
						{ name: "Wind", value: `${data.wind.speed} m/s`, inline: true },
						{ name: "Pressure", value: `${data.main.pressure} hPa`, inline: true },
					],
				}],
			});
		} catch (err) {
			return interaction.editReply("Failed to fetch weather data!");
		}
	},
};
