import type { Dictionary } from '@/dictionaries'

// Keep these checks aligned with the strong password rule in
// backend/src/modules/auth/auth.validator.ts. Messages come from the shared
// dictionary so they stay consistent across every surface that validates a
// password and can never drift from the translations.
export function getPasswordValidationError(
  password: string,
  dict: Dictionary,
): string | null {
  const rules = dict.auth.passwordRules
  if (password.length < 8) return rules.minLength
  if (!/[A-Z]/.test(password)) return rules.uppercase
  if (!/[a-z]/.test(password)) return rules.lowercase
  if (!/\d/.test(password)) return rules.digit
  if (!/[@$!%*?&]/.test(password)) return rules.special
  if (/[^A-Za-z\d@$!%*?&]/.test(password)) return rules.allowedCharacters
  return null
}