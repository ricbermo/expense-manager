// Change this to your own email, or set ALLOWED_USER_EMAIL in your environment
export const FALLBACK_ALLOWED_USER_EMAIL = "your-email@example.com";

export function getAllowedUserEmail() {
  return (process.env.ALLOWED_USER_EMAIL ?? FALLBACK_ALLOWED_USER_EMAIL)
    .trim()
    .toLowerCase();
}

export function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

export function isAllowedUserEmail(
  email: string | null | undefined,
  allowedEmail = FALLBACK_ALLOWED_USER_EMAIL,
) {
  return normalizeEmail(email) === normalizeEmail(allowedEmail);
}
