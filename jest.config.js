/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'es2020',
          module: 'commonjs',
          moduleResolution: 'node',
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowJs: true,
          skipLibCheck: true,
          paths: {
            '@/*': ['./src/*']
          }
        }
      }
    ]
  },
  testMatch: [
    '**/__tests__/**/*.test.(ts|tsx|js)',
    '**/?(*.)+(spec|test).(ts|tsx|js)'
  ],
  collectCoverageFrom: [
    'src/services/productionCenterService.ts',
    'src/lib/validations/sira.ts',
    'src/services/wasteTypeService.ts',
    '!src/**/*.d.ts',
  ],
  coverageReporters: ['text', 'lcov', 'clover'],
  coverageThreshold: {
    './src/services/productionCenterService.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/lib/validations/sira.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/wasteTypeService.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
