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
    'src/services/identificationDocumentService.ts',
    'src/services/decaService.ts',
    'src/services/auditService.ts',
    'src/services/companyService.ts',
    'src/services/carrierService.ts',
    'src/services/authorizationService.ts',
    'src/services/treatmentManagerService.ts',
    'src/services/holdedService.ts',
    'src/services/wasteContractService.ts',
    'src/lib/validations/formValidation.ts',
    'src/lib/validations/publicForms.ts',
    'src/lib/rateLimit.ts',
    'src/app/api/holded/route.ts',
    'src/services/quickSearchService.ts',
    'src/lib/authErrors.ts',
    'src/services/chronologicalRegistryService.ts',
    'src/services/commercialOperationService.ts',
    'src/services/dashboardService.ts',
    'src/services/emailService.ts',
    'src/services/adminPlatformService.ts',
    'src/services/siraService.ts',
    'src/services/memoriaAnualService.ts',
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
    },
    './src/services/identificationDocumentService.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/decaService.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/auditService.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/companyService.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/carrierService.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/authorizationService.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/treatmentManagerService.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/holdedService.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/wasteContractService.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/lib/validations/formValidation.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/lib/validations/publicForms.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/lib/rateLimit.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/app/api/holded/route.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/quickSearchService.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/lib/authErrors.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/chronologicalRegistryService.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/commercialOperationService.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/dashboardService.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/emailService.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/adminPlatformService.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/siraService.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/memoriaAnualService.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
