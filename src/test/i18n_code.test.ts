import { describe, it, expect } from 'vitest';
import en from '../i18n/locales/en.json';
import fs from 'fs';
import path from 'path';

describe('i18n Code Usage Check', () => {
  const getKeys = (obj: any, prefix = ''): string[] => {
    return Object.keys(obj).reduce((res: string[], el) => {
      if (Array.isArray(obj[el])) {
        return res.concat(prefix + el);
      } else if (typeof obj[el] === 'object' && obj[el] !== null) {
        return res.concat(getKeys(obj[el], prefix + el + '.'));
      }
      return res.concat(prefix + el);
    }, []);
  };

  const enKeys = new Set(getKeys(en));

  const getAllFiles = (dir: string, fileList: string[] = []): string[] => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        getAllFiles(filePath, fileList);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        fileList.push(filePath);
      }
    });
    return fileList;
  };

  const tRegex = /t\(['"]([^'"]+)['"]\)/g;
  const srcFiles = getAllFiles(path.resolve(__dirname, '../'));

  it('should have all literal translation keys in en.json', () => {
    const missingKeys: { file: string; key: string }[] = [];

    srcFiles.forEach(file => {
      if (file.includes('test/')) return;
      const content = fs.readFileSync(file, 'utf8');
      let match;
      while ((match = tRegex.exec(content)) !== null) {
        const key = match[1];
        // Ignore dynamic keys (containing ${ or backticks) handled by the regex check
        // Also ignore parameters like { defaultValue: ... }
        if (!enKeys.has(key) && !key.includes('{{') && !key.includes('${')) {
          missingKeys.push({ file: path.basename(file), key });
        }
      }
    });

    if (missingKeys.length > 0) {
      console.error('Missing Translation Keys found in code:');
      missingKeys.forEach(m => console.error(`- ${m.key} in ${m.file}`));
    }

    expect(missingKeys).toEqual([]);
  });

  it('should have all recordTypes translations', () => {
    const types = ['lab_test', 'vet_visit', 'medication', 'weight', 'vaccination', 'vitals', 'symptom_checkin', 'milestone'];
    types.forEach(type => {
      expect(enKeys.has(`healthRecords.recordTypes.${type}`)).toBe(true);
    });
  });
});
