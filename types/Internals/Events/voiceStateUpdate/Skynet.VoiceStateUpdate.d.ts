export = VoiceStateUpdate;
declare class VoiceStateUpdate extends BaseEvent {
    handle(oldState: any, state: any): Promise<void>;
    joinedChannel(serverDocument: any, channel: any, state: any): Promise<void>;
    leftChannel(serverDocument: any, channel: any, state: any): Promise<void>;
}
import BaseEvent = require("../BaseEvent.js");
//# sourceMappingURL=Skynet.VoiceStateUpdate.d.ts.map