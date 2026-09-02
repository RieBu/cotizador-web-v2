import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { requireAuth } from "@/lib/route";
import { generarDocx, type DatosDocx } from "@/lib/docx";

const execFileAsync = promisify(execFile);

// Conversión DOCX -> PDF (mismo motor de layout que Word):
// - Producción (Linux/Vercel self-hosted): LibreOffice headless.
// - Local (Windows con Word instalado): Word COM vía PowerShell.
async function convertToPdf(inPath: string, outPdf: string, dir: string): Promise<boolean> {
  // 1) LibreOffice / OpenOffice
  const loBinaries = [
    "soffice",
    "libreoffice",
    "/usr/bin/libreoffice",
    "/usr/bin/soffice",
    "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
    "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
  ];
  for (const bin of loBinaries) {
    try {
      await execFileAsync(bin, ["--headless", "--convert-to", "pdf", "--outdir", dir, inPath], {
        timeout: 60_000,
        windowsHide: true,
      });
      return true;
    } catch {
      /* probar siguiente binario */
    }
  }

  // 2) Fallback Windows: Microsoft Word (COM) -> PDF (formato 17)
  if (process.platform === "win32") {
    const psScript = [
      `$ErrorActionPreference='Stop'`,
      `$word = New-Object -ComObject Word.Application`,
      `$word.Visible = $false`,
      `$doc = $word.Documents.Open('${inPath.replace(/'/g, "''")}', $false, $true)`,
      `$doc.SaveAs([ref]'${outPdf.replace(/'/g, "''")}', [ref]17)`,
      `$doc.Close($false)`,
      `$word.Quit()`,
      `[System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null`,
    ].join("; ");
    try {
      await execFileAsync(
        "powershell",
        ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", psScript],
        { timeout: 60_000, windowsHide: true },
      );
      return true;
    } catch {
      /* fallthrough */
    }
  }

  return false;
}

// Vista previa REAL del mismo .docx de "Descargar": se genera el buffer idéntico
// y se convierte a PDF con LibreOffice headless para que medidas/alineación/
// membrete superior+inferior y paginación queden tal cual Word.
export const POST = requireAuth(async (_user, req) => {
  const body = (await req.json()) as DatosDocx;
  if (!body.plan || !body.razon_social) {
    return NextResponse.json({ error: "Faltan datos para generar el documento" }, { status: 400 });
  }

  const docxBuf = await generarDocx(body);

  const dir = await mkdtemp(join(tmpdir(), "jys-preview-"));
  const inPath = join(dir, "cotizacion.docx");
  const outPdf = join(dir, "cotizacion.pdf");
  try {
    await writeFile(inPath, docxBuf);

    const converted = await convertToPdf(inPath, outPdf, dir);
    if (!converted) {
      return NextResponse.json(
        {
          error:
            "No se pudo convertir a PDF para la vista previa. Instale LibreOffice (soffice) en el servidor (producción) o Microsoft Word (local) para generar una vista previa idéntica al Word.",
        },
        { status: 500 },
      );
    }

    const pdfBuf = await readFile(outPdf);
    return new NextResponse(new Uint8Array(pdfBuf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="cotizacion-preview.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
});
