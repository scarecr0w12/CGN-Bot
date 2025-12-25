export let data: import("discord.js").SlashCommandSubcommandsOnlyBuilder;
export function execute(interaction: any, client: any, serverDocument: any): Promise<void>;
export function createChannel(interaction: any, client: any, serverDocument: any): Promise<any>;
export function getOwnedChannel(interaction: any, serverDocument: any): {
    voiceChannel: any;
    roomData: any;
};
export function lockChannel(interaction: any, serverDocument: any, lock: any): Promise<any>;
export function inviteUser(interaction: any, serverDocument: any): Promise<any>;
export function kickUser(interaction: any, serverDocument: any): Promise<any>;
export function transferOwnership(interaction: any, serverDocument: any): Promise<any>;
export function renameChannel(interaction: any, serverDocument: any): Promise<void>;
export function setLimit(interaction: any, serverDocument: any): Promise<void>;
export function claimChannel(interaction: any, serverDocument: any): Promise<any>;
export function showStats(interaction: any, serverDocument: any): Promise<void>;
export function showLeaderboard(interaction: any, serverDocument: any): Promise<any>;
export function deleteChannel(interaction: any, serverDocument: any): Promise<void>;
//# sourceMappingURL=voice.d.ts.map