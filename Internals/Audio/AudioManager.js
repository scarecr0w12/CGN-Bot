/**
 * AudioManager - Central manager for voice connections and music playback
 * Handles per-guild audio players and voice connections
 */
const {
	joinVoiceChannel,
	createAudioPlayer,
	createAudioResource,
	AudioPlayerStatus,
	VoiceConnectionStatus,
	entersState,
	NoSubscriberBehavior,
} = require("@discordjs/voice");
const playDl = require("play-dl");
const MusicQueue = require("./MusicQueue");
const Track = require("./Track");
const { EventEmitter } = require("events");

class GuildPlayer extends EventEmitter {
	constructor (guildId, manager) {
		super();
		this.guildId = guildId;
		this.manager = manager;
		this.queue = new MusicQueue(guildId);
		this.connection = null;
		this.player = null;
		this.textChannel = null;
		this.isPlaying = false;
		this.isPaused = false;
		this.disconnectTimeout = null;
	}

	async connect (voiceChannel, textChannel) {
		this.textChannel = textChannel;

		if (this.connection?.state?.status === VoiceConnectionStatus.Ready) {
			return this.connection;
		}

		this.connection = joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: this.guildId,
			adapterCreator: voiceChannel.guild.voiceAdapterCreator,
			selfDeaf: true,
		});

		this.player = createAudioPlayer({
			behaviors: {
				noSubscriber: NoSubscriberBehavior.Play,
			},
		});

		this.connection.subscribe(this.player);

		this.player.on(AudioPlayerStatus.Idle, () => this.handleTrackEnd());
		this.player.on("error", error => {
			logger.error("Audio player error", { guildId: this.guildId }, error);
			this.handleTrackEnd();
		});

		this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
			try {
				await Promise.race([
					entersState(this.connection, VoiceConnectionStatus.Signalling, 5000),
					entersState(this.connection, VoiceConnectionStatus.Connecting, 5000),
				]);
			} catch {
				this.destroy();
			}
		});

		try {
			await entersState(this.connection, VoiceConnectionStatus.Ready, 20000);
			this.clearDisconnectTimeout();
			return this.connection;
		} catch (error) {
			this.destroy();
			throw new Error("Failed to connect to voice channel");
		}
	}

	async play () {
		const track = this.queue.next();
		if (!track) {
			this.isPlaying = false;
			this.startDisconnectTimeout();
			return null;
		}

		this.isPlaying = true;
		this.isPaused = false;
		this.clearDisconnectTimeout();

		try {
			let stream;
			if (track.source === "youtube") {
				const streamInfo = await playDl.stream(track.url, {
					quality: 2,
				});
				stream = streamInfo.stream;
			} else {
				stream = await playDl.stream(track.url);
			}

			const resource = createAudioResource(stream.stream, {
				inputType: stream.type,
				inlineVolume: true,
			});

			if (resource.volume) {
				resource.volume.setVolume(this.queue.volume / 100);
			}

			this.player.play(resource);
			this.emit("trackStart", track);
			return track;
		} catch (error) {
			logger.error("Failed to play track", { guildId: this.guildId, url: track.url }, error);
			this.emit("trackError", track, error);
			return this.play();
		}
	}

	handleTrackEnd () {
		if (this.queue.isEmpty && !this.queue.loop) {
			this.isPlaying = false;
			this.emit("queueEnd");
			this.startDisconnectTimeout();
		} else {
			this.play();
		}
	}

	pause () {
		if (this.player && this.isPlaying && !this.isPaused) {
			this.player.pause();
			this.isPaused = true;
			return true;
		}
		return false;
	}

	resume () {
		if (this.player && this.isPaused) {
			this.player.unpause();
			this.isPaused = false;
			return true;
		}
		return false;
	}

	skip () {
		if (this.player) {
			this.queue.loop = false;
			this.player.stop();
			return true;
		}
		return false;
	}

	stop () {
		this.queue.clear();
		this.queue.currentTrack = null;
		if (this.player) {
			this.player.stop();
		}
		this.isPlaying = false;
		this.isPaused = false;
	}

	setVolume (volume) {
		this.queue.setVolume(volume);
		if (this.player?.state?.resource?.volume) {
			this.player.state.resource.volume.setVolume(volume / 100);
		}
	}

	startDisconnectTimeout () {
		this.clearDisconnectTimeout();
		this.disconnectTimeout = setTimeout(() => {
			if (!this.isPlaying) {
				this.destroy();
			}
		}, 5 * 60 * 1000);
	}

	clearDisconnectTimeout () {
		if (this.disconnectTimeout) {
			clearTimeout(this.disconnectTimeout);
			this.disconnectTimeout = null;
		}
	}

	destroy () {
		this.clearDisconnectTimeout();
		this.stop();
		if (this.connection) {
			this.connection.destroy();
			this.connection = null;
		}
		this.player = null;
		this.emit("destroyed");
		this.manager.players.delete(this.guildId);
	}
}

class AudioManager {
	constructor (client) {
		this.client = client;
		this.players = new Map();
	}

	getPlayer (guildId) {
		return this.players.get(guildId);
	}

	createPlayer (guildId) {
		if (this.players.has(guildId)) {
			return this.players.get(guildId);
		}
		const player = new GuildPlayer(guildId, this);
		this.players.set(guildId, player);
		return player;
	}

	async search (query, requestedBy) {
		try {
			let info;

			if (playDl.yt_validate(query) === "video") {
				info = await playDl.video_basic_info(query);
				return [new Track({
					title: info.video_details.title,
					url: info.video_details.url,
					duration: info.video_details.durationInSec,
					thumbnail: info.video_details.thumbnails?.[0]?.url,
					requestedBy,
					source: "youtube",
				})];
			}

			if (playDl.yt_validate(query) === "playlist") {
				const playlist = await playDl.playlist_info(query, { incomplete: true });
				const videos = await playlist.all_videos();
				return videos.map(video => new Track({
					title: video.title,
					url: video.url,
					duration: video.durationInSec,
					thumbnail: video.thumbnails?.[0]?.url,
					requestedBy,
					source: "youtube",
				}));
			}

			const searchResults = await playDl.search(query, { limit: 5 });
			return searchResults.map(video => new Track({
				title: video.title,
				url: video.url,
				duration: video.durationInSec,
				thumbnail: video.thumbnails?.[0]?.url,
				requestedBy,
				source: "youtube",
			}));
		} catch (error) {
			logger.error("Search error", { query }, error);
			throw error;
		}
	}

	destroyPlayer (guildId) {
		const player = this.players.get(guildId);
		if (player) {
			player.destroy();
		}
	}
}

module.exports = AudioManager;
