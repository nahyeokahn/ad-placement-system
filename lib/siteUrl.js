// Always redirect magic links back to the canonical production URL.
// Falls back to window.location.origin only when the env var is missing
// (e.g. local dev without .env.local), so links generated locally keep
// working locally.
export function getSiteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}
