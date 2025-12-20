import type { Config } from '@jest/types';
import { readFileSync } from 'fs';
import { pathsToModuleNameMapper } from 'ts-jest';

const tsconfig = JSON.parse(readFileSync('./tsconfig.json', 'utf-8'));
const { compilerOptions } = tsconfig;

const config: Config.InitialOptions = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '..',
  roots: ['src/core', 'src/modules'],
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
          }
        },
        sourceMaps: 'inline'
      }
    ]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@faker-js/faker|@mikemajesty/zod-mock-schema)/)'
  ],
  setupFilesAfterEnv: ['<rootDir>/test/initialization.ts'],
  testEnvironment: 'node',
  collectCoverageFrom: ['**/*.ts'],
  coverageDirectory: './coverage',
  coverageReporters: ['json-summary', 'lcov'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' })
};

export default config;
