export let adminLevel: number;
export let data: import("discord.js").SlashCommandSubcommandsOnlyBuilder;
export function execute(interaction: any, _client: any, serverDocument: any): Promise<void>;
export function getDefaultConfig(): {
    auto_mode: string;
    auto_threshold: number;
    rotate_enabled: boolean;
    rotate_max_pins: number;
    rotate_max_age_days: number;
    queue: any[];
};
export function handleQueue(interaction: any, serverDocument: any): Promise<any>;
export function nominate(interaction: any, serverDocument: any): Promise<any>;
export function configureAuto(interaction: any, serverDocument: any): Promise<void>;
export function configureRotate(interaction: any, serverDocument: any): Promise<any>;
export function cleanupPins(interaction: any, serverDocument: any): Promise<any>;
export function showStatus(interaction: any, serverDocument: any): Promise<void>;
export function archivePins(interaction: any): Promise<any>;
//# sourceMappingURL=pins.d.ts.map