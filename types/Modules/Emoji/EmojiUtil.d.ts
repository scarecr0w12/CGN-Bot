export = EmojiUtil;
declare class EmojiUtil {
    static getEmojiMetadata(emoji: any): Promise<{
        type: string;
        url: string;
        animated: boolean;
    }>;
    static getUnicode(entry: any, separator?: string): string;
    static stripOut(providedEmoji: any, skinToneText: any, unicodeSkinTone: any, mobileSkinTone: any, body: any): any;
    static fillArray(array: any, times: any): void;
}
//# sourceMappingURL=EmojiUtil.d.ts.map