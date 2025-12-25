/**
 * Role Reaction Extension
 * Gives users roles when they react to a specific message
 */

import { ExtensionBuilder } from '@cgn-bot/extension-sdk';

const extension = ExtensionBuilder
  .event('Role Reaction', 'messageReactionAdd')
  .description('Assigns roles based on message reactions')
  .version('1.0.0')
  .author('CGN-Bot Team')
  .addScope('manage_roles')
  .addScope('storage')
  .addField({
    name: 'messageId',
    label: 'Target Message ID',
    type: 'string',
    required: true,
    description: 'ID of the message to watch for reactions',
  })
  .addField({
    name: 'roleMapping',
    label: 'Emoji to Role Mapping',
    type: 'string',
    required: true,
    description: 'Format: emoji:roleName,emoji:roleName',
    default: '👍:Member,⭐:VIP',
  })
  .execute(async (context) => {
    const { event, guild, config } = context;
    const { messageId, roleMapping } = config;
    
    // Check if this is the watched message
    if (event.message.id !== messageId) {
      return { success: true }; // Ignore other messages
    }
    
    // Parse role mapping
    const mappings = new Map<string, string>();
    for (const pair of roleMapping.split(',')) {
      const [emoji, roleName] = pair.split(':').map((s: string) => s.trim());
      if (emoji && roleName) {
        mappings.set(emoji, roleName);
      }
    }
    
    // Get role name for this emoji
    const roleName = mappings.get(event.emoji.name);
    if (!roleName) {
      return { success: true }; // Not a mapped emoji
    }
    
    // Find role
    const role = guild.roles.cache.find((r: any) => r.name === roleName);
    if (!role) {
      return {
        success: false,
        error: new Error(`Role ${roleName} not found`),
      };
    }
    
    // Add role to user
    const member = await guild.members.fetch(event.user.id);
    await member.roles.add(role);
    
    return {
      success: true,
      data: { role: roleName, user: event.user.username },
    };
  })
  .build();

export default extension;
