module.exports = {
  extends: ['@commitlint/config-conventional'],
  ignores: [(message) => message.includes('release')],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'ui-components',
        'ui-components/badge',
        'ui-components/button',
        'ui-components/tooltip',
        'core',
        'account',
        'plugins',
        'settings',
        'projects',
        'shared',
        'styles'
      ]
    ]
  }
};
