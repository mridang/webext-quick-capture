/**
 * @file Jest global teardown that runs once after the test suite finishes.
 */

/**
 * Cleans up after the test suite. There are no external services to stop.
 * @returns A promise that resolves once teardown has finished.
 * @example
 * ```ts
 * // Jest calls this once after the last test file when globalTeardown points here.
 * await teardown();
 * ```
 */
export default async function teardown(): Promise<void> {
  // No external services to tear down.
}
