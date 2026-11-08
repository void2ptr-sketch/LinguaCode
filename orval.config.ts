import { defineConfig } from 'orval';

/**
 * Orval config — generates Angular HTTP client from backend Swagger/OpenAPI spec.
 *
 * Generated code lives in `src/app/shared/api/generated/`.
 *
 * To run: npm run generate:api
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
      // Download patched spec (with renamed schemas) from backend during dev
      // The patch script fixes SpringDoc generic type naming:
      //   ApiOneResponse<CardDto> → cardResponse (not CardResponse)
      //   ApiListResponse<CardDto> → cardList (not CardList)
      target: 'http://localhost:8080/v3/api-docs',
      // Or: target: './src/assets/openapi-patched.json',
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
