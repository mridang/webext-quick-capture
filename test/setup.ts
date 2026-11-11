/**
 * @file Jest global setup that runs once before the test suite starts.
 */

/**
 * Prepares the environment for the test suite. No external services are required.
 * @returns A promise that resolves once setup has finished.
 * @example
 * ```ts
 * // Jest calls this once before the first test file when globalSetup points here.
 * await setup();
 * ```
 */
export default async function setup(): Promise<void> {
  // No external services are required for the test suite.
}
