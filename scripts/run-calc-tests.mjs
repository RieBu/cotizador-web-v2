// Runner de tests del motor de cálculo (paridad con el programa Python).
// Descubre el binario esbuild del store de pnpm y bundlea tests/motor.test.ts.
import { execFileSync, spawnSync } from "node:child_process";
import { readdirSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function findEsbuild() {
  const pnpmDir = join(root, "node_modules", ".pnpm");
  if (!existsSync(pnpmDir)) return null;
  for (const entry of readdirSync(pnpmDir)) {
    if (entry.startsWith("@esbuild+win32-x64")) {
      const bin = join(
        pnpmDir,
        entry,
        "node_modules",
        "@esbuild",
        "win32-x64",
        "esbuild.exe",
      );
      if (existsSync(bin)) return bin;
    }
  }
  return null;
}

const esbuild = findEsbuild() ?? "esbuild";
const outDir = join(root, "dist-test");
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, "motor.test.cjs");

console.log("→ Bundleando tests con esbuild...");
execFileSync(esbuild, [
  join(root, "tests", "motor.test.ts"),
  "--bundle",
  "--platform=node",
  "--format=cjs",
  `--outfile=${outFile}`,
], { stdio: "inherit" });

console.log("→ Ejecutando tests...");
const res = spawnSync(process.execPath, [outFile], { stdio: "inherit" });
process.exit(res.status ?? 1);
