import js from '@eslint/js';
import pluginJest from 'eslint-plugin-jest';
import pluginPrettier from 'eslint-plugin-prettier';
import pluginSecurity from 'eslint-plugin-security';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import pluginYouDontNeedLodash from 'eslint-plugin-you-dont-need-lodash-underscore';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/.eslintrc.js',
      'src/infra/database/postgres/migrations',
      'src/infra/database/mongo/migrations',
      'src/utils/collection.ts',
      '**/test/*.ts',
      '**/commitlint.config.js',
      '**/ecosystem.config.js',
      '**/*.md'
    ]
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.ts', '**/*.js'],

    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'simple-import-sort': simpleImportSort,
      jest: pluginJest,
      security: pluginSecurity,
      prettier: pluginPrettier,
      'you-dont-need-lodash-underscore': pluginYouDontNeedLodash
    },

    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
        ...(pluginJest.environments?.globals?.globals || {})
      },
      parser: tseslint.parser,
      parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
        ecmaVersion: 2022
      }
    },

    rules: {
      'no-console': ['error', { allow: ['error'] }],
      'security/detect-unsafe-regex': 'error',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'security/detect-object-injection': 'off',
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'object-shorthand': 'error',
      'security/detect-non-literal-regexp': 'off',
      'security/detect-possible-timing-attacks': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-have-length': 'warn',
      'jest/valid-expect': 'error'
    }
  }
)
