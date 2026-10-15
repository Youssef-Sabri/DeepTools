import type { Dictionary } from '@/dictionaries'

// Validates password strength against dictionary error messages
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