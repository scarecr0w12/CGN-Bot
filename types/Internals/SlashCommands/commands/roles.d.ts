import { EmbedBuilder } from "discord.js";
import { ActionRowBuilder } from "discord.js";
export let adminLevel: number;
export let data: import("discord.js").SlashCommandSubcommandsOnlyBuilder;
export function execute(interaction: any, client: any, serverDocument: any): Promise<void>;
export function handlePanelCommands(interaction: any, client: any, serverDocument: any, subcommand: any): Promise<void>;
export function handleAutoCommands(interaction: any, client: any, serverDocument: any, subcommand: any): Promise<void>;
export function createPanel(interaction: any, _client: any, _serverDocument: any): Promise<void>;
export function addRoleToPanel(interaction: any, _client: any): Promise<void>;
export function removeRoleFromPanel(interaction: any, _client: any): Promise<void>;
export function listPanels(interaction: any, _client: any): Promise<any>;
export function deletePanel(interaction: any, _client: any): Promise<void>;
export function refreshPanel(interaction: any, _client: any): Promise<void>;
export function updatePanelMessage(guild: any, panel: any): Promise<void>;
export function buildPanelMessage(panel: any, guild: any): {
    embed: EmbedBuilder;
    components: ActionRowBuilder<import("discord.js").AnyComponentBuilder>[];
};
export function addAutorole(interaction: any, serverDocument: any): Promise<void>;
export function removeAutorole(interaction: any, serverDocument: any): Promise<void>;
export function listAutoroles(interaction: any, serverDocument: any): Promise<any>;
export function parseDuration(durationStr: any): number;
export function handleTempRole(interaction: any, client: any): Promise<void>;
export function handleTempList(interaction: any, client: any): Promise<any>;
export function handleTempRemove(interaction: any, _client: any): Promise<void>;
//# sourceMappingURL=roles.d.ts.map