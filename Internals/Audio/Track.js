/**
 * Track - Represents a music track in the queue
 */
class Track {
	constructor (data) {
		this.title = data.title || "Unknown Title";
		this.url = data.url;
		this.duration = data.duration || 0;
		this.thumbnail = data.thumbnail || null;
		this.requestedBy = data.requestedBy;
		this.source = data.source || "unknown";
	}

	get durationFormatted () {
		if (!this.duration) return "Live";
		const hours = Math.floor(this.duration / 3600);
		const minutes = Math.floor((this.duration % 3600) / 60);
		const seconds = this.duration % 60;

		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
		}
		return `${minutes}:${seconds.toString().padStart(2, "0")}`;
	}

	toEmbed (color) {
		return {
			color: color,
			title: this.title,
			url: this.url,
			thumbnail: this.thumbnail ? { url: this.thumbnail } : undefined,
			fields: [
				{ name: "Duration", value: this.durationFormatted, inline: true },
				{ name: "Requested By", value: `<@${this.requestedBy}>`, inline: true },
			],
		};
	}
}

module.exports = Track;
