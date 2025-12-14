const { SlashCommandBuilder } = require("discord.js");

const conversions = {
	// Length
	km_mi: v => v * 0.621371,
	mi_km: v => v * 1.60934,
	m_ft: v => v * 3.28084,
	ft_m: v => v * 0.3048,
	cm_in: v => v * 0.393701,
	in_cm: v => v * 2.54,
	// Weight
	kg_lb: v => v * 2.20462,
	lb_kg: v => v * 0.453592,
	g_oz: v => v * 0.035274,
	oz_g: v => v * 28.3495,
	// Temperature
	c_f: v => (v * 9 / 5) + 32,
	f_c: v => (v - 32) * 5 / 9,
	c_k: v => v + 273.15,
	k_c: v => v - 273.15,
	// Volume
	l_gal: v => v * 0.264172,
	gal_l: v => v * 3.78541,
};

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("convert")
		.setDescription("Convert between units")
		.addNumberOption(opt =>
			opt.setName("value")
				.setDescription("The value to convert")
				.setRequired(true),
		)
		.addStringOption(opt =>
			opt.setName("from")
				.setDescription("From unit")
				.setRequired(true)
				.addChoices(
					{ name: "Kilometers", value: "km" },
					{ name: "Miles", value: "mi" },
					{ name: "Meters", value: "m" },
					{ name: "Feet", value: "ft" },
					{ name: "Centimeters", value: "cm" },
					{ name: "Inches", value: "in" },
					{ name: "Kilograms", value: "kg" },
					{ name: "Pounds", value: "lb" },
					{ name: "Celsius", value: "c" },
					{ name: "Fahrenheit", value: "f" },
					{ name: "Kelvin", value: "k" },
					{ name: "Liters", value: "l" },
					{ name: "Gallons", value: "gal" },
				),
		)
		.addStringOption(opt =>
			opt.setName("to")
				.setDescription("To unit")
				.setRequired(true)
				.addChoices(
					{ name: "Kilometers", value: "km" },
					{ name: "Miles", value: "mi" },
					{ name: "Meters", value: "m" },
					{ name: "Feet", value: "ft" },
					{ name: "Centimeters", value: "cm" },
					{ name: "Inches", value: "in" },
					{ name: "Kilograms", value: "kg" },
					{ name: "Pounds", value: "lb" },
					{ name: "Celsius", value: "c" },
					{ name: "Fahrenheit", value: "f" },
					{ name: "Kelvin", value: "k" },
					{ name: "Liters", value: "l" },
					{ name: "Gallons", value: "gal" },
				),
		),

	async execute (interaction) {
		const value = interaction.options.getNumber("value");
		const from = interaction.options.getString("from");
		const to = interaction.options.getString("to");

		const key = `${from}_${to}`;
		const converter = conversions[key];

		if (!converter) {
			return interaction.reply({
				content: `Cannot convert from ${from} to ${to}!`,
				ephemeral: true,
			});
		}

		const result = converter(value);

		return interaction.reply({
			embeds: [{
				color: 0x3669FA,
				title: "🔄 Conversion",
				description: `**${value}** ${from} = **${result.toFixed(4)}** ${to}`,
			}],
		});
	},
};
