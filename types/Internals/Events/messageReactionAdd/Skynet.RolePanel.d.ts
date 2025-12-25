export = RolePanelReaction;
/**
 * Handle reaction-based role panels
 */
declare class RolePanelReaction extends BaseEvent {
    handle(reaction: any, user: any): Promise<void>;
}
import BaseEvent = require("../BaseEvent.js");
//# sourceMappingURL=Skynet.RolePanel.d.ts.map