export let ArgumentParser: {
    new (): import("./Parser");
    parseQuoteArgs(content: string, delim?: string): string[];
};
export let DurationParser: (string: any) => Promise<{
    time: number;
    event: any;
    error?: undefined;
} | {
    time: any;
    event: any;
    error: string;
}>;
export let PaginatedEmbed: typeof import("./PaginatedEmbed");
export let ReminderParser: (client: any, userDocument: any, userQueryDocument: any, str: any) => Promise<number | "ERR">;
//# sourceMappingURL=index.d.ts.map