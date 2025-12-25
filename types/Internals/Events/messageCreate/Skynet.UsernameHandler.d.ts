export = UsernameHandler;
/**
 * Username updates per message
 */
declare class UsernameHandler extends BaseEvent {
    requirements(msg: any): boolean;
    prerequisite(msg: any): Promise<void>;
    userDocument: any;
    handle(msg: any): Promise<void>;
}
import BaseEvent = require("../BaseEvent");
//# sourceMappingURL=Skynet.UsernameHandler.d.ts.map