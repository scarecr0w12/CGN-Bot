export = RaidDetection;
/**
 * Raid and Alt Detection for member joins
 */
declare class RaidDetection extends BaseEvent {
    handle(member: any): Promise<void>;
    handleAltCheck(member: any, serverDocument: any, altcheck: any): Promise<void>;
    handleAntiraid(member: any, serverDocument: any, antiraid: any): Promise<void>;
    handleRaidJoin(member: any, serverDocument: any, antiraid: any): Promise<void>;
}
import BaseEvent = require("../BaseEvent.js");
//# sourceMappingURL=Skynet.RaidDetection.d.ts.map