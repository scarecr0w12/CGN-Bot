export = PresenceUpdate;
declare class PresenceUpdate extends BaseEvent {
    requirements(oldPresence: any, presence: any): boolean;
    handle(oldPresence: any, presence: any): Promise<void>;
}
import BaseEvent = require("../BaseEvent.js");
//# sourceMappingURL=Skynet.PresenceUpdate.d.ts.map