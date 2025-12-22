export = ChannelDelete;
declare class ChannelDelete extends BaseEvent {
    requirements(channel: any): boolean;
    handle(channel: any): Promise<any>;
}
import BaseEvent = require("../BaseEvent.js");
//# sourceMappingURL=Skynet.ChannelDelete.d.ts.map