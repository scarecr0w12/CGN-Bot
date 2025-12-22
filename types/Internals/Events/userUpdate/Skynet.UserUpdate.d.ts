export = UserUpdate;
declare class UserUpdate extends BaseEvent {
    requirements(oldUser: any, newUser: any): boolean;
    handle(oldUser: any, newUser: any): Promise<void>;
    sendStatusMessages(guild: any, oldUser: any, newUser: any): Promise<void>;
}
import BaseEvent = require("../BaseEvent");
//# sourceMappingURL=Skynet.UserUpdate.d.ts.map