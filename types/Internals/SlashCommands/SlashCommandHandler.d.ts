export = SlashCommandHandler;
declare class SlashCommandHandler {
    constructor(client: any);
    client: any;
    commands: Collection<any, any>;
    commandsDir: string;
    _getRest(): REST;
    _getClientId(): any;
    _mapSlashOptionType(type: any): ApplicationCommandOptionType.String | ApplicationCommandOptionType.Integer | ApplicationCommandOptionType.Boolean | ApplicationCommandOptionType.User | ApplicationCommandOptionType.Channel | ApplicationCommandOptionType.Role | ApplicationCommandOptionType.Mentionable | ApplicationCommandOptionType.Number | ApplicationCommandOptionType.Attachment;
    _buildSlashOptions(rawOptions: any): {
        type: ApplicationCommandOptionType;
        name: string;
        description: string;
        required: boolean;
    }[];
    _isValidCommandName(name: any): boolean;
    syncExtensionGuildCommands(guildId: any): Promise<void>;
    /**
     * Load all slash command definitions
     */
    loadCommands(): Promise<void>;
    /**
     * Register slash commands with Discord API
     * @param {string} token - Bot token
     * @param {string} clientId - Bot client ID
     * @param {string} [guildId] - Optional guild ID for guild-specific commands
     */
    registerCommands(token: string, clientId: string, guildId?: string): Promise<void>;
    /**
     * Handle an incoming slash command interaction
     * @param {Interaction} interaction
     */
    handleInteraction(interaction: Interaction): Promise<any>;
    /**
     * Handle button interactions (for ticket system and other components)
     * @param {ButtonInteraction} interaction
     */
    handleButtonInteraction(interaction: ButtonInteraction): Promise<void>;
    /**
     * Handle verification button interaction
     * @param {ButtonInteraction} interaction
     */
    handleVerifyButton(interaction: ButtonInteraction): Promise<any>;
    /**
     * Handle select menu interactions
     * @param {StringSelectMenuInteraction} interaction
     */
    handleSelectMenuInteraction(interaction: StringSelectMenuInteraction): Promise<void>;
    /**
     * Handle role panel button interactions
     * @param {ButtonInteraction} interaction
     */
    handleRolePanelButton(interaction: ButtonInteraction): Promise<any>;
    /**
     * Handle role panel dropdown interactions
     * @param {StringSelectMenuInteraction} interaction
     */
    handleRolePanelSelect(interaction: StringSelectMenuInteraction): Promise<any>;
    /**
     * Handle ticket-related button interactions
     * @param {ButtonInteraction} interaction
     */
    handleTicketButton(interaction: ButtonInteraction): Promise<any>;
    /**
     * Handle rules acceptance button
     * @param {ButtonInteraction} interaction
     */
    handleRulesAccept(interaction: ButtonInteraction): Promise<any>;
    /**
     * Handle onboarding role selection
     * @param {StringSelectMenuInteraction} interaction
     */
    handleOnboardRoles(interaction: StringSelectMenuInteraction): Promise<any>;
}
import { Collection } from "discord.js";
import { REST } from "@discordjs/rest";
import { ApplicationCommandOptionType } from "discord-api-types/payloads/v10/_interactions/_applicationCommands/_chatInput/shared";
//# sourceMappingURL=SlashCommandHandler.d.ts.map