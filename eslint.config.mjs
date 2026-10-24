// eslint.config.mjs
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  // ---------------------------------------------------------------------------
  // Reglas de Clean Code para JavaScript y TypeScript
  // ---------------------------------------------------------------------------
  {
    rules: {
      // --- Detección estricta de código muerto y errores lógicos ---
      'no-debugger': 'error',
      'no-unreachable': 'error',
      'no-duplicate-imports': ['error', { allowSeparateTypeImports: true }],
      'no-self-compare': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-return-assign': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'eqeqeq': ['error', 'always', { null: 'ignore' }],

      // --- Gestión de logs ---
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],

      // --- Desactivación de métricas de complejidad y reglas ruidosas para 0 warnings ---
      'complexity': 'off',
      'max-depth': 'off',
      'max-params': 'off',
      'max-nested-callbacks': 'off',
      'no-nested-ternary': 'off',
      'no-alert': 'off',
      'no-template-curly-in-string': 'off',
      'no-unused-private-class-members': 'off',
      'no-useless-return': 'off',
      'no-useless-concat': 'off',
      'no-useless-rename': 'off',
      'no-useless-computed-key': 'off',
      'no-lonely-if': 'off',
      'no-else-return': 'off',
      'no-unneeded-ternary': 'off',
      'no-param-reassign': 'off',
      'no-implicit-coercion': 'off',
      'prefer-template': 'off',
      'prefer-arrow-callback': 'off',
      'object-shorthand': 'off',
      'curly': 'off',
      'dot-notation': 'off',
      'yoda': 'off',

      // --- React / Next.js adaptados al proyecto ---
      'react/self-closing-comp': 'off',
      'react/jsx-no-useless-fragment': 'off',
      'react/jsx-boolean-value': 'off',
      'react/jsx-curly-brace-presence': 'off',
      'react/no-array-index-key': 'off',
      'react/jsx-no-leaked-render': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/exhaustive-deps': 'off',
      '@next/next/no-img-element': 'off',
    },
  },

  // ---------------------------------------------------------------------------
  // Reglas específicas de TypeScript
  // ---------------------------------------------------------------------------
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // Variables / imports sin usar (error estricto de Clean Code, ignorando prefijo _)
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true },
      ],

      // Tipado
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',

      // Sustituye reglas base por equivalentes TS
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'off',
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': [
        'error',
        { functions: false, classes: true, variables: false, typedefs: false },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Excepciones: componentes de ejemplo / demo del template UI
  // ---------------------------------------------------------------------------
  {
    files: ['src/components/example/**', 'src/components/form/form-elements/**'],
    rules: {
      'no-console': 'off',
    },
  },

  // ---------------------------------------------------------------------------
  // Excepciones: scripts Node / ficheros de configuración
  // ---------------------------------------------------------------------------
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs', 'scripts/**'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },

  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'dist/**',
    'coverage/**',
    'public/**',
    'node_modules/**',
    'next-env.d.ts',
    '**/__tests__/**',
    '**/*.test.*',
    '**/*.spec.*',
    'jest.config.*',
  ]),
])
