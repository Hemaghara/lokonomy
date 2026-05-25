import fs from 'fs';

const log = fs.readFileSync('scratch/test_run.log', 'utf16le');
const lines = log.split(/\r?\n/);

console.log("=== PARSING KEYWORDS ===");
lines.forEach((line, idx) => {
  const clean = line.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').trim();
  if (clean.includes('originated in') || clean.includes('Exception') || clean.includes('TypeError') || clean.includes('ReferenceError') || clean.includes('AxiosError')) {
    console.log(`${idx + 1}: ${clean}`);
  }
});
