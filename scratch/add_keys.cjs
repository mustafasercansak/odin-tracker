const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/i18n/locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const newKeys = {
  "nutrition": {
    "calculator": {
      "title": "Daily Calorie (DER) Calculator",
      "needsWeight": "Please update your pet's weight to calculate calories.",
      "rer": "RER (Resting)",
      "der": "DER (Target)",
      "activityLevel": "Activity Level",
      "foodCalories": "Food Calories (kcal / 100g)",
      "dailyAmount": "Daily {{amount}}g"
    },
    "factors": {
      "cat": {
        "neutered": "Neutered Adult",
        "intact": "Intact Adult",
        "inactive": "Inactive / Obese Prone",
        "weightLoss": "Weight Loss"
      },
      "dog": {
        "neutered": "Neutered Adult",
        "intact": "Intact Adult",
        "inactive": "Inactive / Obese Prone",
        "weightLoss": "Weight Loss"
      }
    }
  },
  "badges": {
    "shield": "Protection Shield",
    "star": "Super Carer",
    "bot": "Tech Wizard"
  },
  "share": {
    "card": {
      "title": "Health Card (Social Media)",
      "subtitle": "Share your pet's health summary with friends on Instagram or WhatsApp!",
      "download": "Download & Share PNG"
    }
  }
};

const trTranslations = {
  "nutrition": {
    "calculator": {
      "title": "Günlük Kalori (DER) Hesaplayıcı",
      "needsWeight": "Lütfen kalori hesabı için evcil hayvanınızın kilosunu güncelleyin.",
      "rer": "RER (Dinlenme)",
      "der": "DER (Hedef)",
      "activityLevel": "Aktivite Seviyesi",
      "foodCalories": "Mama Kalorisi (kcal / 100g)",
      "dailyAmount": "Günlük {{amount}}g"
    },
    "factors": {
      "cat": {
        "neutered": "Kısırlaştırılmış",
        "intact": "Kısırlaştırılmamış",
        "inactive": "Düşük Aktivite",
        "weightLoss": "Kilo Kaybı"
      },
      "dog": {
        "neutered": "Kısırlaştırılmış",
        "intact": "Kısırlaştırılmamış",
        "inactive": "Düşük Aktivite",
        "weightLoss": "Kilo Kaybı"
      }
    }
  },
  "badges": {
    "shield": "Koruma Kalkanı",
    "star": "Süper Bakıcı",
    "bot": "Teknoloji Kurdu"
  },
  "share": {
    "card": {
      "title": "Sağlık Kartı (Sosyal Medya)",
      "subtitle": "Evcil hayvanınızın sağlık özetini Instagram veya WhatsApp'ta sevdiklerinizle paylaşın!",
      "download": "PNG Olarak İndir & Paylaş"
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
  
  // Apply translations
  data = mergeDeep(data, translationsToUse);
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log('Updated ' + file);
});
