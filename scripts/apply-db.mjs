// Ejecuta db/schema.sql y db/seed.sql contra DATABASE_URL (de .env.local).
import { readFileSync, createReadStream, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;
const root = dirname(dirname(fileURLToPath(import.meta.url)));

function env(key) {
  const envLocal = (() => {
    try {
      const txt = readFileSync(join(root, ".env.local"), "utf8");
      for (const line of txt.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)=(.*)$/);
        if (m && m[1] === key) return m[2].trim();
      }
    } catch {
      /* ignore */
    }
    return null;
  })();
  return envLocal ?? process.env[key] ?? null;
}

const DATABASE_URL = env("DATABASE_URL");
if (!DATABASE_URL) {
  console.error("DATABASE_URL no encontrada en .env.local");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run(file) {
  const sql = readFileSync(join(root, file), "utf8");
  console.log(`→ aplicando ${file} (${sql.length} chars)...`);
  await pool.query(sql);
  console.log(`✓ completado ${file}`);
}

try {
  await run("db/schema.sql");
  await run("db/seed.sql");
  console.log("✓ esquema y seed aplicados correctamente");
} catch (err) {
  console.error("ERROR:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
