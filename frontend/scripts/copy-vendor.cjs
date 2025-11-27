const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'node_modules', 'html2pdf.js', 'dist', 'html2pdf.bundle.min.js');
const destDir = path.join(__dirname, '..', 'public', 'vendor');
const dest = path.join(destDir, 'html2pdf.bundle.min.js');

function ensureVendorCopy() {
  if (!fs.existsSync(src)) {
    console.warn(`html2pdf bundle not found at ${src}. Skipping copy.`);
    return;
  }

  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`Copied html2pdf bundle to ${dest}`);
}

ensureVendorCopy();
