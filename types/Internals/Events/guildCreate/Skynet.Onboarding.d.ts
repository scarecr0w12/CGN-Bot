export = Onboarding;
declare class Onboarding extends BaseEvent {
    handle(guild: any, isNewServer: any): Promise<void>;
    /**
     * Get users who should receive onboarding DMs
     * @param {Guild} guild
     * @returns {Promise<User[]>}
     */
    getOnboardingRecipients(guild: Guild): Promise<User[]>;
    /**
     * Build the onboarding embed message
     * @param {Guild} guild
     * @returns {Promise<Object>}
     */
    buildOnboardingEmbed(guild: Guild): Promise<any>;
    /**
     * Send onboarding DM to a user (silently fails)
     * @param {User} user
     * @param {Object} embed
     */
    sendOnboardingDM(user: User, embed: any): Promise<void>;
}
import BaseEvent = require("../BaseEvent.js");
//# sourceMappingURL=Skynet.Onboarding.d.ts.map