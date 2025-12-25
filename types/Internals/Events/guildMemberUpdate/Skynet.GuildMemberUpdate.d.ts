export = GuildMemberUpdate;
declare class GuildMemberUpdate extends BaseEvent {
    handle(oldMember: any, member: any): Promise<any>;
}
import BaseEvent = require("../BaseEvent");
//# sourceMappingURL=Skynet.GuildMemberUpdate.d.ts.map