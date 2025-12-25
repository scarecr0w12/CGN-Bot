export = UsernameUpdater;
declare class UsernameUpdater extends BaseEvent {
    requirements(oldUser: any, newUser: any): Promise<boolean>;
    handle(oldUser: any, newUser: any): Promise<void>;
}
import BaseEvent = require("../BaseEvent.js");
//# sourceMappingURL=Skynet.UpdateUsername.d.ts.map