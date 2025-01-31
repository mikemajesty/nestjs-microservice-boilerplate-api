import { pathsToModuleNameMapper } from 'ts-jest';

import { compilerOptions } from './tsconfig.json';

export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  roots: ['src/core', 'src/modules'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      '@swc/jest',
      {
        jsc: {
          target: 'es2021'
        },
        sourceMaps: 'inline'
      }
    ]
  },
  setupFilesAfterEnv: ['./test/initialization.ts'],
  testEnvironment: 'node',
  collectCoverageFrom: ['**/*.ts'],
  coverageDirectory: './coverage',
  coverageReporters: ['json-summary', 'lcov'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' })
};
