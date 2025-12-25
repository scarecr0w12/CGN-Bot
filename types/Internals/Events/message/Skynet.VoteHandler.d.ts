export = VoteHandler;
declare class VoteHandler extends BaseEvent {
    requirements(msg: any): Promise<boolean>;
    prerequisite(msg: any): Promise<void>;
    serverDocument: any;
    handle(msg: any): Promise<void>;
}
import BaseEvent = require("../BaseEvent.js");
//# sourceMappingURL=Skynet.VoteHandler.d.ts.map