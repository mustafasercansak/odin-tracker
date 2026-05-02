export interface LabReference {
  parameter: string;
  min: number;
  max: number;
  unit: string;
}

export const LAB_REFERENCES: Record<string, LabReference> = {
  creatinine: { parameter: 'creatinine', min: 0.5, max: 1.8, unit: 'mg/dL' },
  sdma: { parameter: 'sdma', min: 0, max: 14, unit: 'µg/dL' },
  bun: { parameter: 'bun', min: 15, max: 35, unit: 'mg/dL' },
  phosphorus: { parameter: 'phosphorus', min: 2.5, max: 6.0, unit: 'mg/dL' },
  potassium: { parameter: 'potassium', min: 3.5, max: 5.5, unit: 'mmol/L' },
  calcium: { parameter: 'calcium', min: 8.5, max: 11.5, unit: 'mg/dL' },
  sodium: { parameter: 'sodium', min: 145, max: 155, unit: 'mmol/L' },
  chloride: { parameter: 'chloride', min: 110, max: 125, unit: 'mmol/L' },
  glucose: { parameter: 'glucose', min: 70, max: 150, unit: 'mg/dL' },
  hematocrit: { parameter: 'hematocrit', min: 30, max: 45, unit: '%' },
  hemoglobin: { parameter: 'hemoglobin', min: 10, max: 15, unit: 'g/dL' },
  wbc: { parameter: 'wbc', min: 5.5, max: 19.5, unit: '10³/µL' },
  platelets: { parameter: 'platelets', min: 200, max: 500, unit: '10³/µL' },
  alt: { parameter: 'alt', min: 10, max: 100, unit: 'U/L' },
  ast: { parameter: 'ast', min: 10, max: 50, unit: 'U/L' },
  alkp: { parameter: 'alkp', min: 10, max: 100, unit: 'U/L' },
  t4: { parameter: 't4', min: 1.0, max: 4.0, unit: 'µg/dL' },
};

export const getReferenceRange = (param: string): LabReference | null => {
  return LAB_REFERENCES[param.toLowerCase()] || null;
};
