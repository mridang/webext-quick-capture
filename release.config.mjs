// noinspection JSUnusedGlobalSymbols
export default {
  branches: ['master'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/exec',
      {
        prepareCmd: [
          'jq --arg v "${nextRelease.version}" \'.version = $v\' package.json > package.json.tmp',
          'mv package.json.tmp package.json',
          'jq --arg v "${nextRelease.version}" \'.version = $v\' manifest.json > manifest.json.tmp',
          'mv manifest.json.tmp manifest.json',
          'npm run build',
        ].join(' && '),
      },
    ],
    // [
    //   'semantic-release-chrome',
    //   {
    //     asset: 'dist/extension.zip',
    //     extensionId: '${CHROME_EXTENSION_ID}',
    //   },
    // ],
    [
      '@semantic-release/github',
      {
        assets: ['dist/extension.zip'],
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['package.json', 'manifest.json'],
        message:
          'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
  ],
  repositoryUrl: 'git+https://github.com/mridang/webext-save-selection.git',
};
