/**
 * Test command - run extension tests
 */

import chalk from 'chalk';

interface TestOptions {
  watch?: boolean;
}

export async function testExtension(file: string, options: TestOptions): Promise<void> {
  console.log(chalk.blue.bold('\n🧪 Running Extension Tests\n'));

  try {
    // Dynamic import the extension
    const extension = await import(file);
    const ext = extension.default || extension;

    if (!ext || !ext.metadata) {
      console.log(chalk.red('✗ Invalid extension format'));
      process.exit(1);
    }

    console.log(chalk.cyan(`Testing: ${ext.metadata.name}\n`));

    // Check if extension has tests
    if (extension.tests) {
      const { ExtensionTester } = await import('@cgn-bot/extension-sdk/testing');
      const tester = ExtensionTester.for(ext);
      
      if (Array.isArray(extension.tests)) {
        tester.addTests(extension.tests);
      }

      const { passed, failed, results } = await tester.test();

      // Display results
      for (const result of results) {
        if (result.passed) {
          console.log(chalk.green(`✓ ${result.name}`) + chalk.gray(` (${result.executionTime}ms)`));
        } else {
          console.log(chalk.red(`✗ ${result.name}`) + chalk.gray(` (${result.executionTime}ms)`));
          if (result.error) {
            console.log(chalk.red(`  ${result.error}`));
          }
        }
      }

      console.log();
      console.log(chalk.bold(`Results: ${passed}/${passed + failed} passed`));

      if (failed > 0) {
        process.exit(1);
      }
    } else {
      console.log(chalk.yellow('⚠ No tests found'));
      console.log(chalk.gray('  Export a `tests` array to add test cases\n'));
    }

    if (options.watch) {
      console.log(chalk.cyan('\n👀 Watching for changes...'));
      // Watch implementation would go here
    }
  } catch (error) {
    console.log(chalk.red('✗ Test failed'));
    console.error(error);
    process.exit(1);
  }
}
