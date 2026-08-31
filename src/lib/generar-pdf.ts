"use client";

import type { InputPDF } from "@/components/pdf/cotizacion-pdf";

export async function generarPDF(input: InputPDF) {
  const { renderPdfBlob } = await import("@/components/pdf/cotizacion-pdf");
  const blob = await renderPdfBlob(input);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Cotización ${input.numero} - Plan ${input.plan} - ${input.razon_social}.pdf`.replace(/[\\/:*?"<>|]/g, "-");
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
