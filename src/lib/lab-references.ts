export interface LabReference {
  parameter: string;
  min: number;
  max: number;
  unit: string;
}

type Species = 'dog' | 'cat' | 'bird' | 'rabbit' | 'other' | string;

// ─── Dog reference ranges ─────────────────────────────────────────────────────

const DOG_REFERENCES: Record<string, LabReference> = {
  // Chemistry / kidney
  creatinine:             { parameter: 'creatinine',             min: 0.5,  max: 1.8,   unit: 'mg/dL' },
  sdma:                   { parameter: 'sdma',                   min: 0,    max: 14,    unit: 'µg/dL' },
  bun:                    { parameter: 'bun',                    min: 7,    max: 27,    unit: 'mg/dL' },
  phosphorus:             { parameter: 'phosphorus',             min: 2.5,  max: 6.0,   unit: 'mg/dL' },
  potassium:              { parameter: 'potassium',              min: 3.5,  max: 5.5,   unit: 'mmol/L' },
  calcium:                { parameter: 'calcium',                min: 8.9,  max: 11.4,  unit: 'mg/dL' },
  sodium:                 { parameter: 'sodium',                 min: 141,  max: 152,   unit: 'mmol/L' },
  chloride:               { parameter: 'chloride',               min: 105,  max: 115,   unit: 'mmol/L' },
  albumin:                { parameter: 'albumin',                min: 2.5,  max: 4.4,   unit: 'g/dL' },
  total_protein:          { parameter: 'total_protein',          min: 5.4,  max: 8.2,   unit: 'g/dL' },
  glucose:                { parameter: 'glucose',                min: 70,   max: 138,   unit: 'mg/dL' },
  // Urine
  urine_specific_gravity: { parameter: 'urine_specific_gravity', min: 1.015, max: 1.045, unit: '' },
  upc_ratio:              { parameter: 'upc_ratio',              min: 0,    max: 0.5,   unit: '' },
  urine_ph:               { parameter: 'urine_ph',               min: 5.5,  max: 7.5,   unit: '' },
  // CBC – red cell
  hematocrit:             { parameter: 'hematocrit',             min: 37,   max: 55,    unit: '%' },
  hemoglobin:             { parameter: 'hemoglobin',             min: 12,   max: 18,    unit: 'g/dL' },
  rbc:                    { parameter: 'rbc',                    min: 5.5,  max: 8.5,   unit: '10⁶/µL' },
  mcv:                    { parameter: 'mcv',                    min: 60,   max: 77,    unit: 'fL' },
  mch:                    { parameter: 'mch',                    min: 19,   max: 25,    unit: 'pg' },
  mchc:                   { parameter: 'mchc',                   min: 32,   max: 36,    unit: 'g/dL' },
  rdw_cv:                 { parameter: 'rdw_cv',                 min: 12,   max: 18,    unit: '%' },
  rdw_sd:                 { parameter: 'rdw_sd',                 min: 28,   max: 46,    unit: 'fL' },
  // CBC – white cell
  wbc:                    { parameter: 'wbc',                    min: 5.0,  max: 15.5,  unit: '10³/µL' },
  neutrophils:            { parameter: 'neutrophils',            min: 2.9,  max: 12.0,  unit: '10³/µL' },
  lymphocytes:            { parameter: 'lymphocytes',            min: 1.0,  max: 4.8,   unit: '10³/µL' },
  monocytes:              { parameter: 'monocytes',              min: 0.2,  max: 1.5,   unit: '10³/µL' },
  eosinophils:            { parameter: 'eosinophils',            min: 0.1,  max: 1.3,   unit: '10³/µL' },
  basophils:              { parameter: 'basophils',              min: 0,    max: 0.1,   unit: '10³/µL' },
  // CBC – platelets
  platelets:              { parameter: 'platelets',              min: 150,  max: 500,   unit: '10³/µL' },
  mpv:                    { parameter: 'mpv',                    min: 7.0,  max: 12.9,  unit: 'fL' },
  pdw:                    { parameter: 'pdw',                    min: 10,   max: 18,    unit: '%' },
  pct:                    { parameter: 'pct',                    min: 0.1,  max: 0.5,   unit: '%' },
  // Liver / endocrine
  alt:                    { parameter: 'alt',                    min: 10,   max: 125,   unit: 'U/L' },
  ast:                    { parameter: 'ast',                    min: 10,   max: 50,    unit: 'U/L' },
  alkp:                   { parameter: 'alkp',                   min: 10,   max: 150,   unit: 'U/L' },
  alp:                    { parameter: 'alp',                    min: 10,   max: 150,   unit: 'U/L' },
  ggt:                    { parameter: 'ggt',                    min: 0,    max: 11,    unit: 'U/L' },
  bilirubin:              { parameter: 'bilirubin',              min: 0,    max: 0.9,   unit: 'mg/dL' },
  t4:                     { parameter: 't4',                     min: 1.0,  max: 4.0,   unit: 'µg/dL' },
  cholesterol:            { parameter: 'cholesterol',            min: 125,  max: 270,   unit: 'mg/dL' },
  triglycerides:          { parameter: 'triglycerides',          min: 25,   max: 150,   unit: 'mg/dL' },
};

// ─── Cat reference ranges ─────────────────────────────────────────────────────

