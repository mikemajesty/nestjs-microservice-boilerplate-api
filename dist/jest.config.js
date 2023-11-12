"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_jest_1 = require("ts-jest");
const tsconfig_json_1 = require("./tsconfig.json");
exports.default = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: 'src/core',
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
    setupFilesAfterEnv: ['../../test/initializaion.ts'],
    testEnvironment: 'node',
    collectCoverageFrom: ['**/*.ts'],
    coverageDirectory: '../../coverage',
    coverageReporters: ['json-summary', 'lcov'],
    moduleNameMapper: (0, ts_jest_1.pathsToModuleNameMapper)(tsconfig_json_1.compilerOptions.paths, { prefix: '<rootDir>/../../' })
};
//# sourceMappingURL=jest.config.js.map