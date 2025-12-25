export let adminLevel: number;
export let data: import("discord.js").SlashCommandSubcommandsOnlyBuilder;
export function execute(interaction: any, _client: any, serverDocument: any): Promise<void>;
export function showLeaderboard(interaction: any): Promise<any>;
export function showInfo(interaction: any): Promise<void>;
export function findInviter(serverId: any, userId: any): Promise<any>;
export function showWhoInvited(interaction: any): Promise<any>;
export function createInvite(interaction: any): Promise<void>;
export function listInvites(interaction: any): Promise<any>;
export function deleteInvite(interaction: any): Promise<any>;
export function syncInvites(interaction: any): Promise<any>;
export function addReward(interaction: any, serverDocument: any): Promise<any>;
export function removeReward(interaction: any, serverDocument: any): Promise<any>;
export function listRewards(interaction: any, serverDocument: any): Promise<any>;
export function checkRewards(interaction: any, serverDocument: any): Promise<any>;
//# sourceMappingURL=invites.d.ts.map