export = GameUpdateAnnouncer;
/**
 * Main Game Update Announcer class
 */
declare class GameUpdateAnnouncer {
    /**
     * Get list of available games
     */
    static getAvailableGames(): {
        id: string;
        name: string;
        icon: string;
        color: number;
    }[];
    /**
     * Get game info by ID
     */
    static getGameInfo(gameId: any): any;
    constructor(client: any);
    client: any;
    checkInterval: NodeJS.Timeout;
    isRunning: boolean;
    /**
     * Initialize the announcer - start hourly checks
     */
    init(): Promise<void>;
    /**
     * Check all games for updates
     */
    checkAllGames(): Promise<void>;
    /**
     * Check a specific game for updates
     */
    checkGameUpdates(gameId: any, gameConfig: any): Promise<void>;
    /**
     * Announce an update to all subscribed channels
     */
    announceUpdate(gameId: any, gameConfig: any, updateInfo: any): Promise<void>;
    /**
     * Build the update announcement embed
     */
    buildUpdateEmbed(gameConfig: any, updateInfo: any): EmbedBuilder;
    /**
     * Manually trigger a check for a specific game (for testing)
     */
    forceCheck(gameId: any): Promise<any>;
    /**
     * Get current cached versions
     */
    getCachedVersions(): {};
    /**
     * Clean up on shutdown
     */
    destroy(): void;
}
declare namespace GameUpdateAnnouncer {
    export { GAMES };
}
import { EmbedBuilder } from "discord.js";
declare namespace GAMES {
    namespace minecraft_java {
        export let id: string;
        export let name: string;
        export let icon: string;
        export let color: number;
        export { fetchMinecraftJavaUpdates as fetchUpdates };
        export let changelogUrl: string;
    }
    namespace minecraft_bedrock {
        let id_1: string;
        export { id_1 as id };
        let name_1: string;
        export { name_1 as name };
        let icon_1: string;
        export { icon_1 as icon };
        let color_1: number;
        export { color_1 as color };
        export { fetchMinecraftBedrockUpdates as fetchUpdates };
        let changelogUrl_1: string;
        export { changelogUrl_1 as changelogUrl };
    }
    namespace rust {
        let id_2: string;
        export { id_2 as id };
        let name_2: string;
        export { name_2 as name };
        let icon_2: string;
        export { icon_2 as icon };
        let color_2: number;
        export { color_2 as color };
        export { fetchRustUpdates as fetchUpdates };
        let changelogUrl_2: string;
        export { changelogUrl_2 as changelogUrl };
        export let steamAppId: number;
    }
    namespace terraria {
        let id_3: string;
        export { id_3 as id };
        let name_3: string;
        export { name_3 as name };
        let icon_3: string;
        export { icon_3 as icon };
        let color_3: number;
        export { color_3 as color };
        export { fetchSteamUpdates as fetchUpdates };
        let steamAppId_1: number;
        export { steamAppId_1 as steamAppId };
        let changelogUrl_3: string;
        export { changelogUrl_3 as changelogUrl };
    }
    namespace valheim {
        let id_4: string;
        export { id_4 as id };
        let name_4: string;
        export { name_4 as name };
        let icon_4: string;
        export { icon_4 as icon };
        let color_4: number;
        export { color_4 as color };
        export { fetchSteamUpdates as fetchUpdates };
        let steamAppId_2: number;
        export { steamAppId_2 as steamAppId };
        let changelogUrl_4: string;
        export { changelogUrl_4 as changelogUrl };
    }
    namespace ark {
        let id_5: string;
        export { id_5 as id };
        let name_5: string;
        export { name_5 as name };
        let icon_5: string;
        export { icon_5 as icon };
        let color_5: number;
        export { color_5 as color };
        export { fetchSteamUpdates as fetchUpdates };
        let steamAppId_3: number;
        export { steamAppId_3 as steamAppId };
        let changelogUrl_5: string;
        export { changelogUrl_5 as changelogUrl };
    }
    namespace sevendaystodie {
        let id_6: string;
        export { id_6 as id };
        let name_6: string;
        export { name_6 as name };
        let icon_6: string;
        export { icon_6 as icon };
        let color_6: number;
        export { color_6 as color };
        export { fetchSteamUpdates as fetchUpdates };
        let steamAppId_4: number;
        export { steamAppId_4 as steamAppId };
        let changelogUrl_6: string;
        export { changelogUrl_6 as changelogUrl };
    }
    namespace cs2 {
        let id_7: string;
        export { id_7 as id };
        let name_7: string;
        export { name_7 as name };
        let icon_7: string;
        export { icon_7 as icon };
        let color_7: number;
        export { color_7 as color };
        export { fetchSteamUpdates as fetchUpdates };
        let steamAppId_5: number;
        export { steamAppId_5 as steamAppId };
        let changelogUrl_7: string;
        export { changelogUrl_7 as changelogUrl };
    }
    namespace palworld {
        let id_8: string;
        export { id_8 as id };
        let name_8: string;
        export { name_8 as name };
        let icon_8: string;
        export { icon_8 as icon };
        let color_8: number;
        export { color_8 as color };
        export { fetchSteamUpdates as fetchUpdates };
        let steamAppId_6: number;
        export { steamAppId_6 as steamAppId };
        let changelogUrl_8: string;
        export { changelogUrl_8 as changelogUrl };
    }
}
/**
 * Fetch Minecraft Java Edition updates from Mojang's version manifest
 */
declare function fetchMinecraftJavaUpdates(): Promise<{
    version: any;
    releaseDate: Date;
    type: string;
    snapshot: any;
    description: string;
    changelogUrl: string;
    details: any;
}>;
/**
 * Fetch Minecraft Bedrock Edition updates
 * Uses the Xbox/Microsoft API for Bedrock version info
 */
declare function fetchMinecraftBedrockUpdates(): Promise<{
    version: string;
    releaseDate: Date;
    type: string;
    description: string;
    changelogUrl: string;
}>;
/**
 * Fetch Rust updates from Facepunch's changelog
 */
declare function fetchRustUpdates(): Promise<{
    version: any;
    title: any;
    releaseDate: Date;
    type: string;
    description: any;
    changelogUrl: any;
}>;
/**
 * Generic Steam game update fetcher
 * Uses Steam's news API to get latest updates
 */
declare function fetchSteamUpdates(gameConfig: any): Promise<{
    version: any;
    title: any;
    releaseDate: Date;
    type: string;
    description: any;
    changelogUrl: any;
    postId: any;
}>;
//# sourceMappingURL=GameUpdateAnnouncer.d.ts.map