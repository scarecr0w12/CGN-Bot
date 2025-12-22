export let adminLevel: number;
export let data: import("discord.js").SlashCommandSubcommandsOnlyBuilder;
export function execute(interaction: any, client: any, serverDocument: any): Promise<void>;
export function parseEmoji(emojiStr: any): {
    animated: boolean;
    name: any;
    id: any;
    url: string;
};
export function stealEmoji(interaction: any, _client: any): Promise<void>;
export function addEmoji(interaction: any, _client: any): Promise<void>;
export function renameEmoji(interaction: any, _client: any): Promise<void>;
export function deleteEmoji(interaction: any, _client: any): Promise<void>;
export function listEmojis(interaction: any): Promise<void>;
export function showStats(interaction: any, serverDocument: any): Promise<any>;
export function emojiInfo(interaction: any): Promise<void>;
export function exportPack(interaction: any): Promise<void>;
export function importPack(interaction: any): Promise<void>;
export function previewPack(interaction: any): Promise<void>;
//# sourceMappingURL=emoji.d.ts.map