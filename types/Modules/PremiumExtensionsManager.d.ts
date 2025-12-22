export function getMarketplaceSettings(): Promise<any>;
export function setPremiumStatus(extensionId: any, ownerId: any, pricePoints: any, isPremium: any): Promise<{
    success: boolean;
}>;
export function purchaseExtension(buyerUserId: any, extensionId: any): Promise<any>;
export function getExtensionEarnings(userId: any): Promise<any>;
export function withdrawEarnings(userId: any, amount: any): Promise<{
    success: boolean;
    withdrawn: number;
    extensionEarningsBalance: number;
    voteRewardsBalance: any;
}>;
export function getUserExtensions(userId: any): Promise<any>;
export function getExtensionSales(ownerId: any, extensionId: any, limit?: number): Promise<{
    extensionId: any;
    extensionName: any;
    purchases: any;
    revenueShare: any;
    pricePoints: any;
    history: any;
}>;
export function getExtensionSalesAdmin(extensionId: any, limit?: number): Promise<{
    extensionId: any;
    extensionName: any;
    ownerId: any;
    isPremium: boolean;
    approved: boolean;
    purchases: any;
    revenueShare: any;
    pricePoints: any;
    lifetimeRevenue: any;
    history: any;
}>;
export function getMarketplaceStats({ topLimit }?: {
    topLimit?: number;
}): Promise<{
    totalPurchases: number;
    totalCreatorRevenue: number;
    topExtensionsByPurchases: any;
    topExtensionsByRevenue: any;
    topCreatorsByRevenue: any[];
}>;
export function canServerInstallExtension(serverId: any, extensionId: any, installerUserId: any): Promise<{
    allowed: boolean;
    reason: string;
} | {
    allowed: boolean;
    reason?: undefined;
}>;
//# sourceMappingURL=PremiumExtensionsManager.d.ts.map