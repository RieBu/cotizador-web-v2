// Migración: "Empresarial 2026" → "Empresarial CTP" + clon de contabilidad para "Empresarial CT".
// Idempotente: re-ejecutar es seguro.
import { readFileSync } from "node:fs";
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
  // process.env tiene prioridad para poder apuntar la migración a otro entorno
  // (ej. producción): DATABASE_URL="..." node scripts/migrate-empresarial-ct.mjs
  return process.env[key] ?? envLocal ?? null;
}

const DATABASE_URL = env("DATABASE_URL");
if (!DATABASE_URL) {
  console.error("DATABASE_URL no encontrada en .env.local");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

const sql = `
update tarifas set plan = 'Empresarial CTP' where plan = 'Empresarial 2026';

insert into tarifas (plan, tipo, nivel_ingreso, regimen_tributario, num_comprobantes, num_trabajadores, regimen_laboral, monto, version)
select 'Empresarial CT', t.tipo, t.nivel_ingreso, t.regimen_tributario, t.num_comprobantes, t.num_trabajadores, t.regimen_laboral, t.monto, t.version
from tarifas t
where t.plan = 'Empresarial CTP' and t.tipo = 'contabilidad'
and not exists (
  select 1 from tarifas x
  where x.plan = 'Empresarial CT'
    and x.tipo = t.tipo
    and coalesce(x.nivel_ingreso,'') = coalesce(t.nivel_ingreso,'')
    and coalesce(x.regimen_tributario,'') = coalesce(t.regimen_tributario,'')
    and coalesce(x.num_comprobantes,'') = coalesce(t.num_comprobantes,'')
    and coalesce(x.num_trabajadores,'') = coalesce(t.num_trabajadores,'')
    and coalesce(x.regimen_laboral,'') = coalesce(t.regimen_laboral,'')
);
`;

try {
  const res = await pool.query(sql);
  console.log("✓ migración Empresarial CT/CTP aplicada");
  console.log(`  - Empresarial CTP tarifas: ${(await pool.query("select count(*)::int c from tarifas where plan='Empresarial CTP'")).rows[0].c}`);
  console.log(`  - Empresarial CT tarifas: ${(await pool.query("select count(*)::int c from tarifas where plan='Empresarial CT'")).rows[0].c}`);
  console.log(`  - Empresarial 2026 restantes: ${(await pool.query("select count(*)::int c from tarifas where plan='Empresarial 2026'")).rows[0].c}`);
} catch (err) {
  console.error("ERROR:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}