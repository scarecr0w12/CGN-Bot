export = AFKHandler;
declare class AFKHandler extends BaseEvent {
    requirements(msg: any): Promise<boolean>;
    handle(msg: any): Promise<void>;
}
import BaseEvent = require("../BaseEvent.js");
//# sourceMappingURL=Skynet.AFKHandler.d.ts.map