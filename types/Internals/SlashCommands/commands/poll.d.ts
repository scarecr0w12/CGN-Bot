export let adminLevel: number;
export let data: import("discord.js").SlashCommandSubcommandsOnlyBuilder;
export function execute(interaction: any, _client: any, serverDocument: any): Promise<void>;
export function createPoll(interaction: any, serverDocument: any): Promise<any>;
export function endPoll(interaction: any): Promise<any>;
export function showResults(interaction: any): Promise<any>;
export function calculateResults(message: any): Promise<{
    question: any;
    resultsList: string;
    totalVotes: number;
}>;
export function createBar(percentage: any): string;
export function autoEndPoll(guildId: any, channelId: any, messageId: any): Promise<void>;
export function createWeightedPoll(interaction: any, serverDocument: any): Promise<any>;
export function endWeightedPoll(guildId: any, channelId: any, messageId: any): Promise<void>;
export function createRankedPoll(interaction: any, serverDocument: any): Promise<any>;
export function endRankedPoll(guildId: any, channelId: any, messageId: any): Promise<void>;
//# sourceMappingURL=poll.d.ts.map