import { describe, it, expect } from 'vitest';
import en from '../i18n/locales/en.json';
import tr from '../i18n/locales/tr.json';

describe('i18n Localization Check', () => {
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

  const enKeys = getKeys(en);
  const trKeys = getKeys(tr);

  it('should have the same keys in English and Turkish', () => {
    const missingInTr = enKeys.filter(k => !trKeys.includes(k));
    const missingInEn = trKeys.filter(k => !enKeys.includes(k));

    // Check for empty translations
    const emptyInTr = trKeys.filter(k => {
      const val = k.split('.').reduce((obj, key) => obj?.[key], tr);
      return typeof val === 'string' && val.trim() === '';
    });

    if (missingInTr.length > 0) console.warn('Missing keys in Turkish:', missingInTr);
    if (missingInEn.length > 0) console.warn('Missing keys in English:', missingInEn);
    if (emptyInTr.length > 0) console.warn('Empty translations in Turkish:', emptyInTr);

    expect(missingInTr).toEqual([]);
    expect(missingInEn).toEqual([]);
    expect(emptyInTr).toEqual([]);
  });
});
