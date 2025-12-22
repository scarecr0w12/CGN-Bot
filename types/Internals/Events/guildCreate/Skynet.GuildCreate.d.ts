export = GuildCreate;
declare class GuildCreate extends BaseEvent {
    handle(guild: any): Promise<void>;
    /**
     * Process referral for a newly joined guild
     * Checks Redis for pending referral codes and awards points to referrer
     */
    processReferral(guild: any): Promise<void>;
}
import BaseEvent = require("../BaseEvent.js");
//# sourceMappingURL=Skynet.GuildCreate.d.ts.map