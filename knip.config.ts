/**
 * @file Knip configuration that lists the entry points and ignored dependencies for unused-code checks.
 */
export default {
  entry: ['src/offscreen.js'],
  ignore: ['knip.config.ts'],
  ignoreDependencies: [/^@semantic-release\//],
};
