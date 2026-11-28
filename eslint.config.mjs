import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';
import mridangPlugin from '@mridang/eslint-defaults';

export default [
  includeIgnoreFile(fileURLToPath(new URL('.gitignore', import.meta.url))),
  ...mridangPlugin.configs.recommended,
  {
    // eslint-plugin-sonarjs 4.2.3 wrongly reports every file as an empty test file
    rules: { 'sonarjs/no-empty-test-file': 'off' },
  },
];
