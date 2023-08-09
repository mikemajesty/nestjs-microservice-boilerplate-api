const config = {
  branches: ['teste'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md'
      }
    ],
    [
      '@semantic-release/git',
      {
        assets: ['dist/**/*.{js,css}', 'CHANGELOG.md', 'package.json'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
      }
    ],
    '@semantic-release/github',
    [
      '@semantic-release/npm',
      {
        pkgRoot: 'dist'
      }
    ]
    // ["semantic-release-ado", {
    //   "varName": "version",
    //   "setOnlyOnRelease": true,
    //   "isOutput": true
    // }],
  ]
};

module.exports = config;
