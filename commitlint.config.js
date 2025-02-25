const { readdirSync } = require('fs');

const getDirectories = (source) =>
  readdirSync(source, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

const scopes = [];
for (const path of getDirectories('./src').map((p) => `./src/${p}`)) {
  const files = readdirSync(path, { withFileTypes: true });
  scopes.push(...files.filter((item) => item.isDirectory()).map((item) => item.name));
}

scopes.push(
  'remove',
  'revert',
  'conflict',
  'config',
  'entity',
  'utils',
  'deps',
  'modules',
  'test',
  'migration',
  'core',
  'swagger'
);

module.exports = {
  extends: ['@commitlint/config-conventional'],
  ignores: [(message) => message.includes('release')],
  rules: {
    'scope-empty': [2, 'never'],
    'scope-enum': [2, 'always', scopes]
  }
};
