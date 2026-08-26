// Genera supabase/seed.sql a partir de src/lib/calculos/seed-data.ts
// (evita errores manuales y garantiza paridad con el programa legacy).
import { execFileSync } from "node:child_process";
import { readdirSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);

function findEsbuild() {
  const pnpmDir = join(root, "node_modules", ".pnpm");
  if (!existsSync(pnpmDir)) return null;
  for (const entry of readdirSync(pnpmDir)) {
    if (entry.startsWith("@esbuild+win32-x64")) {
      const bin = join(pnpmDir, entry, "node_modules", "@esbuild", "win32-x64", "esbuild.exe");
      if (existsSync(bin)) return bin;
    }
  }
  return null;
}

const esbuild = findEsbuild();
if (!esbuild) throw new Error("esbuild no encontrado");

const outFile = join(root, "dist-test", "seed-data.cjs");
mkdirSync(dirname(outFile), { recursive: true });

execFileSync(esbuild, [
  join(root, "src", "lib", "calculos", "seed-data.ts"),
  "--bundle",
  "--platform=node",
  "--format=cjs",
  `--outfile=${outFile}`,
], { stdio: "inherit" });

const { TODAS_LAS_TARIFAS } = require(outFile);

function esc(v) {
  return v.replace(/'/g, "''");
}

let sql = `-- db/seed.sql: tarifas del cotizador J&S (generado automaticamente por scripts/generate-seed.mjs)
-- Fuente: seed_data.py del programa cotizador (paridad 1:1)

INSERT INTO tarifas (plan, tipo, nivel_ingreso, regimen_tributario, num_comprobantes, num_trabajadores, regimen_laboral, monto, version) VALUES\n`;

const values = TODAS_LAS_TARIFAS.map(
  (f) =>
    `('${esc(f.plan)}','${esc(f.tipo)}','${esc(f.nivel_ingreso)}','${esc(f.regimen_tributario)}','${esc(f.num_comprobantes)}','${esc(f.num_trabajadores)}','${esc(f.regimen_laboral)}',${f.monto},'2026')`,
);
sql += values.join(",\n") + ";\n";

const dbDir = join(root, "db");
mkdirSync(dbDir, { recursive: true });
writeFileSync(join(dbDir, "seed.sql"), sql);
console.log(`✓ generado db/seed.sql (${TODAS_LAS_TARIFAS.length} tarifas)`);
