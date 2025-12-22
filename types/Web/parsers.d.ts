export function serverData(req: any, serverDocument: any, webp?: boolean): Promise<{
    name: any;
    id: any;
    icon: any;
    owner: {
        username: any;
        id: any;
        avatar: any;
        name: any;
    };
    members: any;
    messages: any;
    rawCreated: string;
    relativeCreated: number;
    command_prefix: any;
    category: any;
    description: any;
    invite_link: any;
    slug: any;
    hasPublicPage: boolean;
}>;
export function userData(req: any, usr: any, userDocument: any): Promise<{
    username: any;
    discriminator: any;
    avatar: any;
    id: any;
    status: any;
    game: any;
    roundedAccountAge: string;
    rawAccountAge: string;
    backgroundImage: any;
    points: any;
    lastSeen: string;
    rawLastSeen: string;
    pastNameCount: any;
    isAfk: boolean;
    isMaintainer: any;
    isContributor: any;
    isSudoMaintainer: any;
    mutualServers: any[];
    mutualServerCount: any;
}>;
export function extensionData(req: any, galleryDocument: any, versionTag: any): Promise<{
    _id: any;
    name: any;
    slug: any;
    installUrl: string;
    version: any;
    type: any;
    typeIcon: string;
    typeDescription: any;
    typeInfo: {
        key: any;
        slash_description: any;
        slash_options: any;
        keywords: any;
        case_sensitive: any;
        interval: any;
        event: any;
    };
    description: any;
    featured: any;
    owner: {
        name: any;
        id: any;
        discriminator: any;
        avatar: any;
        isFeaturedCreator: boolean;
        creatorTier: string;
    };
    status: any;
    level: any;
    accepted: any;
    points: any;
    tags: any;
    relativeLastUpdated: string;
    rawLastUpdated: string;
    scopes: any;
    premium: {
        is_premium: boolean;
        price_points: any;
        purchases: any;
    };
    isPremium: boolean;
    hasPurchased: boolean;
    fields: any;
    timeout: any;
    network_capability: any;
    network_approved: any;
    network_approved_by: any;
    network_approved_at: string;
    dashboard_settings: any;
}>;
export function blogData(req: any, blogDocument: any): Promise<{
    id: any;
    title: any;
    author: {
        name: any;
        id: any;
        avatar: any;
    };
    category: any;
    categoryColor: string;
    rawPublished: string;
    roundedPublished: string;
    content: any;
}>;
export function commandOptions(req: any, command: any, data: any): void;
//# sourceMappingURL=parsers.d.ts.map