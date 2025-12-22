/**
 * Test runner for extension test suites
 * 
 * @module testing/TestRunner
 */

import { Extension } from '../types';
import { ExtensionTester, TestResult } from './ExtensionTester';

/**
 * Test suite
 */
export interface TestSuite {
  /** Suite name */
  name: string;
  
  /** Extensions to test */
  extensions: Extension[];
  
  /** Test setup function */
  setup?: () => Promise<void> | void;
  
  /** Test teardown function */
  teardown?: () => Promise<void> | void;
}

/**
 * Suite result
 */
export interface SuiteResult {
  /** Suite name */
  name: string;
  
  /** Test results */
  results: TestResult[];
  
  /** Total tests */
  total: number;
  
  /** Passed tests */
  passed: number;
  
  /** Failed tests */
  failed: number;
  
  /** Execution time */
  executionTime: number;
}

/**
 * Test runner for running multiple test suites
 */
export class TestRunner {
  private suites: TestSuite[] = [];

  /**
   * Add a test suite
   */
  addSuite(suite: TestSuite): this {
    this.suites.push(suite);
    return this;
  }

  /**
   * Run a single suite
   */
  async runSuite(suite: TestSuite): Promise<SuiteResult> {
    const startTime = Date.now();
    
    // Run setup
    if (suite.setup) {
      await suite.setup();
    }

    const allResults: TestResult[] = [];

    // Run tests for each extension
    for (const extension of suite.extensions) {
      const tester = new ExtensionTester(extension);
      const { results } = await tester.test();
      allResults.push(...results);
    }

    // Run teardown
    if (suite.teardown) {
      await suite.teardown();
    }

    const executionTime = Date.now() - startTime;
    const passed = allResults.filter(r => r.passed).length;
    const failed = allResults.filter(r => !r.passed).length;

    return {
      name: suite.name,
      results: allResults,
      total: allResults.length,
      passed,
      failed,
      executionTime,
    };
  }

  /**
   * Run all suites
   */
  async runAll(): Promise<SuiteResult[]> {
    const results: SuiteResult[] = [];

    for (const suite of this.suites) {
      const result = await this.runSuite(suite);
      results.push(result);
    }

    return results;
  }

  /**
   * Format results as a report
   */
  formatReport(results: SuiteResult[]): string {
    const lines: string[] = [];
    
    lines.push('Extension Test Report');
    lines.push('='.repeat(50));
    lines.push('');

    for (const suite of results) {
      lines.push(`Suite: ${suite.name}`);
      lines.push(`  Total: ${suite.total}`);
      lines.push(`  Passed: ${suite.passed}`);
      lines.push(`  Failed: ${suite.failed}`);
      lines.push(`  Time: ${suite.executionTime}ms`);
      lines.push('');

      if (suite.failed > 0) {
        lines.push('  Failed Tests:');
        const failed = suite.results.filter(r => !r.passed);
        for (const result of failed) {
          lines.push(`    - ${result.name}`);
          if (result.error) {
            lines.push(`      Error: ${result.error}`);
          }
        }
        lines.push('');
      }
    }

    const totalTests = results.reduce((sum, r) => sum + r.total, 0);
    const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);

    lines.push('='.repeat(50));
    lines.push(`Total: ${totalTests} | Passed: ${totalPassed} | Failed: ${totalFailed}`);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Run all tests and print report
   */
  async test(): Promise<boolean> {
    const results = await this.runAll();
    const report = this.formatReport(results);
    
    console.log(report);
    
    const allPassed = results.every(r => r.failed === 0);
    return allPassed;
  }
}
