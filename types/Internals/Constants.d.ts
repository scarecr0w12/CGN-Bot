export const ModLogEntries: {
    ADD_ROLE: string;
    CREATE_ROLE: string;
    REMOVE_ROLE: string;
    DELETE_ROLE: string;
    MODIFY_ROLE: string;
    KICK: string;
    BAN: string;
    SOFTBAN: string;
    TEMP_BAN: string;
    UNBAN: string;
    MUTE: string;
    TEMP_MUTE: string;
    UNMUTE: string;
    BLOCK: string;
    STRIKE: string;
    OTHER: string;
};
export const LoggingLevels: {
    INFO: string;
    ERROR: string;
    WARN: string;
    SAVE: string;
};
export const Colors: object;
export const Text: {
    ERROR_TITLE: (() => string);
    ERROR_BODY: ((arg0: string, arg1: string) => string);
    ERROR_FOOTER: (() => string);
    OWO_ERROR_BODY: (() => string);
    INVALID_USAGE: ((arg0: object, arg1: string | undefined) => string);
    MISSING_PERMS: ((arg0: string) => string);
    NSFW_INVALID: (() => string);
    INVITE: ((arg0: GABClient) => {
        embeds: [{
            color: number;
            title: string;
            description: string;
        }];
    });
    GUILD_VERIFICATION_LEVEL: ((arg0: string) => string);
};
export const StatusMessages: object;
export const GUILD_VERIFICATION_LEVELS: string[];
export const WorkerTypes: {
    MATH: string;
    EMOJI: string;
};
export namespace WorkerCommands {
    namespace MATHJS {
        let EVAL: string;
        let HELP: string;
    }
}
export namespace WorkerEvents {
    let RUN_MATH: string;
    let JUMBO_EMOJI: string;
    let RUN_EXTENSION: string;
}
export const PageEmojis: {
    back: string;
    stop: string;
    forward: string;
};
export const NumberEmojis: {
    one: string;
    two: string;
    three: string;
    four: string;
    five: string;
    six: string;
    seven: string;
    eight: string;
    nine: string;
    ten: string;
};
export namespace HelpMenuEmojis {
    let info: string;
    let skynet: string;
    let fun: string;
    let mod: string;
    let media: string;
    let nsfw: string;
    let stats: string;
    let util: string;
    let extension: string;
}
export const CategoryEmojiMap: object;
export namespace Templates {
    namespace ReactionMenu {
        let title: string;
        let color: any;
        let description: string;
        let footer: string;
    }
    function StreamingTemplate(data: any): {
        embeds: {
            color: any;
            description: string;
            author: {
                name: any;
                iconURL: any;
                url: any;
            };
            image: {
                url: any;
            };
        }[];
    };
}
export const APIs: {
    ANIME: (() => any);
};
export const CENTRAL: string;
export const CODEBASE_TOTAL_CHUNK_SIZE: number;
export const UserAgent: string;
export const EmptySpace: string;
export const Perms: {
    eval: string;
    sudo: string;
    management: string;
    administration: string;
    shutdown: string;
};
export const AllowedEvents: string[];
export const NetworkCapabilities: object;
export const ExtensionTags: string[];
export const Scopes: object;
export const NSFWEmbed: {
    embeds: [{
        color: number;
        title: string;
        description: string;
        footer: {
            text: string;
        };
    }];
};
export const APIResponses: {
    servers: {
        success: Function;
        notFound: Function;
        internalError: Function;
    };
    users: {
        success: Function;
        badRequest: Function;
        notFound: Function;
        internalError: Function;
    };
    extensions: {
        success: Function;
        notFound: Function;
        internalError: Function;
    };
};
export const FortuneCategories: string[];
export const EightBall: {
    WaitTimes: number[];
    Answers: any[];
};
export const EmojiRegex: {
    Text: RegExp;
    SkinToneText: RegExp;
    UnicodeSkinTone: RegExp;
    MobileSkinTone: RegExp;
};
export const OfficialMode: string[];
//# sourceMappingURL=Constants.d.ts.map