#!/usr/bin/env node
/**
 * Download OpenAPI spec from backend, patch malformed endpoints, and generate
 * Angular client with orval.
 *
 * Usage:
 *   node scripts/generate-api-patch.mjs [output-path]
 *
 * Patches applied:
 *   - GET endpoints with requestBody missing `content` → add `"content": {}`
 *   - Any path with empty `requestBody` → remove requestBody entirely
 *
 * This is needed because some SpringDoc configurations generate incomplete
 * OpenAPI 3.0 specs for unusual endpoints (e.g. GET with no body).
 */

import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const API_DOCS_URL = process.env.API_DOCS_URL || 'http://localhost:8080/v3/api-docs';
const OUTPUT_PATH = process.argv[2] || join('src', 'assets', 'openapi-patched.json');

async function main() {
  console.log('📡 Fetching OpenAPI spec from', API_DOCS_URL);

  const response = await fetch(API_DOCS_URL);
  if (!response.ok) {
    console.error(`❌ Failed to fetch: ${response.status} ${response.statusText}`);
    process.exit(1);
  }

  let spec = await response.json();
  const originalPaths = Object.keys(spec.paths || {});
  console.log(`📋 Found ${originalPaths.length} paths`);

  let patchedCount = 0;
  let removedCount = 0;

  // Patch each path
  for (const [path, methods] of Object.entries(spec.paths || {})) {
    for (const [method, operation] of Object.entries(methods)) {
      if (!['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method)) {
        continue;
      }

      const op = operation;
      if (!op || typeof op !== 'object') continue;

      // PATCH 1: GET endpoints with requestBody → remove it (GET has no body)
      if (method === 'get' && op.requestBody) {
        delete spec.paths[path][method].requestBody;
        removedCount++;
        console.log(`  ✂️  Removed requestBody from GET ${path}`);
        continue;
      }

      // PATCH 2: requestBody without `content` → add empty content
      if (op.requestBody && typeof op.requestBody === 'object') {
        if (!op.requestBody.content) {
          op.requestBody.content = {};
          patchedCount++;
          console.log(`  🔧  Added empty content to ${method.toUpperCase()} ${path}`);
        }
      }
    }
  }

  // Write patched spec
  writeFileSync(OUTPUT_PATH, JSON.stringify(spec, null, 2), 'utf-8');
  console.log(`\n✅ Patched spec written to ${OUTPUT_PATH}`);
  console.log(`   ${patchedCount} content added, ${removedCount} requestBody removed`);
  console.log(`\n🔧 Now run: orval --input ${OUTPUT_PATH}`);
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
