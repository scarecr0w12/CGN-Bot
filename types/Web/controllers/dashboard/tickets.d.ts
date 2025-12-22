/**
 * Ticket settings page
 */
export function settings(req: any, { res }: {
    res: any;
}): Promise<any>;
/**
 * Update ticket settings
 */
export function update(req: any, res: any): Promise<any>;
/**
 * Add a ticket category
 */
export function addCategory(req: any, res: any): Promise<any>;
/**
 * Delete a ticket category
 */
export function deleteCategory(req: any, res: any): Promise<any>;
/**
 * List server tickets
 */
export function list(req: any, { res }: {
    res: any;
}): Promise<any>;
/**
 * View a specific ticket
 */
export function view(req: any, { res }: {
    res: any;
}): Promise<any>;
/**
 * Update ticket status/priority
 */
export function updateTicket(req: any, res: any): Promise<any>;
//# sourceMappingURL=tickets.d.ts.map