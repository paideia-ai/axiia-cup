/** Do not normalize a secret into a different registration code. */
export function validA6RegistrationCode(value: string | undefined): boolean {
  return value === undefined ||
    (value.length >= 8 && value.length <= 256 &&
      !/[\s\p{Cc}\p{Cf}]/u.test(value))
}

export function a6SignupInputError(config: {
  registrationCode?: string
  adminEmail: string
  adminPassword: string
  adminTotpSecret: string
}, resume = false): string | undefined {
  if (!validA6RegistrationCode(config.registrationCode)) {
    return 'invalid-supplied-registration-code'
  }
  if (config.registrationCode !== undefined) {
    if (resume) return 'registration-code-not-allowed-on-resume'
    if (config.adminEmail || config.adminPassword || config.adminTotpSecret) {
      return 'registration-code-and-admin-credentials-are-exclusive'
    }
  } else if (
    !resume &&
    (!config.adminEmail || !config.adminPassword || !config.adminTotpSecret)
  ) return 'fresh-run-admin-credentials-or-registration-code-required'
}
