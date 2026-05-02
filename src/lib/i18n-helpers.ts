import { type TFunction } from 'i18next';

/**
 * Gets the translated label for a lab parameter.
 * If the parameter is canonical, it uses the translation from the lab.parameters namespace.
 * Otherwise, it falls back to the original label from the lab report.
 * 
 * @param parameter The parameter key (canonical or snake_case custom)
 * @param originalLabel The original label from the lab report
 * @param t i18next translation function
 */
export function getParameterLabel(
  parameter: string,
  originalLabel: string,
  t: TFunction
): string {
  const translationKey = `lab.parameters.${parameter}`;
  const translated = t(translationKey);

  // i18next returns the key itself if no translation is found
  if (translated === translationKey) {
    // For non-canonical parameters, use the original label
    // or humanize the parameter string if originalLabel is missing
    return originalLabel || parameter.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  return translated;
}