const CAT_REFERENCES: Record<string, LabReference> = {
  // Chemistry / kidney
  creatinine:             { parameter: 'creatinine',             min: 0.6,  max: 2.4,   unit: 'mg/dL' },
  sdma:                   { parameter: 'sdma',                   min: 0,    max: 14,    unit: 'µg/dL' },
  bun:                    { parameter: 'bun',                    min: 15,   max: 33,    unit: 'mg/dL' },
  phosphorus:             { parameter: 'phosphorus',             min: 2.4,  max: 8.2,   unit: 'mg/dL' },
  potassium:              { parameter: 'potassium',              min: 3.5,  max: 5.8,   unit: 'mmol/L' },
  calcium:                { parameter: 'calcium',                min: 8.7,  max: 11.7,  unit: 'mg/dL' },
  sodium:                 { parameter: 'sodium',                 min: 150,  max: 165,   unit: 'mmol/L' },
  chloride:               { parameter: 'chloride',               min: 115,  max: 130,   unit: 'mmol/L' },
  albumin:                { parameter: 'albumin',                min: 2.2,  max: 3.9,   unit: 'g/dL' },
  total_protein:          { parameter: 'total_protein',          min: 5.9,  max: 8.5,   unit: 'g/dL' },
  glucose:                { parameter: 'glucose',                min: 70,   max: 150,   unit: 'mg/dL' },
  // Urine
  urine_specific_gravity: { parameter: 'urine_specific_gravity', min: 1.020, max: 1.060, unit: '' },
  upc_ratio:              { parameter: 'upc_ratio',              min: 0,    max: 0.4,   unit: '' },
  urine_ph:               { parameter: 'urine_ph',               min: 5.5,  max: 7.0,   unit: '' },
  // CBC – red cell
  hematocrit:             { parameter: 'hematocrit',             min: 24,   max: 45,    unit: '%' },
  hemoglobin:             { parameter: 'hemoglobin',             min: 8,    max: 15,    unit: 'g/dL' },
  rbc:                    { parameter: 'rbc',                    min: 5.0,  max: 10.0,  unit: '10⁶/µL' },
  mcv:                    { parameter: 'mcv',                    min: 39,   max: 55,    unit: 'fL' },
  mch:                    { parameter: 'mch',                    min: 12,   max: 17,    unit: 'pg' },
  mchc:                   { parameter: 'mchc',                   min: 28,   max: 35,    unit: 'g/dL' },
  rdw_cv:                 { parameter: 'rdw_cv',                 min: 13,   max: 18,    unit: '%' },
  rdw_sd:                 { parameter: 'rdw_sd',                 min: 28,   max: 44,    unit: 'fL' },
  // CBC – white cell
  wbc:                    { parameter: 'wbc',                    min: 5.5,  max: 19.5,  unit: '10³/µL' },
  neutrophils:            { parameter: 'neutrophils',            min: 2.5,  max: 12.5,  unit: '10³/µL' },
  lymphocytes:            { parameter: 'lymphocytes',            min: 1.5,  max: 7.0,   unit: '10³/µL' },
  monocytes:              { parameter: 'monocytes',              min: 0.1,  max: 0.8,   unit: '10³/µL' },
  eosinophils:            { parameter: 'eosinophils',            min: 0.1,  max: 1.5,   unit: '10³/µL' },
  basophils:              { parameter: 'basophils',              min: 0,    max: 0.1,   unit: '10³/µL' },
  // CBC – platelets (cats have wider normal range)
  platelets:              { parameter: 'platelets',              min: 200,  max: 800,   unit: '10³/µL' },
  mpv:                    { parameter: 'mpv',                    min: 7.0,  max: 12.9,  unit: 'fL' },
  pdw:                    { parameter: 'pdw',                    min: 10,   max: 18,    unit: '%' },
  pct:                    { parameter: 'pct',                    min: 0.1,  max: 0.7,   unit: '%' },
  // Liver / endocrine (cats have lower ALKP ceiling — important!)
  alt:                    { parameter: 'alt',                    min: 10,   max: 100,   unit: 'U/L' },
  ast:                    { parameter: 'ast',                    min: 10,   max: 50,    unit: 'U/L' },
  alkp:                   { parameter: 'alkp',                   min: 10,   max: 85,    unit: 'U/L' },
  alp:                    { parameter: 'alp',                    min: 10,   max: 85,    unit: 'U/L' },
  ggt:                    { parameter: 'ggt',                    min: 0,    max: 8,     unit: 'U/L' },
  bilirubin:              { parameter: 'bilirubin',              min: 0,    max: 0.6,   unit: 'mg/dL' },
  t4:                     { parameter: 't4',                     min: 1.0,  max: 4.0,   unit: 'µg/dL' },
  cholesterol:            { parameter: 'cholesterol',            min: 95,   max: 225,   unit: 'mg/dL' },
  triglycerides:          { parameter: 'triglycerides',          min: 20,   max: 100,   unit: 'mg/dL' },
};

// ─── Public API ───────────────────────────────────────────────────────────────

export const getReferenceRange = (param: string, species?: Species): LabReference | null => {
  const key = param.toLowerCase();
  if (species === 'cat') return CAT_REFERENCES[key] || null;
  // dog is default for unknown/other species
  return DOG_REFERENCES[key] || null;
};
