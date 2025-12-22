export = StarboardReaction;
declare class StarboardReaction extends BaseEvent {
    requirements(reaction: any, user: any): boolean;
    handle(reaction: any): Promise<void>;
}
import BaseEvent = require("../BaseEvent.js");
//# sourceMappingURL=Skynet.Starboard.d.ts.map