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
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  collectCoverageFrom: [
    'src/services/productionCenterService.ts',
    'src/lib/validations/sira.ts',
    'src/services/wasteTypeService.ts',
    'src/services/identificationDocumentService.ts',
    'src/services/decaService.ts',
    'src/services/auditService.ts',
    'src/services/companyService.ts',
    'src/services/carrierService.ts',
    'src/services/fleetService.ts',
    'src/lib/validations/fleetValidation.ts',
    'src/lib/decaShare.ts',
    'src/services/authorizationService.ts',
    'src/services/treatmentManagerService.ts',
    'src/services/holdedService.ts',
    'src/services/wasteContractService.ts',
    'src/lib/validations/formValidation.ts',
    'src/lib/validations/spainLocations.ts',
    'src/lib/validations/publicForms.ts',
    'src/lib/validations/discrepancyJustification.ts',
    'src/lib/rateLimit.ts',
    'src/app/api/holded/route.ts',
    'src/app/api/deca/[token]/route.ts',
    'src/app/api/residuos/sira/enviar-di/route.ts',
    'src/app/api/contact/route.ts',
    'src/app/api/support/ticket/route.ts',
    'src/app/api/deca/[token]/driver-action/route.ts',
    'src/lib/auth/driverSession.ts',
    'src/lib/auth/premiumAccess.ts',
    'src/lib/auth/premiumGate.ts',
    'src/services/calendarService.ts',
    'src/services/pushNotificationService.ts',
    'src/app/api/mobile/conductor/login/route.ts',
    'src/app/api/mobile/conductor/decas/route.ts',
    'src/app/api/push/subscribe/route.ts',
    'src/app/api/push/notify-deca/route.ts',
    'src/app/auth/callback/route.ts',
    'src/lib/supabase/middleware.ts',
    'src/services/quickSearchService.ts',
    'src/lib/authErrors.ts',
    'src/services/chronologicalRegistryService.ts',
    'src/services/commercialOperationService.ts',
    'src/services/dashboardService.ts',
    'src/services/emailService.ts',
    'src/services/adminPlatformService.ts',
    'src/services/delegationService.ts',
    'src/services/siraService.ts',
    'src/services/memoriaAnualService.ts',
    'src/lib/profiles/moduleCatalog.ts',
    'src/services/tenantContextService.ts',
    'src/app/api/demo/signin/route.ts',
    'src/app/api/demo/onboarding-fixture/route.ts',
    'src/services/priorNotificationService.ts',
    'src/app/api/residuos/sira/enviar-nt/route.ts',
    'src/lib/validations/normativeCompliance.ts',
    'src/services/scrapYardService.ts',
    'src/services/documentSequenceService.ts',
    'src/lib/validations/digitalSignature.ts',
    'src/lib/pdf/padesInspector.ts',
    'src/lib/signature/autoFirmaClient.ts',
    'src/services/pdfSignatureService.ts',
    'src/app/api/pdf/signed/route.ts',
    'src/app/api/pdf/signed/[id]/route.ts',
    'src/app/api/public/sign-contract-pades/route.ts',
    'src/lib/validations/treatmentOperations.ts',
    'src/lib/ui/tipsPreference.ts',
    'src/lib/diCenterFilter.ts',
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
    './src/services/fleetService.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/lib/validations/fleetValidation.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/lib/decaShare.ts': {
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
    './src/lib/validations/spainLocations.ts': {
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
    './src/lib/validations/discrepancyJustification.ts': {
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
    './src/app/api/deca/[token]/route.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/app/api/residuos/sira/enviar-di/route.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/app/api/contact/route.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/app/api/support/ticket/route.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/app/api/deca/[token]/driver-action/route.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/lib/auth/driverSession.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/lib/auth/premiumAccess.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/lib/auth/premiumGate.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/calendarService.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/pushNotificationService.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/app/api/mobile/conductor/login/route.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/app/api/mobile/conductor/decas/route.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/app/api/push/subscribe/route.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/app/api/push/notify-deca/route.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/app/auth/callback/route.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/lib/supabase/middleware.ts': {
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
    './src/services/delegationService.ts': {
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
    },
    './src/lib/profiles/moduleCatalog.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/tenantContextService.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/app/api/demo/signin/route.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/app/api/demo/onboarding-fixture/route.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/priorNotificationService.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/app/api/residuos/sira/enviar-nt/route.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/lib/validations/normativeCompliance.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/scrapYardService.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/documentSequenceService.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/lib/validations/digitalSignature.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/lib/pdf/padesInspector.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/lib/signature/autoFirmaClient.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/pdfSignatureService.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/app/api/pdf/signed/route.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/app/api/pdf/signed/[id]/route.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/app/api/public/sign-contract-pades/route.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/lib/validations/treatmentOperations.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/lib/ui/tipsPreference.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/lib/diCenterFilter.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
