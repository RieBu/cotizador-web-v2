// Genera db/seed.sql a partir de src/lib/calculos/seed-data.ts
// Usa esbuild vía npx (no es dependencia del proyecto) para no romper el build en Vercel.
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);

const outFile = join(root, "dist-test", "seed-data.cjs");
mkdirSync(dirname(outFile), { recursive: true });
const q = (s) => `"${s.replace(/"/g, '""')}"`;

execSync(`npx --yes esbuild@0.28.2 ${q(join(root, "src", "lib", "calculos", "seed-data.ts"))} --bundle --platform=node --format=cjs --outfile=${q(outFile)}`, {
  stdio: "inherit",
});

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

writeFileSync(join(root, "db", "seed.sql"), sql);
console.log(`✓ generado db/seed.sql (${TODAS_LAS_TARIFAS.length} tarifas)`);
