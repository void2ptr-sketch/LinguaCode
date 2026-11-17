const fs = require('fs');
const lines = fs.readFileSync('coverage/lingua-code/lcov.info', 'utf8').split('\n');
const files = {};
let current = null;

for (const line of lines) {
  if (line.startsWith('SF:')) {
    current = line.slice(3);
    files[current] = { fnf: 0, fnh: 0, brf: 0, brh: 0, lf: 0, lh: 0 };
  } else if (current && line.startsWith('FNF:')) {
    files[current].fnf = parseInt(line.slice(4));
  } else if (current && line.startsWith('FNH:')) {
    files[current].fnh = parseInt(line.slice(4));
  } else if (current && line.startsWith('BRF:')) {
    files[current].brf = parseInt(line.slice(4));
  } else if (current && line.startsWith('BRH:')) {
    files[current].brh = parseInt(line.slice(4));
  } else if (current && line.startsWith('LF:')) {
    files[current].lf = parseInt(line.slice(3));
  } else if (current && line.startsWith('LH:')) {
    files[current].lh = parseInt(line.slice(3));
  } else if (line === 'end_of_record' && current) {
    current = null;
  }
}

const results = Object.entries(files)
  .map(([file, s]) => ({
    file,
    brm: s.brf - s.brh,
    lfm: s.lf - s.lh,
    bp: s.brf ? s.brh / s.brf * 100 : 0,
    sp: s.lf ? s.lh / s.lf * 100 : 0,
  }))
  .filter(f => f.brm > 20 && f.lf > 10 && f.bp < 90)
  .sort((a, b) => b.brm - a.brm);

console.log('=== MOST MISSED BRANCHES (20+, not near 100%) ===');
for (const r of results.slice(0, 25)) {
  console.log(r.brm + ' br missed | ' + r.lfm + ' lines missed | ' + r.bp.toFixed(1) + '% br | ' + r.sp.toFixed(1) + '% stmt | ' + r.file);
}
