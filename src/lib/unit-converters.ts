/**
 * Unit conversion utilities for common veterinary lab parameters.
 */

export interface UnitConversion {
  from: string;
  to: string;
  factor: number;
}

const CONVERSIONS: Record<string, UnitConversion[]> = {
  creatinine: [
    { from: 'mg/dL', to: 'μmol/L', factor: 88.4 },
    { from: 'μmol/L', to: 'mg/dL', factor: 1 / 88.4 },
  ],
  bun: [
    { from: 'mg/dL', to: 'mmol/L', factor: 0.357 },
    { from: 'mmol/L', to: 'mg/dL', factor: 1 / 0.357 },
  ],
  glucose: [
    { from: 'mg/dL', to: 'mmol/L', factor: 0.0555 },
    { from: 'mmol/L', to: 'mg/dL', factor: 1 / 0.0555 },
  ],
  phosphorus: [
    { from: 'mg/dL', to: 'mmol/L', factor: 0.3229 },
    { from: 'mmol/L', to: 'mg/dL', factor: 1 / 0.3229 },
  ],
  calcium: [
    { from: 'mg/dL', to: 'mmol/L', factor: 0.25 },
    { from: 'mmol/L', to: 'mg/dL', factor: 1 / 0.25 },
  ],
  total_protein: [
    { from: 'g/dL', to: 'g/L', factor: 10 },
    { from: 'g/L', to: 'g/dL', factor: 0.1 },
  ],
  albumin: [
    { from: 'g/dL', to: 'g/L', factor: 10 },
    { from: 'g/L', to: 'g/dL', factor: 0.1 },
  ],
};

/**
 * Gets the canonical (preferred) unit for a parameter.
 */
export function getCanonicalUnit(parameter: string): string {
  switch (parameter) {
    case 'creatinine': return 'mg/dL';
    case 'bun': return 'mg/dL';
    case 'glucose': return 'mg/dL';
    case 'phosphorus': return 'mg/dL';
    case 'calcium': return 'mg/dL';
    case 'total_protein': return 'g/dL';
    case 'albumin': return 'g/dL';
    case 'sdma': return 'μg/dL';
    case 'urine_specific_gravity': return '';
    default: return '';
  }
}

/**
 * Converts a value from one unit to another for a specific parameter.
 */
export function convertValue(
  value: number,
  fromUnit: string,
  toUnit: string,
  parameter: string
): number {
  if (fromUnit === toUnit) return value;

  const paramConversions = CONVERSIONS[parameter];
  if (!paramConversions) return value;

  const conversion = paramConversions.find(
    (c) => c.from.toLowerCase() === fromUnit.toLowerCase() && 
           c.to.toLowerCase() === toUnit.toLowerCase()
  );

  if (conversion) {
    return Number((value * conversion.factor).toFixed(2));
  }

  return value;
}

/**
 * Normalizes a value to the canonical unit for that parameter.
 */
export function normalizeValue(
  value: number,
  unit: string,
  parameter: string
): { value: number; unit: string; wasConverted: boolean } {
  const canonicalUnit = getCanonicalUnit(parameter);
  if (!canonicalUnit || unit === canonicalUnit) {
    return { value, unit, wasConverted: false };
  }

  const convertedValue = convertValue(value, unit, canonicalUnit, parameter);
  const wasConverted = convertedValue !== value;

  return {
    value: convertedValue,
    unit: wasConverted ? canonicalUnit : unit,
    wasConverted,
  };
}
