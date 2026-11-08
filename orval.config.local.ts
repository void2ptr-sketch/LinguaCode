import { defineConfig } from 'orval';

/**
 * Local mode — reads from downloaded/openapi.json file.
 * Use when backend is not running:
 *   1. npm run generate:api:local   (requires backend running once to download spec)
 *   2. or edit orval.config.ts to point to './src/assets/openapi.json'
 */
export default defineConfig({
  backend: {
    output: {
      mode: 'tags',
      target: 'src/app/shared/api/generated',
      schemas: 'src/app/shared/api/generated/models',
      client: 'angular',
      httpClient: 'angular',
      tsDeclaration: true,
      override: {
        validator: false,
      },
    },
    input: {
      target: './src/assets/openapi.json',
      validation: false,
    },
  },
});
