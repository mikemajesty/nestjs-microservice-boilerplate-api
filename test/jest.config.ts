import type { Config } from '@jest/types'
import { readFileSync } from 'fs'
import { pathsToModuleNameMapper } from 'ts-jest'

const tsconfig = JSON.parse(readFileSync('./tsconfig.json', 'utf-8'))
const { compilerOptions } = tsconfig

const config: Config.InitialOptions = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '..',
  roots: ['src/core', 'src/infra/cache/aside', 'src/modules'],
  testRegex: '.*\\.spec\\.ts$',
  transformIgnorePatterns: ['node_modules/(?!(@nestjs)|uuid|babel-jest|@faker-js/faker|@mikemajesty/zod-mock-schema/)'],
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
        sourceMaps: 'inline'
      }
    ]
  },
  setupFilesAfterEnv: ['<rootDir>/test/initialization.ts'],
  detectOpenHandles: true,
  forceExit: true,
  testEnvironment: 'node',
  collectCoverageFrom: ['**/*.ts'],
  coverageDirectory: './coverage',
  coverageReporters: ['json-summary', 'lcov'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' })
}

export default config
