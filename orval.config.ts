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
 *
 * Naming convention:
 * - Backend operationId uses dot notation: "cards.list", "cards.getById"
 * - Orval generates service methods: cards.list(), cards.getById()
 * - Schema prefix = first word (e.g. "Cards" from "cards.list")
 * - This avoids "listCardsKind" → "CardsKind" clarity
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
