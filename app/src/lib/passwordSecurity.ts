export const MIN_PASSWORD_LENGTH = 10;

type PasswordValidationOptions = {
  email?: string | null;
  confirmPassword?: string | null;
  currentPassword?: string | null;
  requireCurrentDifference?: boolean;
};

export type PasswordRequirementCheck = {
  key: 'length' | 'case' | 'number' | 'email' | 'current' | 'confirm';
  label: string;
  passed: boolean;
};

function getEmailNameFragment(email?: string | null) {
  const normalizedEmail = normalizeEmailAddress(email);
  const localPart = normalizedEmail.split('@')[0] ?? '';
  const alphanumericLocalPart = localPart.replace(/[^a-z0-9]/g, '');

  return alphanumericLocalPart.length >= 3 ? alphanumericLocalPart : '';
}

export function normalizeEmailAddress(email?: string | null) {
  return email?.trim().toLowerCase() ?? '';
}

export function maskEmailAddress(email?: string | null) {
  const normalizedEmail = normalizeEmailAddress(email);
  if (!normalizedEmail.includes('@')) return normalizedEmail;

  const [localPart, domainPart] = normalizedEmail.split('@');
  const [domainName, ...domainSuffixParts] = domainPart.split('.');
  const visibleLocal = localPart.slice(0, Math.min(2, localPart.length));
  const visibleDomain = domainName.slice(0, Math.min(2, domainName.length));
  const maskedLocal = `${visibleLocal}${'*'.repeat(Math.max(1, localPart.length - visibleLocal.length))}`;
  const maskedDomain = `${visibleDomain}${'*'.repeat(Math.max(1, domainName.length - visibleDomain.length))}`;
  const domainSuffix = domainSuffixParts.length > 0 ? `.${domainSuffixParts.join('.')}` : '';

  return `${maskedLocal}@${maskedDomain}${domainSuffix}`;
}

export function getPasswordRequirementChecks(
  password: string,
  {
    email,
    confirmPassword,
    currentPassword,
    requireCurrentDifference = false,
  }: PasswordValidationOptions = {},
): PasswordRequirementCheck[] {
  const emailFragment = getEmailNameFragment(email);
  const normalizedPassword = password ?? '';
  const lowerPassword = normalizedPassword.toLowerCase();
  const checks: PasswordRequirementCheck[] = [
    {
      key: 'length',
      label: `At least ${MIN_PASSWORD_LENGTH} characters`,
      passed: normalizedPassword.length >= MIN_PASSWORD_LENGTH,
    },
    {
      key: 'case',
      label: 'Uppercase and lowercase letters',
      passed: /[A-Z]/.test(normalizedPassword) && /[a-z]/.test(normalizedPassword),
    },
    {
      key: 'number',
      label: 'At least one number',
      passed: /\d/.test(normalizedPassword),
    },
  ];

  if (emailFragment) {
    checks.push({
      key: 'email',
      label: 'Does not include your email name',
      passed: !lowerPassword.includes(emailFragment),
    });
  }

  if (requireCurrentDifference) {
    checks.push({
      key: 'current',
      label: 'Different from your current password',
      passed: normalizedPassword.length > 0 && normalizedPassword !== (currentPassword ?? ''),
    });
  }

  if (confirmPassword !== undefined) {
    checks.push({
      key: 'confirm',
      label: 'Password confirmation matches',
      passed: typeof confirmPassword === 'string' && confirmPassword.length > 0 && normalizedPassword === confirmPassword,
    });
  }

  return checks;
}

export function getPasswordStrengthScore(password: string) {
  const normalizedPassword = password ?? '';
  if (!normalizedPassword) return 0;

  const strengthSignals = [
    normalizedPassword.length >= MIN_PASSWORD_LENGTH,
    /[A-Z]/.test(normalizedPassword),
    /[a-z]/.test(normalizedPassword),
    /\d/.test(normalizedPassword),
    /[^A-Za-z0-9]/.test(normalizedPassword),
  ];

  const passedChecks = strengthSignals.filter(Boolean).length;
  return Math.round((passedChecks / strengthSignals.length) * 100);
}

export function getPasswordValidationMessage(
  password: string,
  options: PasswordValidationOptions = {},
) {
  const failedCheck = getPasswordRequirementChecks(password, options).find((check) => !check.passed);

  if (!failedCheck) return '';

  switch (failedCheck.key) {
    case 'length':
      return `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`;
    case 'case':
      return 'Include both uppercase and lowercase letters in your password.';
    case 'number':
      return 'Include at least one number in your password.';
    case 'email':
      return 'Avoid using your email name inside your password.';
    case 'current':
      return 'Choose a new password that is different from your current password.';
    case 'confirm':
      return 'Passwords do not match.';
    default:
      return 'Please choose a stronger password.';
  }
}

export function isPasswordStrongEnough(password: string, options: PasswordValidationOptions = {}) {
  return getPasswordValidationMessage(password, options) === '';
}
