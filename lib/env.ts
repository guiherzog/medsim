/**
 * True on local dev and on Vercel preview deployments; false on a real
 * production deployment. NODE_ENV alone can't tell preview from production —
 * Next sets it to "production" for both — so VERCEL_ENV decides when present.
 */
export function isNonProductionDeployment() {
  if (process.env.VERCEL_ENV) return process.env.VERCEL_ENV !== "production";
  return process.env.NODE_ENV !== "production";
}
