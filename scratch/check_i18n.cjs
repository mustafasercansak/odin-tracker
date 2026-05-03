const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'src', 'i18n', 'locales');
const sourceFile = 'en.json';

function flattenKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(flattenKeys(obj[key], newKey));
    } else {
      keys.push(newKey);
    }
  }
  return keys;
}

const sourceData = JSON.parse(fs.readFileSync(path.join(localesDir, sourceFile), 'utf8'));
const sourceKeys = flattenKeys(sourceData);

console.log(`Checking locales against ${sourceFile}...`);
console.log(`Source keys: ${sourceKeys.length}\n`);

const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json') && f !== sourceFile);

files.forEach(file => {
  const targetData = JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf8'));
  const targetKeys = flattenKeys(targetData);
  
  const missing = sourceKeys.filter(k => !targetKeys.includes(k));
  const extra = targetKeys.filter(k => !sourceKeys.includes(k));
  
  console.log(`--- ${file} ---`);
  if (missing.length === 0 && extra.length === 0) {
    console.log('✅ All keys match!');
  } else {
    if (missing.length > 0) {
      console.log(`❌ Missing (${missing.length}):`);
      missing.slice(0, 10).forEach(k => console.log(`  - ${k}`));
      if (missing.length > 10) console.log(`  ... and ${missing.length - 10} more`);
    }
    if (extra.length > 0) {
      console.log(`⚠️ Extra (${extra.length}):`);
      extra.slice(0, 10).forEach(k => console.log(`  - ${k}`));
      if (extra.length > 10) console.log(`  ... and ${extra.length - 10} more`);
    }
  }
  console.log('');
});
