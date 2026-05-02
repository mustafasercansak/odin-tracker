/**
 * Maps Firebase Auth error codes to i18n translation keys.
 * Used in Login and Register screens to show localized error messages.
 * 
 * @param code Firebase error code (e.g., 'auth/user-not-found')
 * @returns i18n key (e.g., 'auth.errors.user-not-found')
 */
export function mapAuthCodeToMessage(code: string): string {
  const cleanCode = code.replace('auth/', '');
  
  const knownCodes = [
    'user-not-found',
    'wrong-password',
    'email-already-in-use',
    'weak-password',
    'invalid-email',
    'network-request-failed',
    'too-many-requests'
  ];

  if (knownCodes.includes(cleanCode)) {
    return `auth.errors.${cleanCode}`;
  }

  // Fallback to a generic error message
  return 'common.toasts.error';
}
