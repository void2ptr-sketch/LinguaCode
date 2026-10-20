const data = require('./coverage/lingua-code/coverage-final.json');

const tsFiles = Object.entries(data)
  .filter(
    ([path]) =>
      path.includes('src/app') &&
      path.endsWith('.ts') &&
      !path.includes('.spec.') &&
      !path.includes('/index.ts') &&
      !path.includes('/mock/') &&
      !path.includes('environment'),
  )
  .map(([path, coverage]) => {
    const branchMap = coverage.branchMap || {};
    const branches = coverage.branches || {};

    const branchTotal = Object.keys(branchMap).length;
    const branchCovered = Object.keys(branches).filter((k) => {
      const b = branches[k];
      return b.total > 0 && b.covered === b.total;
    }).length;
    const branchUncovered = branchTotal - branchCovered;

    return {
      path: path.replace('/home/alex/workspace/Angular.LinguaCode/src/app/', ''),
      branchTotal,
      branchCovered,
      branchUncovered,
      branchPct: branchTotal > 0 ? (branchCovered / branchTotal) * 100 : 100,
    };
  });

// Files with MOST uncovered branches (highest impact for improvement)
console.log('Files with MOST uncovered branches (top 30 - highest impact):');
tsFiles
  .filter((f) => f.branchUncovered > 0)
  .sort((a, b) => b.branchUncovered - a.branchUncovered)
  .slice(0, 30)
  .forEach((f, i) => {
    console.log(
      i +
        1 +
        '. ' +
        f.path.padEnd(60) +
        ' ' +
        f.branchUncovered +
        ' uncovered / ' +
        f.branchTotal +
        ' total (' +
        f.branchPct.toFixed(1) +
        '%)',
    );
  });
