export = MessageUpdate;
declare class MessageUpdate extends BaseEvent {
    requirements(oldMsg: any, msg: any): boolean;
    handle(oldMsg: any, msg: any): Promise<any>;
}
import BaseEvent = require("../BaseEvent.js");
//# sourceMappingURL=Skynet.MessageUpdate.d.ts.map