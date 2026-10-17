#!/usr/bin/env node
/**
 * One-time migration: rename .continue/rules/*.rule.md to NN.domain.NZ.name.rule.md
 *
 * Convention: NN.domain.NZ.name.rule.md
 *   NN     — domain order number (01=meta, 02=architecture, 03=angular, 04=design, 05=business)
 *   domain — meta | architecture | angular | design | business
 *   NZ     — sort number within the domain (01, 02, …)
 *   name   — topic slug (kebab-case)
 *
 * Steps:
 *   1. `git mv` every rule file to its new name (keeps history).
 *   2. Rewrite cross-references (old file name → new file name) in all
 *      rule files, KODA.md and .cursorrules.
 *
 * Run: node scripts/migrate-rules-domains.mjs
 */
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const RULES_DIR = '.continue/rules';

// oldName -> newName
const MAPPING = {
  // meta (01)
  '00.meta.agent-behavior.rule.md': '01.meta.01.agent-behavior.rule.md',
  '01.meta.validate-write-arguments.rule.md': '01.meta.02.validate-write-arguments.rule.md',
  '02.meta.git-workflow.rule.md': '01.meta.03.git-workflow.rule.md',
  '03.meta.tasks-workflow.rule.md': '01.meta.04.tasks-workflow.rule.md',
  '04.meta.verification-checklist.rule.md': '01.meta.05.verification-checklist.rule.md',
  '05.meta.docs-conventions.rule.md': '01.meta.06.docs-conventions.rule.md',
  '06.meta.ci-parity.rule.md': '01.meta.07.ci-parity.rule.md',
  '07.meta.dependencies.rule.md': '01.meta.08.dependencies.rule.md',
  '08.meta.rules-maintenance.rule.md': '01.meta.09.rules-maintenance.rule.md',
  // architecture (02)
  '00.architecture.project-architecture.rule.md': '02.architecture.01.project-architecture.rule.md',
  '01.architecture.lazy-loading.rule.md': '02.architecture.02.lazy-loading.rule.md',
  '02.architecture.di-providers.rule.md': '02.architecture.03.di-providers.rule.md',
  '03.architecture.fsd-imports.rule.md': '02.architecture.04.fsd-imports.rule.md',
  '04.architecture.routing.rule.md': '02.architecture.05.routing.rule.md',
  '05.architecture.component-patterns.rule.md': '02.architecture.06.component-patterns.rule.md',
  '06.architecture.stores.rule.md': '02.architecture.07.stores.rule.md',
  '07.architecture.migration-standalone.rule.md': '02.architecture.08.migration-standalone.rule.md',
  // angular (03)
  '00.angular.senior-developer.rule.md': '03.angular.01.senior-developer.rule.md',
  '01.angular.build.rule.md': '03.angular.02.build.rule.md',
  '02.angular.reactive.rule.md': '03.angular.03.reactive.rule.md',
  '03.angular.typescript.rule.md': '03.angular.04.typescript.rule.md',
  '04.angular.testing-strategy.rule.md': '03.angular.05.testing-strategy.rule.md',
  '05.angular.code-style.rule.md': '03.angular.06.code-style.rule.md',
  '06.angular.naming.rule.md': '03.angular.07.naming.rule.md',
  '07.angular.config-editing.rule.md': '03.angular.08.config-editing.rule.md',
  '08.angular.control-flow.rule.md': '03.angular.09.control-flow.rule.md',
  '09.angular.signal-inputs.rule.md': '03.angular.10.signal-inputs.rule.md',
  '10.angular.forms.rule.md': '03.angular.11.forms.rule.md',
  '11.angular.smoke-conformance.rule.md': '03.angular.12.smoke-conformance.rule.md',
  '12.angular.performance.rule.md': '03.angular.13.performance.rule.md',
  // design (04)
  '00.design.styles.rule.md': '04.design.01.styles.rule.md',
  '01.design.a11y.rule.md': '04.design.02.a11y.rule.md',
  '02.design.dialogs.rule.md': '04.design.03.dialogs.rule.md',
  '03.design.i18n.rule.md': '04.design.04.i18n.rule.md',
  // business (05)
  '00.business.security.rule.md': '05.business.01.security.rule.md',
  '01.business.data-content.rule.md': '05.business.02.data-content.rule.md',
  '02.business.errors-http.rule.md': '05.business.03.errors-http.rule.md',
  '03.business.pwa.rule.md': '05.business.04.pwa.rule.md',
  '04.business.env-api-contract.rule.md': '05.business.05.env-api-contract.rule.md',
  '05.business.backend-coordination.rule.md': '05.business.06.backend-coordination.rule.md',
  '06.business.auth.rule.md': '05.business.07.auth.rule.md',
  '07.business.storage.rule.md': '05.business.08.storage.rule.md',
};

// Files whose contents are scanned for references (besides every rule file).
const EXTRA_TARGETS = ['KODA.md', '.cursorrules'];

function main() {
  const rulesDir = join(process.cwd(), RULES_DIR);

  // 1. git mv all rule files (idempotent: skip already-moved files)
  for (const [oldName, newName] of Object.entries(MAPPING)) {
    const oldPath = join(rulesDir, oldName);
    const newPath = join(rulesDir, newName);
    if (existsSync(oldPath) && !existsSync(newPath)) {
      execSync(`git mv "${oldPath}" "${newPath}"`, { stdio: 'inherit' });
      console.log(`moved: ${oldName} -> ${newName}`);
    }
  }

  // 2. Rewrite cross-references in every .md under rules/ + extra targets
  const targets = [
    ...readdirSync(rulesDir).filter((f) => f.endsWith('.md')),
    ...EXTRA_TARGETS,
  ];

  let totalReplacements = 0;
  for (const file of targets) {
    // Root-level targets (KODA.md, .cursorrules) live at the repo root.
    const rootPath = join(process.cwd(), file);
    const rulesPath = join(rulesDir, file);
    const path = existsSync(rootPath) ? rootPath : rulesPath;
    let content = readFileSync(path, 'utf8');
    let fileReplacements = 0;

    // Replace longest names first to avoid partial overlaps (none exist, but be safe)
    const pairs = Object.entries(MAPPING).sort((a, b) => b[0].length - a[0].length);
    for (const [oldName, newName] of pairs) {
      const escaped = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(escaped, 'g');
      const matches = content.match(re);
      if (matches) {
        content = content.split(oldName).join(newName);
        fileReplacements += matches.length;
      }
    }

    if (fileReplacements > 0) {
      writeFileSync(path, content);
      console.log(`updated refs (${fileReplacements}): ${file}`);
      totalReplacements += fileReplacements;
    }
  }

  console.log(`\nDone. Renamed ${Object.keys(MAPPING).length} files, updated ${totalReplacements} references.`);
}

main();