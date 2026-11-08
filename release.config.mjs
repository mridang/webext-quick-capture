// noinspection JSUnusedGlobalSymbols
export default {
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/exec',
      {
        prepareCmd: 'npm run build',
      },
    ],
    [
      '@mridang/semantic-release-crx',
      {
        publisherId: '674e492a-2721-474b-b790-20183608bb0b',
        extensionId: 'jhjijkkakjbeialbdfidimakcckichhn',
        asset: 'dist/extension.zip',
        additionalManifests: ['manifest.json', 'package.json'],
      },
    ],
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
  repositoryUrl: 'git+https://github.com/mridang/webext-quick-capture.git',
};
