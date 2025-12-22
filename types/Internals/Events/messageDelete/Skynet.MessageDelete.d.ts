export = MessageDelete;
declare class MessageDelete extends BaseEvent {
    requirements(msg: any): boolean;
    handle(msg: any): Promise<any>;
}
import BaseEvent = require("../BaseEvent.js");
//# sourceMappingURL=Skynet.MessageDelete.d.ts.map