// @ts-check
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  // ===== FSD: layer direction (imports strictly downward) =====
  // Layer order: app -> pages -> widgets -> features -> entities -> shared.
  // A module may import from its own layer or any layer BELOW it.
  // Patterns match relative import specifiers that cross into a higher layer.
  // shared (bottom): nothing from entities/features/widgets/pages/app
  {
    files: ['src/app/shared/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/entities/**',
                '**/features/**',
                '**/widgets/**',
                '**/pages/**',
                '**/app/**',
              ],
              message:
                'FSD: shared is the bottom layer and must not import from entities/features/widgets/pages/app.',
            },
          ],
        },
      ],
    },
  },
  // entities: nothing from features/widgets/pages/app
  {
    files: ['src/app/entities/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/features/**', '**/widgets/**', '**/pages/**', '**/app/**'],
              message:
                'FSD: entities must not import from features/widgets/pages/app (imports go strictly downward).',
            },
          ],
        },
      ],
    },
  },
  // features: nothing from widgets/pages/app
  {
    files: ['src/app/features/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/widgets/**', '**/pages/**', '**/app/**'],
              message:
                'FSD: features must not import from widgets/pages/app (imports go strictly downward).',
            },
          ],
        },
      ],
    },
  },
  // widgets: nothing from pages/app
  {
    files: ['src/app/widgets/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/pages/**', '**/app/**'],
              message:
                'FSD: widgets must not import from pages/app (imports go strictly downward).',
            },
          ],
        },
      ],
    },
  },
  // pages: nothing from app
  {
    files: ['src/app/pages/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/app/**'],
              message:
                'FSD: pages must not import from the app layer (imports go strictly downward).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {},
  },
);
