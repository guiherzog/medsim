/**
 * Whether the dev-only login bypass may be shown/used. NODE_ENV alone isn't
 * enough: Next.js sets it to "production" for both Vercel preview and
 * production builds, which would hide the bypass on preview deployments too.
 * VERCEL_ENV distinguishes them ("preview" vs "production"), so the bypass
 * stays available on preview deployments and local dev, but never on a real
 * production build (local `next start` or Vercel's production target).
 */
export function isDevLoginAllowed() {
  if (process.env.VERCEL_ENV) return process.env.VERCEL_ENV !== "production";
  return process.env.NODE_ENV !== "production";
}
