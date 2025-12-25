/**
 * Validate command - check extension for errors
 */

import * as fs from 'fs/promises';
import chalk from 'chalk';
import { validateMetadata } from '@cgn-bot/extension-sdk/utils';

export async function validateExtension(file: string): Promise<void> {
  console.log(chalk.blue.bold('\n🔍 Validating Extension\n'));

  try {
    const code = await fs.readFile(file, 'utf-8');
    
    // Dynamic import the extension
    const extension = await import(file);
    const ext = extension.default || extension;

    if (!ext || !ext.metadata) {
      console.log(chalk.red('✗ Invalid extension format'));
      console.log(chalk.yellow('  Extension must export metadata and execute function'));
      process.exit(1);
    }

    // Validate metadata
    const { valid, errors } = validateMetadata(ext.metadata);

    if (valid) {
      console.log(chalk.green('✓ Extension is valid\n'));
      
      // Display metadata
      console.log(chalk.bold('Metadata:'));
      console.log(`  Name: ${ext.metadata.name}`);
      console.log(`  Type: ${ext.metadata.type}`);
      console.log(`  Version: ${ext.metadata.version}`);
      console.log(`  Author: ${ext.metadata.author.name}`);
      console.log(`  Scopes: ${ext.metadata.scopes.join(', ')}`);
      
      if (ext.metadata.key) {
        console.log(`  Key: ${ext.metadata.key}`);
      }
      if (ext.metadata.keywords) {
        console.log(`  Keywords: ${ext.metadata.keywords.join(', ')}`);
      }
      if (ext.metadata.event) {
        console.log(`  Event: ${ext.metadata.event}`);
      }
      
      console.log();
    } else {
      console.log(chalk.red('✗ Validation failed\n'));
      console.log(chalk.yellow('Errors:'));
      for (const error of errors) {
        console.log(chalk.red(`  - ${error}`));
      }
      console.log();
      process.exit(1);
    }
  } catch (error) {
    console.log(chalk.red('✗ Failed to validate extension'));
    console.error(error);
    process.exit(1);
  }
}
