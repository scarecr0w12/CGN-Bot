export = Track;
/**
 * Track - Represents a music track in the queue
 */
declare class Track {
    constructor(data: any);
    title: any;
    url: any;
    duration: any;
    thumbnail: any;
    requestedBy: any;
    source: any;
    get durationFormatted(): string;
    toEmbed(color: any): {
        color: any;
        title: any;
        url: any;
        thumbnail: {
            url: any;
        };
        fields: {
            name: string;
            value: string;
            inline: boolean;
        }[];
    };
}
//# sourceMappingURL=Track.d.ts.map