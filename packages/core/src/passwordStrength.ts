export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  suggestions: string[];
}

/**
 * Pure, zero-dependency password strength scorer.
 *
 * Scoring rules:
 *  +1  length >= minLength (default 8)
 *  +1  length >= 12
 *  +1  3+ character classes (uppercase, lowercase, digit, special)
 *  +1  length >= 16  OR  all 4 character classes present
 */
export function passwordStrength(password: string, minLength?: number): PasswordStrength {
  const min = minLength ?? 8;
  let score = 0;
  const suggestions: string[] = [];

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const classes = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;

  // +1 meets minimum length
  if (password.length >= min) score++;
  else suggestions.push(`Use at least ${min} characters`);

  // +1 length >= 12
  if (password.length >= 12) score++;
  else if (password.length >= min) suggestions.push('Use 12+ characters for a stronger password');

  // +1 three or more character classes
  if (classes >= 3) score++;
  else {
    if (!hasUpper) suggestions.push('Add uppercase letters');
    if (!hasLower) suggestions.push('Add lowercase letters');
    if (!hasDigit) suggestions.push('Add numbers');
    if (!hasSpecial) suggestions.push('Add special characters');
  }

  // +1 length >= 16 OR all 4 classes
  if (password.length >= 16 || classes === 4) score++;
  else if (classes >= 3 && password.length < 16) suggestions.push('Use 16+ characters or add all character types');

  const labels = ['very_weak', 'weak', 'fair', 'strong', 'very_strong'] as const;

  return { score: score as PasswordStrength['score'], label: labels[score], suggestions };
}
