const config = {
  branches: ['teste'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    [
      '@semantic-release/git',
      {
        assets: ['dist/**/*.{js,css}', 'docs', 'package.json'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
      }
    ],
    '@semantic-release/github',
    '@semantic-release/npm'
    // ["semantic-release-ado", {
    //   "varName": "version",
    //   "setOnlyOnRelease": true,
    //   "isOutput": true
    // }],
  ]
};

module.exports = config;
