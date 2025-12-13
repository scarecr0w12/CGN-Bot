/**
 * MusicQueue - Manages the track queue for a guild
 */
const { EventEmitter } = require("events");

class MusicQueue extends EventEmitter {
	constructor (guildId) {
		super();
		this.guildId = guildId;
		this.tracks = [];
		this.currentTrack = null;
		this.loop = false;
		this.loopQueue = false;
		this.volume = 100;
		this.filters = {
			bassboost: false,
			nightcore: false,
			vaporwave: false,
			"8d": false,
		};
	}

	add (track) {
		this.tracks.push(track);
		this.emit("trackAdded", track);
		return this.tracks.length;
	}

	addNext (track) {
		this.tracks.unshift(track);
		this.emit("trackAdded", track);
		return 1;
	}

	remove (index) {
		if (index < 0 || index >= this.tracks.length) return null;
		const [removed] = this.tracks.splice(index, 1);
		this.emit("trackRemoved", removed);
		return removed;
	}

	next () {
		if (this.loop && this.currentTrack) {
			return this.currentTrack;
		}

		if (this.loopQueue && this.currentTrack) {
			this.tracks.push(this.currentTrack);
		}

		this.currentTrack = this.tracks.shift() || null;
		return this.currentTrack;
	}

	shuffle () {
		for (let i = this.tracks.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
		}
		this.emit("queueShuffled");
	}

	clear () {
		this.tracks = [];
		this.emit("queueCleared");
	}

	setLoop (mode) {
		if (mode === "track") {
			this.loop = true;
			this.loopQueue = false;
		} else if (mode === "queue") {
			this.loop = false;
			this.loopQueue = true;
		} else {
			this.loop = false;
			this.loopQueue = false;
		}
	}

	setVolume (vol) {
		this.volume = Math.max(0, Math.min(200, vol));
	}

	setFilter (filter, enabled) {
		if (filter in this.filters) {
			this.filters[filter] = enabled;
			this.emit("filterChanged", filter, enabled);
			return true;
		}
		return false;
	}

	get isEmpty () {
		return this.tracks.length === 0;
	}

	get size () {
		return this.tracks.length;
	}

	get totalDuration () {
		return this.tracks.reduce((acc, track) => acc + (track.duration || 0), 0);
	}

	getPage (page = 1, perPage = 10) {
		const start = (page - 1) * perPage;
		const end = start + perPage;
		return {
			tracks: this.tracks.slice(start, end),
			page,
			totalPages: Math.ceil(this.tracks.length / perPage) || 1,
			total: this.tracks.length,
		};
	}
}

module.exports = MusicQueue;
