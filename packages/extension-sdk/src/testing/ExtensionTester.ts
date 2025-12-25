/**
 * Extension testing utilities
 * 
 * @module testing/ExtensionTester
 */

import { Extension, ExtensionContext, ExtensionResult } from '../types';
import { MockContextBuilder } from './MockContext';

/**
 * Test case for an extension
 */
export interface ExtensionTestCase {
  /** Test case name */
  name: string;
  
  /** Mock context for this test */
  context: ExtensionContext;
  
  /** Expected result */
  expect?: {
    success?: boolean;
    error?: string | RegExp;
    data?: any;
  };
  
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Test result
 */
export interface TestResult {
  /** Test case name */
  name: string;
  
  /** Whether test passed */
  passed: boolean;
  
  /** Actual result from extension */
  result?: ExtensionResult;
  
  /** Error if test failed */
  error?: string;
  
  /** Execution time in milliseconds */
  executionTime: number;
}

/**
 * Extension tester class
 */
export class ExtensionTester {
  private extension: Extension;
  private testCases: ExtensionTestCase[] = [];

  constructor(extension: Extension) {
    this.extension = extension;
  }

  /**
   * Add a test case
   */
  addTest(testCase: ExtensionTestCase): this {
    this.testCases.push(testCase);
    return this;
  }

  /**
   * Add multiple test cases
   */
  addTests(testCases: ExtensionTestCase[]): this {
    this.testCases.push(...testCases);
    return this;
  }

  /**
   * Run a single test case
   */
  async runTest(testCase: ExtensionTestCase): Promise<TestResult> {
    const startTime = Date.now();
    const result: TestResult = {
      name: testCase.name,
      passed: false,
      executionTime: 0,
    };

    try {
      // Execute extension with timeout
      const timeout = testCase.timeout || 5000;
      const executePromise = this.extension.execute(testCase.context);
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Test timeout after ${timeout}ms`)), timeout);
      });

      const executionResult = await Promise.race([executePromise, timeoutPromise]) as ExtensionResult | void;
      
      result.result = executionResult as ExtensionResult;
      result.executionTime = Date.now() - startTime;

      // Check expectations
      if (testCase.expect) {
        const { success, error, data } = testCase.expect;

        // Check success expectation
        if (success !== undefined) {
          if (result.result?.success !== success) {
            result.error = `Expected success=${success}, got ${result.result?.success}`;
            return result;
          }
        }

        // Check error expectation
        if (error !== undefined && result.result?.error) {
          const errorMessage = result.result.error.message || String(result.result.error);
          
          if (typeof error === 'string') {
            if (!errorMessage.includes(error)) {
              result.error = `Expected error to contain "${error}", got "${errorMessage}"`;
              return result;
            }
          } else if (error instanceof RegExp) {
            if (!error.test(errorMessage)) {
              result.error = `Expected error to match ${error}, got "${errorMessage}"`;
              return result;
            }
          }
        }

        // Check data expectation
        if (data !== undefined) {
          const actualData = result.result?.data;
          if (JSON.stringify(actualData) !== JSON.stringify(data)) {
            result.error = `Expected data ${JSON.stringify(data)}, got ${JSON.stringify(actualData)}`;
            return result;
          }
        }
      }

      result.passed = true;
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      result.executionTime = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Run all test cases
   */
  async runAll(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const testCase of this.testCases) {
      const result = await this.runTest(testCase);
      results.push(result);
    }

    return results;
  }

  /**
   * Run tests and get summary
   */
  async test(): Promise<{
    passed: number;
    failed: number;
    total: number;
    results: TestResult[];
  }> {
    const results = await this.runAll();
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    return {
      passed,
      failed,
      total: results.length,
      results,
    };
  }

  /**
   * Create a tester for an extension
   */
  static for(extension: Extension): ExtensionTester {
    return new ExtensionTester(extension);
  }
}

/**
 * Quick test helper function
 */
export async function testExtension(
  extension: Extension,
  context: ExtensionContext
): Promise<ExtensionResult | void> {
  return await extension.execute(context);
}
