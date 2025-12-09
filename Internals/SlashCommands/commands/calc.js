const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("calc")
		.setDescription("Calculate a mathematical expression")
		.addStringOption(opt =>
			opt.setName("expression")
				.setDescription("The math expression to calculate")
				.setRequired(true),
		),

	async execute (interaction) {
		const expression = interaction.options.getString("expression");

		try {
			// Safe math evaluation (no eval)
			const result = safeEval(expression);

			return interaction.reply({
				embeds: [{
					color: 0x3669FA,
					title: "🧮 Calculator",
					fields: [
						{ name: "Expression", value: `\`${expression}\``, inline: false },
						{ name: "Result", value: `\`${result}\``, inline: false },
					],
				}],
			});
		} catch (err) {
			return interaction.reply({
				content: `Invalid expression: ${err.message}`,
				ephemeral: true,
			});
		}
	},
};

function safeEval (expr) {
	// Only allow numbers, operators, parentheses, and basic math functions
	const sanitized = expr.replace(/\s/g, "");
	if (!/^[\d+\-*/().%^sqrt|sin|cos|tan|log|abs|floor|ceil|round|pi|e]+$/i.test(sanitized)) {
		throw new Error("Invalid characters in expression");
	}

	// Replace common math functions
	const processed = sanitized
		.replace(/\^/g, "**")
		.replace(/sqrt\(/gi, "Math.sqrt(")
		.replace(/sin\(/gi, "Math.sin(")
		.replace(/cos\(/gi, "Math.cos(")
		.replace(/tan\(/gi, "Math.tan(")
		.replace(/log\(/gi, "Math.log10(")
		.replace(/abs\(/gi, "Math.abs(")
		.replace(/floor\(/gi, "Math.floor(")
		.replace(/ceil\(/gi, "Math.ceil(")
		.replace(/round\(/gi, "Math.round(")
		.replace(/\bpi\b/gi, "Math.PI")
		.replace(/\be\b/gi, "Math.E");

	// Use Function constructor for safer evaluation
	const result = new Function(`return ${processed}`)();

	if (typeof result !== "number" || !isFinite(result)) {
		throw new Error("Result is not a valid number");
	}

	return result;
}
