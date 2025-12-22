export = ModernHelpMenu;
/**
 * Modern help menu using Discord's component system (select menus + buttons)
 * Replaces the legacy reaction-based HelpMenu
 */
declare class ModernHelpMenu {
    constructor(originalMsg: any, options?: {});
    originalMsg: any;
    msg: any;
    collector: any;
    defaultEmbed: any;
    categories: any;
    prefix: any;
    timeout: any;
    /**
     * Build the category select menu
     */
    buildSelectMenu(disabled?: boolean): StringSelectMenuBuilder;
    /**
     * Build the navigation buttons
     */
    buildButtons(disabled?: boolean): ActionRowBuilder<import("discord.js").AnyComponentBuilder>;
    /**
     * Build the embed for the home/main page
     */
    buildHomeEmbed(): {
        color: any;
        author: {
            name: string;
            iconURL: any;
        };
        description: string;
        fields: ({
            name: string;
            value: string;
            inline?: undefined;
        } | {
            name: string;
            value: string;
            inline: boolean;
        })[];
        footer: {
            text: string;
        };
    };
    /**
     * Build the embed for a specific category
     */
    buildCategoryEmbed(categoryKey: any): {
        color: any;
        author: {
            name: string;
            iconURL: any;
        };
        description: any;
        fields: any[];
        footer: {
            text: string;
        };
    };
    /**
     * Split a string into chunks
     */
    chunkString(str: any, size: any): string[];
    /**
     * Build the expired embed
     */
    buildExpiredEmbed(): {
        color: any;
        description: string;
    };
    /**
     * Initialize and display the help menu
     */
    init(): Promise<this>;
    /**
     * Handle component interactions
     */
    handleInteraction(interaction: any): Promise<void>;
    /**
     * Handle collector end
     */
    handleEnd(): Promise<void>;
}
import { StringSelectMenuBuilder } from "discord.js";
import { ActionRowBuilder } from "discord.js";
//# sourceMappingURL=ModernHelpMenu.d.ts.map