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
  // Архитектурная граница: core/models — нижний слой ядра.
  // Запрещаем импорты из «вышестоящих» слоёв (регрессия инверсии зависимостей).
  {
    files: ['src/app/core/models/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '../api',
                '../api/**',
                '../domain',
                '../domain/**',
                '../layout',
                '../layout/**',
                '../repositories',
                '../repositories/**',
                '../security',
                '../security/**',
                '../services',
                '../services/**',
                '../state',
                '../state/**',
                '../theme',
                '../theme/**',
                '../../shared',
                '../../shared/**',
              ],
              message:
                'core/models must be a leaf layer: import only from other core/models files.',
            },
          ],
        },
      ],
    },
  },
  // Импортировать модели следует из barrel `core/models`, а не по глубоким путям.
  // Для относительных импортов внутри core действует `**/models/*.*`.
  {
    files: ['src/app/core/**/*.ts'],
    ignores: ['src/app/core/models/**'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['**/models/*.*'],
              message: 'Import models from the core/models barrel instead of deep file paths.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/app/shared/**/*.ts', 'src/app/features/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['**/core/models/*.*'],
              message: 'Import models from the core/models barrel instead of deep file paths.',
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
