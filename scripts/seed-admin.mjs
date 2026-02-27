import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomBytes, scryptSync } from "node:crypto";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const role = process.env.ADMIN_ROLE || "SUPER_ADMIN";
const status = process.env.ADMIN_STATUS || "active";
const mfaEnabled = process.env.ADMIN_MFA_ENABLED ? process.env.ADMIN_MFA_ENABLED === "true" : true;

if (!email || !password) {
  console.error("Missing ADMIN_EMAIL or ADMIN_PASSWORD.");
  console.error("Usage: ADMIN_EMAIL=admin@site.nl ADMIN_PASSWORD='strong-pass' npm run seed:admin");
  process.exit(1);
}

if (password.length < 12) {
  console.error("ADMIN_PASSWORD must be at least 12 characters.");
  process.exit(1);
}

const N = 16384;
const r = 8;
const p = 1;
const keylen = 64;
const salt = randomBytes(16).toString("base64");
const hash = scryptSync(password, salt, keylen, { N, r, p }).toString("base64");
const passwordHash = ["scrypt", N, r, p, keylen, salt, hash].join("$");

const outputPath = join(process.cwd(), "data", "admin-user.json");
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(
  outputPath,
  JSON.stringify(
    {
      email: email.trim().toLowerCase(),
      passwordHash,
      role,
      status,
      mfaEnabled
    },
    null,
    2
  )
);

console.log(`Seeded admin user at ${outputPath}`);
