import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// Vitest doesn't auto-load .env.local the way Next.js does; populate
// process.env from it manually so integration tests can reach the live
// Supabase project without a separate env-loading flag.
const envPath = path.join(__dirname, "../../.env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !(match[1] in process.env)) {
      process.env[match[1]] = match[2];
    }
  }
}
