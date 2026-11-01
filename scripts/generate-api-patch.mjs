#!/usr/bin/env node
/**
 * Download OpenAPI spec from backend, patch malformed endpoints, and generate
 * Angular client with orval.
 *
 * Usage:
 *   node scripts/generate-api-patch.mjs [output-path]
 *
 * Patches applied:
 *   - GET endpoints with requestBody → remove it (GET has no body)
 *   - requestBody without `content` → add `"content": {}`
 *   - SCORM import inline bodies → named schemas (avoids generic names)
 *
 * Swagger schema names are used AS-IS — no renaming.
 * Swagger is the single source of truth for model names.
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

  // PATCH 1: GET endpoints with requestBody → remove it (GET has no body)
  for (const [path, methods] of Object.entries(spec.paths || {})) {
    for (const [method, operation] of Object.entries(methods)) {
      if (!['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method)) {
        continue;
      }

      const op = operation;
      if (!op || typeof op !== 'object') continue;

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

  // PATCH 3: Give SCORM import endpoint named schemas so Orval generates
  // proper names instead of `importScormBody` / `importScormParams`.
  // This is NOT renaming — it's fixing inline request bodies that orval
  // would otherwise name generically.
  const scormImportPath = '/api/v1/scorm/import';
  const scormImportOp = spec.paths?.[scormImportPath]?.post;
  if (scormImportOp) {
    const fileSchema = {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'SCORM ZIP file' }
      },
      required: ['file']
    };
    spec.components.schemas['scorm-import-request'] = fileSchema;
    scormImportOp.requestBody.content['multipart/form-data'] = {
      schema: { $ref: '#/components/schemas/scorm-import-request' }
    };
    delete scormImportOp.requestBody.content['application/json'];
    console.log('  📦  Created named schema scorm-import-request for SCORM import');

    const paramsSchema = {
      type: 'object',
      properties: {
        authorId: { type: 'integer', format: 'int64', description: 'Author user ID' },
        title: { type: 'string', description: 'Optional title override' }
      },
      required: ['authorId']
    };
    spec.components.schemas['scorm-import-parameters'] = paramsSchema;
    scormImportOp.parameters = [
      { $ref: '#/components/schemas/scorm-import-parameters' }
    ];
    console.log('  📦  Created named schema scorm-import-parameters for SCORM import');
  }

  // Write patched spec — Swagger names are used AS-IS
  writeFileSync(OUTPUT_PATH, JSON.stringify(spec, null, 2), 'utf-8');
  console.log(`\n✅ Patched spec written to ${OUTPUT_PATH}`);
  console.log(`   ${patchedCount} content added, ${removedCount} requestBody removed`);
  console.log(`\n🔧 Now run: orval --input ${OUTPUT_PATH}`);
}

// Post-processing: remove orphan params files (never used by services)
async function cleanupOrphanFiles() {
  const fs = await import('fs');
  const path = await import('path');
  const modelsDir = 'src/app/shared/api/generated/models';
  const indexPath = path.join(modelsDir, 'index.ts');

  if (!fs.existsSync(indexPath)) return;

  const orphanFiles = [
    'behaviorGetSnapshotParams.ts', 'behaviorGetWeakCardsParams.ts',
    'cardsListParams.ts', 'cardsSearchParams.ts',
    'coursesListParams.ts', 'coursesSearchParams.ts',
    'exportScormParams.ts', 'feedbackMyFeedbackParams.ts',
    'languagesGetByCodeParams.ts', 'learningGetUserResultsParams.ts',
    'programsListParams.ts', 'programsSearchParams.ts',
    'scenariosListParams.ts', 'scenariosSearchParams.ts',
  ];

  let indexContent = fs.readFileSync(indexPath, 'utf-8');
  let removedCount = 0;

  for (const file of orphanFiles) {
    const filePath = path.join(modelsDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      removedCount++;
      console.log(`  🗑️  Removed orphan: ${file}`);
    }
    indexContent = indexContent.replace(`export * from './${file}';\n`, '');
  }

  if (removedCount > 0) {
    fs.writeFileSync(indexPath, indexContent);
    console.log(`  📝  Cleaned ${removedCount} orphan exports from index.ts`);
  }
}

// Run post-processing only (called after orval)
if (process.argv.includes('--post')) {
  cleanupOrphanFiles().catch(err => {
    console.error('❌ Post-processing failed:', err.message);
    process.exit(1);
  });
} else {
  main().catch(err => {
    console.error('❌', err.message);
    process.exit(1);
  });
}
