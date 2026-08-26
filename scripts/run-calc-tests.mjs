// Runner de tests del motor de cálculo (paridad con el programa Python).
// Usa esbuild vía npx (no es dependencia del proyecto) para no romper el build en Vercel.
import { execSync, spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(root, "dist-test");
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, "motor.test.cjs");
const q = (s) => `"${s.replace(/"/g, '""')}"`;

console.log("→ Bundleando tests con esbuild (vía npx)...");
execSync(`npx --yes esbuild@0.28.2 ${q(join(root, "tests", "motor.test.ts"))} --bundle --platform=node --format=cjs --outfile=${q(outFile)}`, {
  stdio: "inherit",
});

console.log("→ Ejecutando tests...");
const res = spawnSync(process.execPath, [outFile], { stdio: "inherit" });
process.exit(res.status ?? 1);
