// Runner de tests del motor de cálculo y de generación DOCX.
// Usa esbuild vía npx (no es dependencia del proyecto) para no romper el build en Vercel.
import { execSync, spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(root, "dist-test");
mkdirSync(outDir, { recursive: true });
const q = (s) => `"${s.replace(/"/g, '""')}"`;

const suites = ["motor", "docx"];

for (const suite of suites) {
  const outFile = join(outDir, `${suite}.test.cjs`);
  console.log(`→ Bundleando tests/${suite}.test.ts con esbuild (vía npx)...`);
  execSync(
    `npx --yes esbuild@0.28.2 ${q(join(root, "tests", `${suite}.test.ts`))} --bundle --platform=node --format=cjs --outfile=${q(outFile)}`,
    { stdio: "inherit" },
  );

  console.log(`→ Ejecutando tests de ${suite}...`);
  const res = spawnSync(process.execPath, [outFile], { stdio: "inherit", cwd: root });
  if (res.status !== 0) process.exit(res.status ?? 1);
}
