import { readFileSync } from 'fs';
import { pathsToModuleNameMapper } from 'ts-jest';

const tsconfig = JSON.parse(readFileSync('./tsconfig.json', 'utf-8'));
const { compilerOptions } = tsconfig;

export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '../src/core',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@faker-js/faker|@mikemajesty/zod-mock-schema)/)'
  ],
  setupFilesAfterEnv: ['../../test/initialization.ts'],
  testEnvironment: 'node',
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
