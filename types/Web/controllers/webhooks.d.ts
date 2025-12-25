export function stripe(req: any, res: any): Promise<any>;
export function paypal(req: any, res: any): Promise<any>;
export function btcpay(req: any, res: any): Promise<any>;
export function patreon(req: any, res: any): Promise<any>;
/**
 * top.gg Vote Webhook
 * Receives vote notifications when users vote for the bot on top.gg
 */
export function topgg(req: any, res: any): Promise<any>;
/**
 * Discord Bot List Vote Webhook
 * Receives vote notifications when users vote for the bot on discordbotlist.com
 */
export function discordbotlist(req: any, res: any): Promise<any>;
/**
 * TopBotList Vote Webhook
 * Receives vote notifications when users vote for the bot on topbotlist.net
 * Webhook payload: { bot, user, type, isWeekend, query }
 */
export function topbotlist(req: any, res: any): Promise<any>;
//# sourceMappingURL=webhooks.d.ts.map