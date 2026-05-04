const fs = require('fs');
const path = require('path');

const localesDir = path.resolve(__dirname, '../src/i18n/locales');
const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));

const keysToSync = [
  'common.confirmDelete',
  'shares.confirmRevoke',
  'settings.aiKeys.title',
  'settings.aiKeys.subtitle',
  'settings.aiKeys.privacyNote'
];

function getDeepValue(obj, path) {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

function setDeepValue(obj, path, value) {
  const parts = path.split('.');
  const last = parts.pop();
  const deep = parts.reduce((acc, part) => {
    if (!acc[part]) acc[part] = {};
    return acc[part];
  }, obj);
  deep[last] = value;
}

const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json') && f !== 'en.json');

files.forEach(file => {
  const filePath = path.join(localesDir, file);
  const locale = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let changed = false;

  keysToSync.forEach(keyPath => {
    if (getDeepValue(locale, keyPath) === undefined) {
      setDeepValue(locale, keyPath, getDeepValue(en, keyPath));
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(locale, null, 2) + '\n', 'utf8');
    console.log(`Updated ${file}`);
  }
});
