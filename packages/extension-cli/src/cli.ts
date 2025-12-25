#!/usr/bin/env node

/**
 * CGN-Bot Extension CLI
 * CLI tool for creating and managing CGN-Bot extensions
 */

import { Command } from 'commander';
import { createExtension } from './commands/create';
import { validateExtension } from './commands/validate';
import { testExtension } from './commands/test';

const program = new Command();

program
  .name('cgn-ext')
  .description('CLI tool for creating CGN-Bot extensions')
  .version('1.0.0');

program
  .command('create')
  .description('Create a new extension from template')
  .option('-n, --name <name>', 'Extension name')
  .option('-t, --type <type>', 'Extension type (command, keyword, event)')
  .option('-o, --output <dir>', 'Output directory', '.')
  .action(createExtension);

program
  .command('validate <file>')
  .description('Validate an extension file')
  .action(validateExtension);

program
  .command('test <file>')
  .description('Run tests for an extension')
  .option('-w, --watch', 'Watch mode')
  .action(testExtension);

program.parse();
