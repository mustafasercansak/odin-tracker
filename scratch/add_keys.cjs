const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/i18n/locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const newKeys = {
  "nutrition": {
    "bcs": {
      "desc_1_2": "Severely Underweight: Bones visible from distance, no body fat.",
      "desc_3": "Underweight: Ribs easily felt and visible. Clear waist.",
      "desc_4_5": "Ideal: Ribs felt but not visible. Clear waist and abdominal tuck.",
      "desc_6_7": "Overweight: Ribs felt with pressure. Waist is barely visible.",
      "desc_8_9": "Obese: Ribs not felt. No waist. Heavy fat deposits."
    }
  }
};

const trTranslations = {
  "nutrition": {
    "bcs": {
      "desc_1_2": "Çok Zayıf: Kemikler uzaktan belli olur, hiç yağ dokusu yoktur.",
      "desc_3": "Zayıf: Kaburgalar kolayca hissedilir ve görülür. Bel belirgindir.",
      "desc_4_5": "İdeal: Kaburgalar hissedilir ama görülmez. Bel ve karın hattı idealdir.",
      "desc_6_7": "Kilolu: Kaburgaları hissetmek için bastırmak gerekir. Bel hattı belirsizdir.",
      "desc_8_9": "Obez: Kaburgalar hissedilmez. Bel yoktur, belirgin yağlanma vardır."
    }
  }
};

function mergeDeep(target, source) {
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], mergeDeep(target[key], source[key]));
    }
  }
  Object.assign(target || {}, source);
  return target;
}

files.forEach(file => {
  const filePath = path.join(localesDir, file);
  let data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  const translationsToUse = file === 'tr.json' ? trTranslations : newKeys;
  data = mergeDeep(data, translationsToUse);
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log('Updated ' + file);
});
