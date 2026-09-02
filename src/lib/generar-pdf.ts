"use client";

import type { InputPDF } from "@/components/pdf/cotizacion-pdf";
import { nombreArchivoCotizacion } from "@/lib/format";

export async function generarPDF(input: InputPDF) {
  const { renderPdfBlob } = await import("@/components/pdf/cotizacion-pdf");
  const blob = await renderPdfBlob(input);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivoCotizacion(input.numero, input.razon_social, input.plan, "pdf");
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
