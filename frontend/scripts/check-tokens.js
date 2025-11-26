#!/usr/bin/env node
// Simple check: fail if a legacy `tokens.css` file exists or any file imports it
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
let found = false;

// 1) check if file exists
const legacyPath = path.join(root, 'src', 'styles', 'tokens.css');
if (fs.existsSync(legacyPath)) {
  console.error('ERROR: legacy file found: src/styles/tokens.css — delete or rename it.');
  found = true;
}

// 2) search for literal references in repo files (small scan)
function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      // skip common generated folders and our scripts helper folder
      if (['node_modules', 'dist', '.git', 'scripts'].includes(e.name)) continue;
      walk(full);
    } else {
      try {
        const txt = fs.readFileSync(full, 'utf8');
        if (txt.indexOf('tokens.css') !== -1) {
          console.error('ERROR: reference to "tokens.css" found in', path.relative(root, full));
          found = true;
        }
      } catch (err) {
        // ignore binary files
      }
    }
  }
}

walk(root);

if (found) process.exit(2);
console.log('OK: no legacy tokens.css file or references found.');
process.exit(0);
