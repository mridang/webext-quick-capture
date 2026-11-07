const item =
  'publishers/674e492a-2721-474b-b790-20183608bb0b/items/jhjijkkakjbeialbdfidimakcckichhn';

// noinspection JSUnusedGlobalSymbols
export default {
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
    [
      '@semantic-release/github',
      {
        assets: ['dist/extension.zip'],
      },
    ],
    [
      '@semantic-release/exec',
      {
        publishCmd: [
          'set -eu',
          'api=https://chromewebstore.googleapis.com',
          `item=${item}`,
          'auth="Authorization: Bearer $CHROME_ACCESS_TOKEN"',
          'state=$(curl -sS --fail-with-body -X POST -H "$auth" -T dist/extension.zip "$api/upload/v2/$item:upload" | jq -r .uploadState)',
          'for n in $(seq 24); do [ "$state" = IN_PROGRESS ] || break; sleep 5; state=$(curl -sS --fail-with-body -H "$auth" "$api/v2/$item:fetchStatus" | jq -r .lastAsyncUploadState); done',
          '[ "$state" = SUCCEEDED ] || { echo "Web Store upload ended in state $state" >&2; exit 1; }',
          'curl -sS --fail-with-body -X POST -H "$auth" "$api/v2/$item:publish"',
        ].join('\n'),
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
