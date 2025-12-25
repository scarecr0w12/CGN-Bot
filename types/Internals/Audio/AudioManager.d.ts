export = AudioManager;
declare class AudioManager {
    constructor(client: any);
    client: any;
    players: Map<any, any>;
    getPlayer(guildId: any): any;
    createPlayer(guildId: any): any;
    search(query: any, requestedBy: any): Promise<Track[]>;
    destroyPlayer(guildId: any): void;
}
import Track = require("./Track");
//# sourceMappingURL=AudioManager.d.ts.map