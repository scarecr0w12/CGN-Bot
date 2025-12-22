/**
 * Create command - scaffold new extensions
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';

interface CreateOptions {
  name?: string;
  type?: string;
  output?: string;
}

export async function createExtension(options: CreateOptions): Promise<void> {
  console.log(chalk.blue.bold('\n🚀 CGN-Bot Extension Creator\n'));

  // Prompt for missing options
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Extension name:',
      when: !options.name,
      validate: (input: string) => input.length > 0 || 'Name is required',
    },
    {
      type: 'list',
      name: 'type',
      message: 'Extension type:',
      when: !options.type,
      choices: [
        { name: 'Command - Triggered by a command key (!hello)', value: 'command' },
        { name: 'Keyword - Triggered by message keywords', value: 'keyword' },
        { name: 'Event - Triggered by Discord events', value: 'event' },
      ],
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description:',
      default: 'My extension',
    },
    {
      type: 'input',
      name: 'author',
      message: 'Author name:',
      default: 'Anonymous',
    },
  ]);

  const config = {
    name: options.name || answers.name,
    type: options.type || answers.type,
    description: answers.description,
    author: answers.author,
    output: options.output || '.',
  };

  // Type-specific questions
  if (config.type === 'command') {
    const cmdAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'key',
        message: 'Command key:',
        default: config.name.toLowerCase().replace(/\s+/g, '-'),
      },
      {
        type: 'input',
        name: 'usageHelp',
        message: 'Usage help:',
        default: (ans: any) => `!${ans.key}`,
      },
    ]);
    Object.assign(config, cmdAnswers);
  } else if (config.type === 'keyword') {
    const kwAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'keywords',
        message: 'Keywords (comma-separated):',
        filter: (input: string) => input.split(',').map(k => k.trim()),
      },
      {
        type: 'confirm',
        name: 'caseSensitive',
        message: 'Case-sensitive matching?',
        default: false,
      },
    ]);
    Object.assign(config, kwAnswers);
  } else if (config.type === 'event') {
    const eventAnswers = await inquirer.prompt([
      {
        type: 'list',
        name: 'event',
        message: 'Discord event:',
        choices: [
          'guildMemberAdd',
          'guildMemberRemove',
          'messageDelete',
          'messageUpdate',
          'roleCreate',
          'roleUpdate',
          'channelCreate',
          'voiceStateUpdate',
        ],
      },
    ]);
    Object.assign(config, eventAnswers);
  }

  // Scopes
  const scopeAnswers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'scopes',
      message: 'Select required scopes:',
      choices: [
        { name: 'Send Messages', value: 'send_messages', checked: true },
        { name: 'Delete Messages', value: 'delete_messages' },
        { name: 'Manage Roles', value: 'manage_roles' },
        { name: 'Manage Channels', value: 'manage_channels' },
        { name: 'Ban Members', value: 'ban' },
        { name: 'Kick Members', value: 'kick' },
        { name: 'Storage', value: 'storage' },
        { name: 'Network (Allowlist)', value: 'network_allowlist_only' },
      ],
    },
  ]);
  Object.assign(config, scopeAnswers);

  // Generate extension
  const spinner = ora('Creating extension...').start();

  try {
    const template = generateTemplate(config);
    const filename = sanitizeName(config.name);
    const outputPath = path.join(config.output, `${filename}.ts`);

    await fs.writeFile(outputPath, template, 'utf-8');

    spinner.succeed(chalk.green('Extension created successfully!'));
    console.log(chalk.cyan(`\nFile: ${outputPath}`));
    console.log(chalk.yellow('\nNext steps:'));
    console.log('  1. Edit the extension code');
    console.log('  2. Test: cgn-ext test ' + path.basename(outputPath));
    console.log('  3. Build: npm run build');
    console.log('  4. Upload to CGN-Bot dashboard\n');
  } catch (error) {
    spinner.fail(chalk.red('Failed to create extension'));
    console.error(error);
    process.exit(1);
  }
}

function generateTemplate(config: any): string {
  const { type, name, description, author, scopes } = config;

  let template = `import { ExtensionBuilder } from '@cgn-bot/extension-sdk';

/**
 * ${name}
 * ${description}
 * 
 * @author ${author}
 */

`;

  // Type-specific builder
  if (type === 'command') {
    template += `const extension = ExtensionBuilder
  .command('${name}', '${config.key}')
  .description('${description}')
  .version('1.0.0')
  .author('${author}')
  .usageHelp('${config.usageHelp || `!${config.key}`}')
`;
  } else if (type === 'keyword') {
    const keywords = JSON.stringify(config.keywords || ['keyword']);
    template += `const extension = ExtensionBuilder
  .keyword('${name}', ${keywords})
  .description('${description}')
  .version('1.0.0')
  .author('${author}')
  .caseSensitive(${config.caseSensitive || false})
`;
  } else if (type === 'event') {
    template += `const extension = ExtensionBuilder
  .event('${name}', '${config.event || 'guildMemberAdd'}')
  .description('${description}')
  .version('1.0.0')
  .author('${author}')
`;
  }

  // Add scopes
  for (const scope of scopes) {
    template += `  .addScope('${scope}')\n`;
  }

  // Execute function
  template += `  .execute(async (context) => {
    // Your extension code here
    
`;

  if (type === 'command' || type === 'keyword') {
    template += `    // Access the message
    const { msg, guild } = context;
    
    // Send a reply
    await msg.channel.send('Hello from ${name}!');
`;
  } else if (type === 'event') {
    template += `    // Access event data
    const { event, guild } = context;
    
    // Handle the event
    console.log('Event triggered:', event);
`;
  }

  template += `    
    return { success: true };
  })
  .build();

export default extension;

// For testing
if (require.main === module) {
  console.log(extension.toCode());
}
`;

  return template;
}

function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
