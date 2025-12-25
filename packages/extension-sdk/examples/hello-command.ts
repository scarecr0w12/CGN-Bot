/**
 * Hello Command Extension
 * Simple command extension that greets users
 * 
 * @example !hello
 */

import { ExtensionBuilder, MockContextBuilder, ExtensionTestCase } from '@cgn-bot/extension-sdk';

const extension = ExtensionBuilder
  .command('Hello Command', 'hello')
  .description('Greets the user with a friendly hello message')
  .version('1.0.0')
  .author('CGN-Bot Team', 'cgn-bot')
  .addScope('send_messages')
  .usageHelp('!hello')
  .extendedHelp('Use this command to get a friendly greeting from the bot!')
  .execute(async (context) => {
    const { msg } = context;
    
    await msg.channel.send(`Hello, ${msg.author.username}! 👋`);
    
    return { success: true };
  })
  .build();

// Test cases
export const tests: ExtensionTestCase[] = [
  {
    name: 'should greet user',
    context: MockContextBuilder
      .command('hello')
      .message({
        author: { username: 'testuser' },
        channel: {
          send: async (content: string) => {
            if (!content.includes('Hello') || !content.includes('testuser')) {
              throw new Error('Greeting message incorrect');
            }
          },
        },
      })
      .build(),
    expect: {
      success: true,
    },
  },
];

export default extension;
