export = SpamHandler;
declare class SpamHandler extends BaseEvent {
    requirements(msg: any): boolean;
    handle(msg: any): Promise<void>;
}
import BaseEvent = require("../BaseEvent");
//# sourceMappingURL=Skynet.SpamHandler.d.ts.map