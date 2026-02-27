import { readFileSync } from "node:fs";
import { join } from "node:path";

import { ADMIN_DATA_PATH } from "@/lib/auth/constants";

type AdminSeed = {
  email: string;
  passwordHash: string;
};

function isValidSeed(seed: Partial<AdminSeed>): seed is AdminSeed {
  return Boolean(seed.email && seed.passwordHash);
}

export function getSeededAdminUser(): AdminSeed {
  const fromEnvEmail = process.env.ADMIN_EMAIL;
  const fromEnvHash = process.env.ADMIN_PASSWORD_HASH;
  if (fromEnvEmail && fromEnvHash) {
    return { email: fromEnvEmail.toLowerCase(), passwordHash: fromEnvHash };
  }

  const path = join(process.cwd(), ADMIN_DATA_PATH);
  const file = readFileSync(path, "utf8");
  const parsed = JSON.parse(file) as Partial<AdminSeed>;

  if (!isValidSeed(parsed)) {
    throw new Error("Seeded admin user is invalid. Run npm run seed:admin.");
  }

  return { email: parsed.email.toLowerCase(), passwordHash: parsed.passwordHash };
}
