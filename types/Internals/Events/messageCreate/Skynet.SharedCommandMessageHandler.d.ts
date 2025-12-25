export = MaintainerMessageCreate;
declare class MaintainerMessageCreate extends BaseEvent {
    requirements(msg: any): Promise<boolean>;
    handle(msg: any): Promise<void>;
}
import BaseEvent = require("../BaseEvent.js");
//# sourceMappingURL=Skynet.SharedCommandMessageHandler.d.ts.map