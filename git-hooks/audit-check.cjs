#!/usr/bin/env node

const input = require('node:fs').readFileSync('/dev/stdin', 'utf8').trim();
if (!input) {
  process.exit(0);
}

let data;
try {
  data = JSON.parse(input);
} catch {
  process.exit(0);
}

const rows = [];
for (const [pkg, advisories] of Object.entries(data)) {
  for (const a of advisories) {
    rows.push({
      package: pkg,
      severity: a.severity,
      title: a.title.length > 50 ? `${a.title.slice(0, 47)}...` : a.title,
      versions: a.vulnerable_versions,
      url: a.url,
    });
  }
}

if (rows.length === 0) {
  process.exit(0);
}

// Sort: critical > high > moderate > low
const order = { critical: 0, high: 1, moderate: 2, low: 3 };
rows.sort((a, b) => (order[a.severity] ?? 4) - (order[b.severity] ?? 4));

// Count by severity
const counts = { critical: 0, high: 0, moderate: 0, low: 0 };
for (const r of rows) {
  counts[r.severity] = (counts[r.severity] || 0) + 1;
}

// Print table
const sep = '+----------+------------+----------------------------------------------------+---------------------+';
console.log('');
console.log(sep);
console.log('| Severity | Package    | Title                                              | Vulnerable Versions |');
console.log(sep);
for (const r of rows) {
  const sev = r.severity.toUpperCase().padEnd(8);
  const pkg = r.package.padEnd(10);
  const title = r.title.padEnd(50);
  const ver = r.versions.padEnd(19);
  console.log(`| ${sev} | ${pkg} | ${title} | ${ver} |`);
}
console.log(sep);

// Summary
const parts = [];
if (counts.critical) parts.push(`${counts.critical} critical`);
if (counts.high) parts.push(`${counts.high} high`);
if (counts.moderate) parts.push(`${counts.moderate} moderate`);
if (counts.low) parts.push(`${counts.low} low`);
console.log('');
console.log(`Summary: ${parts.join(', ')}`);
console.log('');

// Block on critical or high
if (counts.critical > 0 || counts.high > 0) {
  console.log('BLOCKED: Critical or high vulnerabilities detected. Fix before pushing.');
  process.exit(1);
} else {
  console.log('WARNING: Vulnerabilities found but none are critical/high. Proceeding with push.');
  process.exit(0);
}
