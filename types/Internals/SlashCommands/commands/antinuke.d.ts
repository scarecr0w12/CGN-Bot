export let adminLevel: number;
export let data: import("discord.js").SlashCommandSubcommandsOnlyBuilder;
export function execute(interaction: any, _client: any, serverDocument: any): Promise<any>;
export function getDefaultConfig(): {
    enabled: boolean;
    whitelist: any[];
    thresholds: {
        ban_limit: number;
        kick_limit: number;
        channel_delete_limit: number;
        role_delete_limit: number;
    };
    action: string;
    incidents: any[];
};
export function enable(interaction: any, serverDocument: any): Promise<void>;
export function disable(interaction: any, serverDocument: any): Promise<void>;
export function showStatus(interaction: any, serverDocument: any): Promise<void>;
export function addWhitelist(interaction: any, serverDocument: any): Promise<any>;
export function removeWhitelist(interaction: any, serverDocument: any): Promise<any>;
export function setThresholds(interaction: any, serverDocument: any): Promise<void>;
export function setAction(interaction: any, serverDocument: any): Promise<void>;
export function viewLogs(interaction: any, serverDocument: any): Promise<any>;
//# sourceMappingURL=antinuke.d.ts.map