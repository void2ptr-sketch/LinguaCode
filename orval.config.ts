import { defineConfig } from 'orval';

/**
 * Orval config — generates Angular HTTP client from backend Swagger/OpenAPI spec.
 *
 * Migration strategy:
 * - Generated code lives in src/app/app/api/generated/ (separate from hand-written code)
 * - Both coexist during transition — consumers switch gradually
 * - Port interfaces stay as the contract layer so consumers don't break
 *
 * To run: npm run generate:api
 */
export default defineConfig({
  backend: {
    output: {
      mode: 'tags',
      target: 'src/app/app/api/generated',
      schemas: 'src/app/app/api/generated/models',
      client: 'angular',
      httpClient: 'angular',
      tsDeclaration: true,
      override: {
        validator: false,
      },
    },
    input: {
      // Download from backend during dev; or use local file during CI
      target: 'http://localhost:8080/v3/api-docs',
      // Or: target: './src/assets/openapi.json',
      // Override backend auth for swagger docs if needed
      override: {
        header: {},
      },
      // Skip strict OpenAPI spec validation.
      // Backend specs (SpringDoc) sometimes omit optional fields like `content`
      // on requestBody — orval would reject them without this flag.
      validation: false,
    },
  },
});
