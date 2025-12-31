const { EmbedBuilder: DiscordEmbedBuilder } = require("discord.js");

/**
 * Embed Builder Module
 * Handles creation, validation, and management of Discord embeds
 */
class EmbedBuilder {
	/**
	 * Create an embed from template data
	 * @param {Object} embedData - The embed configuration
	 * @returns {DiscordEmbedBuilder}
	 */
	static createFromData (embedData) {
		const embed = new DiscordEmbedBuilder();

		if (embedData.title) embed.setTitle(embedData.title);
		if (embedData.description) embed.setDescription(embedData.description);
		if (embedData.url) embed.setURL(embedData.url);
		if (embedData.color) embed.setColor(embedData.color);
		if (embedData.timestamp) embed.setTimestamp(embedData.timestamp === true ? new Date() : embedData.timestamp);

		if (embedData.author) {
			embed.setAuthor({
				name: embedData.author.name,
				iconURL: embedData.author.icon_url,
				url: embedData.author.url,
			});
		}

		if (embedData.footer) {
			embed.setFooter({
				text: embedData.footer.text,
				iconURL: embedData.footer.icon_url,
			});
		}

		if (embedData.thumbnail) {
			embed.setThumbnail(embedData.thumbnail);
		}

		if (embedData.image) {
			embed.setImage(embedData.image);
		}

		if (embedData.fields && Array.isArray(embedData.fields)) {
			embedData.fields.forEach(field => {
				if (field.name && field.value) {
					embed.addFields({
						name: field.name,
						value: field.value,
						inline: field.inline || false,
					});
				}
			});
		}

		return embed;
	}

	/**
	 * Validate embed data
	 * @param {Object} embedData - The embed configuration to validate
	 * @returns {Object} { valid: boolean, errors: string[] }
	 */
	static validate (embedData) {
		const errors = [];

		// Title validation
		if (embedData.title && embedData.title.length > 256) {
			errors.push("Title must be 256 characters or less");
		}

		// Description validation
		if (embedData.description && embedData.description.length > 4096) {
			errors.push("Description must be 4096 characters or less");
		}

		// Fields validation
		if (embedData.fields) {
			if (embedData.fields.length > 25) {
				errors.push("Maximum of 25 fields allowed");
			}

			embedData.fields.forEach((field, index) => {
				if (field.name && field.name.length > 256) {
					errors.push(`Field ${index + 1} name must be 256 characters or less`);
				}
				if (field.value && field.value.length > 1024) {
					errors.push(`Field ${index + 1} value must be 1024 characters or less`);
				}
			});
		}

		// Footer validation
		if (embedData.footer && embedData.footer.text && embedData.footer.text.length > 2048) {
			errors.push("Footer text must be 2048 characters or less");
		}

		// Author validation
		if (embedData.author && embedData.author.name && embedData.author.name.length > 256) {
			errors.push("Author name must be 256 characters or less");
		}

		// Total character limit
		const totalLength = this.getTotalLength(embedData);
		if (totalLength > 6000) {
			errors.push(`Total embed length (${totalLength}) exceeds 6000 character limit`);
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Calculate total character length of embed
	 * @param {Object} embedData
	 * @returns {number}
	 */
	static getTotalLength (embedData) {
		let total = 0;

		if (embedData.title) total += embedData.title.length;
		if (embedData.description) total += embedData.description.length;
		if (embedData.footer && embedData.footer.text) total += embedData.footer.text.length;
		if (embedData.author && embedData.author.name) total += embedData.author.name.length;

		if (embedData.fields) {
			embedData.fields.forEach(field => {
				if (field.name) total += field.name.length;
				if (field.value) total += field.value.length;
			});
		}

		return total;
	}

	/**
	 * Parse color string to integer
	 * @param {string} color - Color in hex format (#RRGGBB) or named color
	 * @returns {number}
	 */
	static parseColor (color) {
		if (!color) return 0x5865F2; // Discord blurple default

		// Remove # if present
		if (color.startsWith("#")) {
			color = color.substring(1);
		}

		// Parse hex to integer
		const parsed = parseInt(color, 16);
		return isNaN(parsed) ? 0x5865F2 : parsed;
	}

	/**
	 * Convert embed to JSON data for storage
	 * @param {DiscordEmbedBuilder} embed
	 * @returns {Object}
	 */
	static toJSON (embed) {
		return embed.toJSON();
	}

	/**
	 * Replace variables in embed data
	 * @param {Object} embedData
	 * @param {Object} variables - Key-value pairs for replacement
	 * @returns {Object}
	 */
	static replaceVariables (embedData, variables) {
		const data = JSON.parse(JSON.stringify(embedData)); // Deep clone

		const replace = (str) => {
			if (typeof str !== "string") return str;
			let result = str;
			for (const [key, value] of Object.entries(variables)) {
				result = result.replace(new RegExp(`{${key}}`, "g"), value);
			}
			return result;
		};

		if (data.title) data.title = replace(data.title);
		if (data.description) data.description = replace(data.description);
		if (data.footer && data.footer.text) data.footer.text = replace(data.footer.text);
		if (data.author && data.author.name) data.author.name = replace(data.author.name);

		if (data.fields) {
			data.fields = data.fields.map(field => ({
				...field,
				name: replace(field.name),
				value: replace(field.value),
			}));
		}

		return data;
	}
}

module.exports = EmbedBuilder;
