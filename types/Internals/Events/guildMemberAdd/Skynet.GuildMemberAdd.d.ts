export = GuildMemberAdd;
/**
 * Member joined a server
 */
declare class GuildMemberAdd extends BaseEvent {
    handle(member: any): Promise<void>;
}
import BaseEvent = require("../BaseEvent.js");
//# sourceMappingURL=Skynet.GuildMemberAdd.d.ts.map