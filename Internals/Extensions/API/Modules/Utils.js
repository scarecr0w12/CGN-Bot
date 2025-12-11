/**
 * Utility module providing helper functions for extensions.
 * These functions are designed to work within the isolated sandbox.
 * @namespace API.Utils
 */
module.exports = class Utils {
	/**
	 * Get the serializable utility functions for the sandbox.
	 * @returns {Object} Object containing all utility functions
	 */
	static getSerializableFunctions () {
		return {
			// Text manipulation
			text: {
				/**
				 * Convert text to uppercase.
				 * @param {String} str - Input string
				 * @returns {String}
				 */
				upper: str => String(str).toUpperCase(),

				/**
				 * Convert text to lowercase.
				 * @param {String} str - Input string
				 * @returns {String}
				 */
				lower: str => String(str).toLowerCase(),

				/**
				 * Capitalize the first letter of each word.
				 * @param {String} str - Input string
				 * @returns {String}
				 */
				capitalize: str => String(str).replace(/\b\w/g, l => l.toUpperCase()),

				/**
				 * Capitalize only the first letter.
				 * @param {String} str - Input string
				 * @returns {String}
				 */
				capitalizeFirst: str => String(str).charAt(0).toUpperCase() + String(str).slice(1),

				/**
				 * Reverse a string.
				 * @param {String} str - Input string
				 * @returns {String}
				 */
				reverse: str => String(str).split("")
					.reverse()
					.join(""),

				/**
				 * Truncate string to a maximum length with ellipsis.
				 * @param {String} str - Input string
				 * @param {Number} maxLength - Maximum length
				 * @param {String} [suffix='...'] - Suffix to add
				 * @returns {String}
				 */
				truncate: (str, maxLength, suffix = "...") => {
					str = String(str);
					if (str.length <= maxLength) return str;
					return str.slice(0, maxLength - suffix.length) + suffix;
				},

				/**
				 * Pad a string to a certain length.
				 * @param {String} str - Input string
				 * @param {Number} length - Target length
				 * @param {String} [char=' '] - Padding character
				 * @param {String} [side='right'] - 'left', 'right', or 'both'
				 * @returns {String}
				 */
				pad: (str, length, char = " ", side = "right") => {
					str = String(str);
					if (str.length >= length) return str;
					const padLength = length - str.length;
					if (side === "left") return char.repeat(padLength) + str;
					if (side === "both") {
						const leftPad = Math.floor(padLength / 2);
						const rightPad = padLength - leftPad;
						return char.repeat(leftPad) + str + char.repeat(rightPad);
					}
					return str + char.repeat(padLength);
				},

				/**
				 * Remove extra whitespace and trim.
				 * @param {String} str - Input string
				 * @returns {String}
				 */
				clean: str => String(str).replace(/\s+/g, " ").trim(),

				/**
				 * Convert to slug format (lowercase, hyphens).
				 * @param {String} str - Input string
				 * @returns {String}
				 */
				slugify: str => String(str).toLowerCase()
					.replace(/[^a-z0-9]+/g, "-")
					.replace(/^-|-$/g, ""),

				/**
				 * Count occurrences of a substring.
				 * @param {String} str - Input string
				 * @param {String} search - Substring to search
				 * @returns {Number}
				 */
				count: (str, search) => (String(str).match(new RegExp(search, "g")) || []).length,

				/**
				 * Check if string contains a substring (case insensitive).
				 * @param {String} str - Input string
				 * @param {String} search - Substring to search
				 * @returns {Boolean}
				 */
				includes: (str, search) => String(str).toLowerCase().includes(String(search).toLowerCase()),

				/**
				 * Convert mocking SpongeBob text.
				 * @param {String} str - Input string
				 * @returns {String}
				 */
				mock: str => String(str).split("")
					.map((c, i) => i % 2 ? c.toUpperCase() : c.toLowerCase())
					.join(""),

				/**
				 * Replace all occurrences.
				 * @param {String} str - Input string
				 * @param {String} search - String to find
				 * @param {String} replace - Replacement string
				 * @returns {String}
				 */
				replaceAll: (str, search, replace) => String(str).split(search).join(replace),

				/**
				 * Split string into words.
				 * @param {String} str - Input string
				 * @returns {Array<String>}
				 */
				words: str => String(str).trim().split(/\s+/),

				/**
				 * Escape HTML entities.
				 * @param {String} str - Input string
				 * @returns {String}
				 */
				escapeHtml: str => String(str)
					.replace(/&/g, "&amp;")
					.replace(/</g, "&lt;")
					.replace(/>/g, "&gt;")
					.replace(/"/g, "&quot;")
					.replace(/'/g, "&#039;"),

				/**
				 * Escape Discord markdown.
				 * @param {String} str - Input string
				 * @returns {String}
				 */
				escapeMarkdown: str => String(str)
					.replace(/([*_~`|\\])/g, "\\$1"),
			},

			// Random utilities
			random: {
				/**
				 * Generate a random integer between min and max (inclusive).
				 * @param {Number} min - Minimum value
				 * @param {Number} max - Maximum value
				 * @returns {Number}
				 */
				int: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,

				/**
				 * Generate a random float between min and max.
				 * @param {Number} min - Minimum value
				 * @param {Number} max - Maximum value
				 * @returns {Number}
				 */
				float: (min, max) => Math.random() * (max - min) + min,

				/**
				 * Pick a random element from an array.
				 * @param {Array} arr - Input array
				 * @returns {*}
				 */
				pick: arr => arr[Math.floor(Math.random() * arr.length)],

				/**
				 * Pick multiple random unique elements from an array.
				 * @param {Array} arr - Input array
				 * @param {Number} count - Number of elements to pick
				 * @returns {Array}
				 */
				pickMultiple: (arr, count) => {
					const shuffled = [...arr].sort(() => Math.random() - 0.5);
					return shuffled.slice(0, Math.min(count, arr.length));
				},

				/**
				 * Shuffle an array (returns new array).
				 * @param {Array} arr - Input array
				 * @returns {Array}
				 */
				shuffle: arr => {
					const result = [...arr];
					for (let i = result.length - 1; i > 0; i--) {
						const j = Math.floor(Math.random() * (i + 1));
						[result[i], result[j]] = [result[j], result[i]];
					}
					return result;
				},

				/**
				 * Generate a random boolean with optional probability.
				 * @param {Number} [probability=0.5] - Probability of true (0-1)
				 * @returns {Boolean}
				 */
				bool: (probability = 0.5) => Math.random() < probability,

				/**
				 * Generate a random string.
				 * @param {Number} length - Length of string
				 * @param {String} [charset='alphanumeric'] - 'alphanumeric', 'alpha', 'numeric', 'hex', or custom charset
				 * @returns {String}
				 */
				string: (length, charset = "alphanumeric") => {
					const charsets = {
						alphanumeric: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
						alpha: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
						numeric: "0123456789",
						hex: "0123456789abcdef",
					};
					const chars = charsets[charset] || charset;
					let result = "";
					for (let i = 0; i < length; i++) {
						result += chars.charAt(Math.floor(Math.random() * chars.length));
					}
					return result;
				},

				/**
				 * Roll dice in standard notation (e.g., "2d6", "1d20+5").
				 * @param {String} notation - Dice notation
				 * @returns {Object} { rolls: Array, total: Number, notation: String }
				 */
				dice: notation => {
					const match = notation.match(/^(\d+)?d(\d+)([+-]\d+)?$/i);
					if (!match) return { rolls: [], total: 0, notation };
					const count = parseInt(match[1]) || 1;
					const sides = parseInt(match[2]);
					const modifier = parseInt(match[3]) || 0;
					const rolls = [];
					for (let i = 0; i < Math.min(count, 100); i++) {
						rolls.push(Math.floor(Math.random() * sides) + 1);
					}
					const total = rolls.reduce((a, b) => a + b, 0) + modifier;
					return { rolls, total, notation };
				},

				/**
				 * Weighted random selection.
				 * @param {Array<{item: *, weight: Number}>} items - Items with weights
				 * @returns {*}
				 */
				weighted: items => {
					const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
					let random = Math.random() * totalWeight;
					for (const item of items) {
						random -= item.weight;
						if (random <= 0) return item.item;
					}
					return items[items.length - 1].item;
				},
			},

			// Math utilities
			math: {
				/**
				 * Clamp a number between min and max.
				 * @param {Number} num - Input number
				 * @param {Number} min - Minimum value
				 * @param {Number} max - Maximum value
				 * @returns {Number}
				 */
				clamp: (num, min, max) => Math.min(Math.max(num, min), max),

				/**
				 * Linear interpolation.
				 * @param {Number} start - Start value
				 * @param {Number} end - End value
				 * @param {Number} t - Interpolation factor (0-1)
				 * @returns {Number}
				 */
				lerp: (start, end, t) => start + (end - start) * t,

				/**
				 * Map a number from one range to another.
				 * @param {Number} num - Input number
				 * @param {Number} inMin - Input range minimum
				 * @param {Number} inMax - Input range maximum
				 * @param {Number} outMin - Output range minimum
				 * @param {Number} outMax - Output range maximum
				 * @returns {Number}
				 */
				map: (num, inMin, inMax, outMin, outMax) =>
					((num - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin,

				/**
				 * Round to a specific number of decimal places.
				 * @param {Number} num - Input number
				 * @param {Number} [places=0] - Decimal places
				 * @returns {Number}
				 */
				round: (num, places = 0) => {
					const factor = Math.pow(10, places);
					return Math.round(num * factor) / factor;
				},

				/**
				 * Calculate percentage.
				 * @param {Number} value - Current value
				 * @param {Number} total - Total value
				 * @param {Number} [decimals=0] - Decimal places
				 * @returns {Number}
				 */
				percentage: (value, total, decimals = 0) => {
					if (total === 0) return 0;
					const factor = Math.pow(10, decimals);
					return Math.round((value / total) * 100 * factor) / factor;
				},

				/**
				 * Sum an array of numbers.
				 * @param {Array<Number>} arr - Input array
				 * @returns {Number}
				 */
				sum: arr => arr.reduce((a, b) => a + b, 0),

				/**
				 * Calculate average of an array.
				 * @param {Array<Number>} arr - Input array
				 * @returns {Number}
				 */
				average: arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0,

				/**
				 * Find minimum value in array.
				 * @param {Array<Number>} arr - Input array
				 * @returns {Number}
				 */
				min: arr => Math.min(...arr),

				/**
				 * Find maximum value in array.
				 * @param {Array<Number>} arr - Input array
				 * @returns {Number}
				 */
				max: arr => Math.max(...arr),

				/**
				 * Check if a number is between two values.
				 * @param {Number} num - Input number
				 * @param {Number} min - Minimum value
				 * @param {Number} max - Maximum value
				 * @param {Boolean} [inclusive=true] - Include boundaries
				 * @returns {Boolean}
				 */
				between: (num, min, max, inclusive = true) =>
					inclusive ? num >= min && num <= max : num > min && num < max,
			},

			// Array utilities
			array: {
				/**
				 * Get unique values from array.
				 * @param {Array} arr - Input array
				 * @returns {Array}
				 */
				unique: arr => [...new Set(arr)],

				/**
				 * Chunk array into smaller arrays.
				 * @param {Array} arr - Input array
				 * @param {Number} size - Chunk size
				 * @returns {Array<Array>}
				 */
				chunk: (arr, size) => {
					const chunks = [];
					for (let i = 0; i < arr.length; i += size) {
						chunks.push(arr.slice(i, i + size));
					}
					return chunks;
				},

				/**
				 * Flatten nested arrays.
				 * @param {Array} arr - Input array
				 * @param {Number} [depth=1] - Depth to flatten
				 * @returns {Array}
				 */
				flatten: (arr, depth = 1) => arr.flat(depth),

				/**
				 * Get first N elements.
				 * @param {Array} arr - Input array
				 * @param {Number} n - Number of elements
				 * @returns {Array}
				 */
				first: (arr, n = 1) => arr.slice(0, n),

				/**
				 * Get last N elements.
				 * @param {Array} arr - Input array
				 * @param {Number} n - Number of elements
				 * @returns {Array}
				 */
				last: (arr, n = 1) => arr.slice(-n),

				/**
				 * Remove falsy values from array.
				 * @param {Array} arr - Input array
				 * @returns {Array}
				 */
				compact: arr => arr.filter(Boolean),

				/**
				 * Count occurrences of each value.
				 * @param {Array} arr - Input array
				 * @returns {Object}
				 */
				countBy: arr => {
					const counts = {};
					for (const item of arr) {
						counts[item] = (counts[item] || 0) + 1;
					}
					return counts;
				},

				/**
				 * Group array by a key function.
				 * @param {Array} arr - Input array
				 * @param {Function} keyFn - Key function
				 * @returns {Object}
				 */
				groupBy: (arr, keyFn) => {
					const groups = {};
					for (const item of arr) {
						const key = typeof keyFn === "function" ? keyFn(item) : item[keyFn];
						if (!groups[key]) groups[key] = [];
						groups[key].push(item);
					}
					return groups;
				},

				/**
				 * Get intersection of two arrays.
				 * @param {Array} arr1 - First array
				 * @param {Array} arr2 - Second array
				 * @returns {Array}
				 */
				intersection: (arr1, arr2) => arr1.filter(x => arr2.includes(x)),

				/**
				 * Get difference of two arrays.
				 * @param {Array} arr1 - First array
				 * @param {Array} arr2 - Second array
				 * @returns {Array}
				 */
				difference: (arr1, arr2) => arr1.filter(x => !arr2.includes(x)),
			},

			// Format utilities
			format: {
				/**
				 * Format a number with commas.
				 * @param {Number} num - Input number
				 * @returns {String}
				 */
				number: num => num.toLocaleString("en-US"),

				/**
				 * Format as currency.
				 * @param {Number} amount - Amount
				 * @param {String} [currency='USD'] - Currency code
				 * @returns {String}
				 */
				currency: (amount, currencyCode = "USD") => new Intl.NumberFormat("en-US", {
					style: "currency",
					currency: currencyCode,
				}).format(amount),

				/**
				 * Format bytes to human readable.
				 * @param {Number} bytes - Bytes
				 * @param {Number} [decimals=2] - Decimal places
				 * @returns {String}
				 */
				bytes: (bytes, decimals = 2) => {
					if (bytes === 0) return "0 Bytes";
					const k = 1024;
					const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
					const i = Math.floor(Math.log(bytes) / Math.log(k));
					return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
				},

				/**
				 * Format a duration in milliseconds.
				 * @param {Number} ms - Milliseconds
				 * @param {Boolean} [verbose=false] - Use verbose format
				 * @returns {String}
				 */
				duration: (ms, verbose = false) => {
					const seconds = Math.floor(ms / 1000);
					const minutes = Math.floor(seconds / 60);
					const hours = Math.floor(minutes / 60);
					const days = Math.floor(hours / 24);

					if (verbose) {
						const parts = [];
						if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
						if (hours % 24 > 0) parts.push(`${hours % 24} hour${hours % 24 !== 1 ? "s" : ""}`);
						if (minutes % 60 > 0) parts.push(`${minutes % 60} minute${minutes % 60 !== 1 ? "s" : ""}`);
						if (seconds % 60 > 0) parts.push(`${seconds % 60} second${seconds % 60 !== 1 ? "s" : ""}`);
						return parts.join(", ") || "0 seconds";
					}

					if (days > 0) return `${days}d ${hours % 24}h`;
					if (hours > 0) return `${hours}h ${minutes % 60}m`;
					if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
					return `${seconds}s`;
				},

				/**
				 * Format ordinal number (1st, 2nd, 3rd, etc.).
				 * @param {Number} num - Input number
				 * @returns {String}
				 */
				ordinal: num => {
					const s = ["th", "st", "nd", "rd"];
					const v = num % 100;
					return num + (s[(v - 20) % 10] || s[v] || s[0]);
				},

				/**
				 * Format a list with proper grammar.
				 * @param {Array<String>} items - Items to list
				 * @param {String} [conjunction='and'] - Conjunction word
				 * @returns {String}
				 */
				list: (items, conjunction = "and") => {
					if (items.length === 0) return "";
					if (items.length === 1) return items[0];
					if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
					return `${items.slice(0, -1).join(", ")}, ${conjunction} ${items[items.length - 1]}`;
				},

				/**
				 * Pluralize a word based on count.
				 * @param {Number} count - Count
				 * @param {String} singular - Singular form
				 * @param {String} [plural] - Plural form (defaults to singular + 's')
				 * @returns {String}
				 */
				pluralize: (count, singular, plural) => {
					return count === 1 ? singular : (plural || `${singular}s`);
				},

				/**
				 * Format a progress bar.
				 * @param {Number} current - Current value
				 * @param {Number} total - Total value
				 * @param {Number} [length=10] - Bar length
				 * @param {String} [filled='█'] - Filled character
				 * @param {String} [empty='░'] - Empty character
				 * @returns {String}
				 */
				progressBar: (current, total, length = 10, filled = "█", empty = "░") => {
					const percentage = Math.min(current / total, 1);
					const filledLength = Math.round(percentage * length);
					return filled.repeat(filledLength) + empty.repeat(length - filledLength);
				},
			},

			// Time utilities
			time: {
				/**
				 * Get current timestamp in milliseconds.
				 * @returns {Number}
				 */
				now: () => Date.now(),

				/**
				 * Get current timestamp in seconds.
				 * @returns {Number}
				 */
				unix: () => Math.floor(Date.now() / 1000),

				/**
				 * Parse a date string to timestamp.
				 * @param {String} dateStr - Date string
				 * @returns {Number}
				 */
				parse: dateStr => new Date(dateStr).getTime(),

				/**
				 * Format a timestamp as ISO string.
				 * @param {Number} [timestamp=Date.now()] - Timestamp
				 * @returns {String}
				 */
				iso: (timestamp = Date.now()) => new Date(timestamp).toISOString(),

				/**
				 * Get Discord timestamp format.
				 * @param {Number} timestamp - Timestamp in ms or seconds
				 * @param {String} [style='f'] - Style: t, T, d, D, f, F, R
				 * @returns {String}
				 */
				discord: (timestamp, style = "f") => {
					// Convert ms to seconds if needed
					const seconds = timestamp > 9999999999 ? Math.floor(timestamp / 1000) : timestamp;
					return `<t:${seconds}:${style}>`;
				},

				/**
				 * Get relative time string.
				 * @param {Number} timestamp - Timestamp
				 * @returns {String}
				 */
				relative: timestamp => {
					const now = Date.now();
					const diff = now - timestamp;
					const seconds = Math.floor(Math.abs(diff) / 1000);
					const minutes = Math.floor(seconds / 60);
					const hours = Math.floor(minutes / 60);
					const days = Math.floor(hours / 24);

					const future = diff < 0;
					let result;

					if (days > 0) result = `${days} day${days !== 1 ? "s" : ""}`;
					else if (hours > 0) result = `${hours} hour${hours !== 1 ? "s" : ""}`;
					else if (minutes > 0) result = `${minutes} minute${minutes !== 1 ? "s" : ""}`;
					else result = `${seconds} second${seconds !== 1 ? "s" : ""}`;

					return future ? `in ${result}` : `${result} ago`;
				},

				/**
				 * Add time to a timestamp.
				 * @param {Number} timestamp - Base timestamp
				 * @param {Number} amount - Amount to add
				 * @param {String} unit - Unit: 'ms', 's', 'm', 'h', 'd', 'w'
				 * @returns {Number}
				 */
				add: (timestamp, amount, unit) => {
					const multipliers = {
						ms: 1,
						s: 1000,
						m: 60000,
						h: 3600000,
						d: 86400000,
						w: 604800000,
					};
					return timestamp + (amount * (multipliers[unit] || 1));
				},

				/**
				 * Get start of a time period.
				 * @param {Number} [timestamp=Date.now()] - Timestamp
				 * @param {String} unit - Unit: 'day', 'hour', 'minute'
				 * @returns {Number}
				 */
				startOf: (timestamp = Date.now(), unit) => {
					const date = new Date(timestamp);
					switch (unit) {
						case "day":
							date.setHours(0, 0, 0, 0);
							break;
						case "hour":
							date.setMinutes(0, 0, 0);
							break;
						case "minute":
							date.setSeconds(0, 0);
							break;
					}
					return date.getTime();
				},
			},

			// Discord utilities
			discord: {
				/**
				 * Create a user mention.
				 * @param {String} userId - User ID
				 * @returns {String}
				 */
				userMention: userId => `<@${userId}>`,

				/**
				 * Create a channel mention.
				 * @param {String} channelId - Channel ID
				 * @returns {String}
				 */
				channelMention: channelId => `<#${channelId}>`,

				/**
				 * Create a role mention.
				 * @param {String} roleId - Role ID
				 * @returns {String}
				 */
				roleMention: roleId => `<@&${roleId}>`,

				/**
				 * Create a custom emoji string.
				 * @param {String} name - Emoji name
				 * @param {String} id - Emoji ID
				 * @param {Boolean} [animated=false] - Whether animated
				 * @returns {String}
				 */
				emoji: (name, id, animated = false) => `<${animated ? "a" : ""}:${name}:${id}>`,

				/**
				 * Create a code block.
				 * @param {String} content - Code content
				 * @param {String} [language=''] - Language for syntax highlighting
				 * @returns {String}
				 */
				codeBlock: (content, language = "") => `\`\`\`${language}\n${content}\n\`\`\``,

				/**
				 * Create inline code.
				 * @param {String} content - Code content
				 * @returns {String}
				 */
				inlineCode: content => `\`${content}\``,

				/**
				 * Create bold text.
				 * @param {String} text - Text
				 * @returns {String}
				 */
				bold: text => `**${text}**`,

				/**
				 * Create italic text.
				 * @param {String} text - Text
				 * @returns {String}
				 */
				italic: text => `*${text}*`,

				/**
				 * Create underlined text.
				 * @param {String} text - Text
				 * @returns {String}
				 */
				underline: text => `__${text}__`,

				/**
				 * Create strikethrough text.
				 * @param {String} text - Text
				 * @returns {String}
				 */
				strikethrough: text => `~~${text}~~`,

				/**
				 * Create spoiler text.
				 * @param {String} text - Text
				 * @returns {String}
				 */
				spoiler: text => `||${text}||`,

				/**
				 * Create a quote block.
				 * @param {String} text - Text
				 * @returns {String}
				 */
				quote: text => `> ${text}`,

				/**
				 * Create a block quote.
				 * @param {String} text - Text
				 * @returns {String}
				 */
				blockQuote: text => `>>> ${text}`,

				/**
				 * Create a hyperlink.
				 * @param {String} text - Display text
				 * @param {String} url - URL
				 * @returns {String}
				 */
				hyperlink: (text, url) => `[${text}](${url})`,

				/**
				 * Parse a Discord snowflake ID to get creation timestamp.
				 * @param {String} snowflake - Snowflake ID
				 * @returns {Number} Timestamp in ms
				 */
				snowflakeToTimestamp: snowflake => {
					const DISCORD_EPOCH = 1420070400000;
					// eslint-disable-next-line no-undef
					const id = typeof BigInt !== "undefined" ? BigInt(snowflake) : parseInt(snowflake);
					const timestamp = typeof BigInt !== "undefined" ? Number(id >> 22n) : Math.floor(id / 4194304);
					return timestamp + DISCORD_EPOCH;
				},
			},
		};
	}
};
