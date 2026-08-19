import { isNonProductionDeployment } from "@/lib/env";

/**
 * Whether the dev-only login bypass may be shown/used — everywhere except a
 * real production deployment. See lib/env.ts for why NODE_ENV isn't enough.
 */
export function isDevLoginAllowed() {
  return isNonProductionDeployment();
}
