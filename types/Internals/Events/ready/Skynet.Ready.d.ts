export = Ready;
/**
 * Ready Event Handler
 */
declare class Ready extends BaseEvent {
    afterLeaving(): Promise<void>;
    ensureDocuments(): Promise<any[]>;
    pruneServerData(): Promise<void>;
    setBotActivity(): Promise<void>;
    startMessageCount(): Promise<void>;
    resetVoiceStatsCollector(): Promise<void>;
    startMetricsCollection(): void;
    startTempRoleManager(): void;
    startGameUpdateAnnouncer(): void;
    showStartupMessage(): void;
    /**
     * Start message of the day timer, this time with less bork.
     */
    startMessageOfTheDay(): Promise<void>;
    /**
     * Periodically check if people are streaming
     */
    checkStreamers(): Promise<void>;
    /**
     * Start RSS streaming timers
     */
    startStreamingRSS(): Promise<void>;
    /**
     * Set existing giveaways to end when they expire
     */
    setGiveaways(): Promise<void>;
    /**
     * Set existing countdowns in servers to send message when they expire
     */
    setCountdowns(): Promise<void>;
    /**
     * Set existing reminders to send message when they expire
     */
    setReminders(): Promise<void>;
    /**
     * Count a server's stats (autokick, clearing, etc.);
     */
    statsCollector(): Promise<void>;
}
import BaseEvent = require("../BaseEvent.js");
//# sourceMappingURL=Skynet.Ready.d.ts.map