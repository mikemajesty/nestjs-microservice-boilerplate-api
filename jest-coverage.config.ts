import { pathsToModuleNameMapper } from 'ts-jest';

const tsconfig = require('./tsconfig.json');
const { compilerOptions } = tsconfig;

export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src/core',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      '@swc/jest',
      {
        jsc: {
          target: 'es2021',
          parser: {
            syntax: 'typescript',
            decorators: true,
            dynamicImport: true
          },
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true
          }
        },
        sourceMaps: true
      }
    ]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@faker-js/faker|@mikemajesty/zod-mock-schema)/)'
  ],
  setupFilesAfterEnv: ['../../test/initialization.ts'],
  testEnvironment: 'node',
  coverageProvider: 'v8',
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  collectCoverageFrom: ['**/*.ts'],
  coverageDirectory: '../../coverage',
  coverageReporters: ['json-summary', 'lcov'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/../../' })
};
