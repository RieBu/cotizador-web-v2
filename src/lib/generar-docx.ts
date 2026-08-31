"use client";

import type { DatosDocx } from "@/lib/docx";

async function postDocx(input: DatosDocx): Promise<Blob> {
  const res = await fetch("/api/cotizaciones/docx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "No se pudo generar el documento");
  }
  return res.blob();
}

export async function descargarDocx(input: DatosDocx): Promise<void> {
  const blob = await postDocx(input);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Cotización ${input.numero} - Plan ${input.plan} - ${input.razon_social}.docx`.replace(/[\\/:*?"<>|]/g, "-");
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function obtenerBlobDocx(input: DatosDocx): Promise<Blob> {
  return postDocx(input);
}
