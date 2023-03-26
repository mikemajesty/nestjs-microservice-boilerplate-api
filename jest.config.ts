import { pathsToModuleNameMapper } from 'ts-jest';

import { compilerOptions } from './tsconfig.json';

export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src/core',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s?$': ['@swc/jest']
  },
  setupFilesAfterEnv: ['../../test/initializaion.ts'],
  testEnvironment: 'node',
  collectCoverageFrom: ['**/*.ts'],
  coverageDirectory: '../../coverage',
  coverageReporters: ['json-summary', 'lcov'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/../../' })
};
