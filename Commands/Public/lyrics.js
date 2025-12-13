const fetch = require("node-fetch");

module.exports = async ({ configJS, Constants: { Colors } }, documents, msg, commandData) => {
	if (!msg.suffix) {
		return msg.sendInvalidUsage(commandData, "Please provide a song to search for!", "Example: `lyrics Never Gonna Give You Up`");
	}

	const query = msg.suffix.trim();

	// Show loading message
	const loadingMsg = await msg.send({
		embeds: [{
			color: Colors.INFO,
			description: `🔍 Searching for lyrics: **${query}**...`,
		}],
	});

	try {
		// Try lyrics.ovh API (free, no key required)
		let lyrics = null;
		let songTitle = query;
		let artist = "";

		// Check if query contains " - " to split artist and title
		if (query.includes(" - ")) {
			const parts = query.split(" - ");
			artist = parts[0].trim();
			songTitle = parts.slice(1).join(" - ").trim();
		} else if (query.includes(" by ")) {
			const parts = query.split(" by ");
			songTitle = parts[0].trim();
			artist = parts.slice(1).join(" by ").trim();
		}

		// Try lyrics.ovh first
		if (artist && songTitle) {
			try {
				const response = await fetch(
					`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(songTitle)}`,
					{ timeout: 10000 },
				);
				if (response.ok) {
					const data = await response.json();
					if (data.lyrics) {
						lyrics = data.lyrics;
					}
				}
			} catch (e) {
				// Continue to fallback
			}
		}

		// Fallback: Try some-random-api
		if (!lyrics) {
			try {
				const response = await fetch(
					`https://some-random-api.com/others/lyrics?title=${encodeURIComponent(query)}`,
					{ timeout: 10000 },
				);
				if (response.ok) {
					const data = await response.json();
					if (data.lyrics) {
						lyrics = data.lyrics;
						songTitle = data.title || songTitle;
						artist = data.author || artist;
					}
				}
			} catch (e) {
				// Continue
			}
		}

		// Delete loading message
		if (loadingMsg.deletable) {
			loadingMsg.delete().catch(() => { /* ignore */ });
		}

		if (!lyrics) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					title: "Lyrics Not Found",
					description: `Couldn't find lyrics for **${query}**.\n\nTry formatting as: \`Artist - Song Title\``,
					footer: { text: "Example: Queen - Bohemian Rhapsody" },
				}],
			});
		}

		// Clean up lyrics
		lyrics = lyrics.trim();

		// Handle long lyrics by splitting into pages
		const maxLength = 4000;
		if (lyrics.length <= maxLength) {
			return msg.send({
				embeds: [{
					color: Colors.RESPONSE,
					title: `🎵 ${songTitle}`,
					description: lyrics,
					footer: { text: artist ? `Artist: ${artist}` : "Lyrics lookup" },
				}],
			});
		}

		// Split into multiple embeds for long lyrics
		const chunks = [];
		let currentChunk = "";
		const lines = lyrics.split("\n");

		for (const line of lines) {
			if (currentChunk.length + line.length + 1 > maxLength) {
				chunks.push(currentChunk.trim());
				currentChunk = `${line}\n`;
			} else {
				currentChunk += `${line}\n`;
			}
		}
		if (currentChunk.trim()) {
			chunks.push(currentChunk.trim());
		}

		// Send first chunk
		await msg.send({
			embeds: [{
				color: Colors.RESPONSE,
				title: `🎵 ${songTitle}`,
				description: chunks[0],
				footer: { text: `${artist ? `Artist: ${artist} • ` : ""}Page 1/${chunks.length}` },
			}],
		});

		// Send remaining chunks (up to 3 more)
		for (let i = 1; i < Math.min(chunks.length, 4); i++) {
			await msg.send({
				embeds: [{
					color: Colors.RESPONSE,
					description: chunks[i],
					footer: { text: `Page ${i + 1}/${chunks.length}` },
				}],
			});
		}

		if (chunks.length > 4) {
			await msg.send({
				embeds: [{
					color: Colors.INFO,
					description: `*Lyrics truncated. ${chunks.length - 4} more sections not shown.*`,
				}],
			});
		}
	} catch (err) {
		logger.warn(`Lyrics command error: ${err.message}`, { svrid: msg.guild.id });

		// Delete loading message if it exists
		if (loadingMsg?.deletable) {
			loadingMsg.delete().catch(() => { /* ignore */ });
		}

		msg.send({
			embeds: [{
				color: Colors.ERR,
				title: "Error",
				description: "An error occurred while fetching lyrics. Please try again later.",
			}],
		});
	}
};
