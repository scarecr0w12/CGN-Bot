/**
 * Welcome Bot Extension
 * Welcomes new members to the server
 * Uses storage to track total welcomes
 */

import { ExtensionBuilder } from '@cgn-bot/extension-sdk';

const extension = ExtensionBuilder
  .event('Welcome Bot', 'guildMemberAdd')
  .description('Sends a welcome message when new members join')
  .version('1.0.0')
  .author('CGN-Bot Team')
  .addScope('send_messages')
  .addScope('storage')
  .addField({
    name: 'welcomeChannel',
    label: 'Welcome Channel',
    type: 'string',
    required: true,
    description: 'Name of the channel for welcome messages',
    default: 'welcome',
  })
  .addField({
    name: 'welcomeMessage',
    label: 'Welcome Message Template',
    type: 'string',
    required: false,
    description: 'Use {user} for username, {server} for server name',
    default: 'Welcome to {server}, {user}! 🎉',
  })
  .execute(async (context) => {
    const { event, guild, storage, config } = context;
    const member = event.member;
    
    // Find welcome channel
    const channelName = config.welcomeChannel || 'welcome';
    const channel = guild.channels.cache.find((ch: any) => 
      ch.name === channelName && ch.isText()
    );
    
    if (!channel) {
      return {
        success: false,
        error: new Error(`Channel ${channelName} not found`),
      };
    }
    
    // Get welcome count
    const count = (storage.get('welcomeCount') || 0) + 1;
    await storage.write('welcomeCount', count);
    
    // Format message
    const template = config.welcomeMessage || 'Welcome to {server}, {user}! 🎉';
    const message = template
      .replace('{user}', member.user.username)
      .replace('{server}', guild.name)
      .replace('{count}', count.toString());
    
    await channel.send(message);
    
    return { 
      success: true,
      data: { count },
    };
  })
  .build();

export default extension;
