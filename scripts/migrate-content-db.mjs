import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";

const dbPath = join(process.cwd(), "data", "content.db");
mkdirSync(dirname(dbPath), { recursive: true });

const contentMigrationPath = join(process.cwd(), "db", "migrations", "001_create_public_content.sql");
const contentSql = readFileSync(contentMigrationPath, "utf8");
const adminMigrationPath = join(process.cwd(), "db", "migrations", "002_create_admin_foundation.sql");
const adminSql = readFileSync(adminMigrationPath, "utf8");
const seoMigrationPath = join(process.cwd(), "db", "migrations", "003_create_seo_settings.sql");
const seoSql = readFileSync(seoMigrationPath, "utf8");
const cacheMigrationPath = join(process.cwd(), "db", "migrations", "004_create_cache_management.sql");
const cacheSql = readFileSync(cacheMigrationPath, "utf8");
const systemControlsMigrationPath = join(process.cwd(), "db", "migrations", "005_create_system_controls.sql");
const systemControlsSql = readFileSync(systemControlsMigrationPath, "utf8");

const db = new Database(dbPath);
db.exec(contentSql);
db.exec(adminSql);
db.exec(seoSql);
db.exec(cacheSql);
db.exec(systemControlsSql);

const hasUpdatedByRow = db
  .prepare("SELECT COUNT(*) AS count FROM pragma_table_info('public_content_v1') WHERE name = 'updated_by'")
  .get();
const hasUpdatedBy = Number(hasUpdatedByRow.count) > 0;
if (!hasUpdatedBy) {
  db.exec("ALTER TABLE public_content_v1 ADD COLUMN updated_by TEXT NOT NULL DEFAULT 'system';");
}

db.close();

console.log(`Migrated databases at ${dbPath}`);
