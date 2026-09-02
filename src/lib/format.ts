export function formatMonto(valor: number): string {
  return `S/ ${valor.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatMontoSinMoneda(valor: number): string {
  return valor.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseMonto(valor: string): number {
  const cleaned = valor.replace(/[^0-9.,-]/g, "");
  let normalized = cleaned;
  if (cleaned.includes(",") && cleaned.includes(".")) {
    normalized = cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")
      ? cleaned.replace(/\./g, "").replace(",", ".")
      : cleaned.replace(/,/g, "");
  } else if (cleaned.includes(",")) {
    normalized = cleaned.replace(",", ".");
  }
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

export function formatFecha(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).padStart(4, "0");
  return `${dd}/${mm}/${yy}`;
}

export function hoy(): string {
  return formatFecha(new Date());
}

export function cn(...clases: (string | false | null | undefined)[]): string {
  return clases.filter(Boolean).join(" ");
}

function sanitizeArchivo(s: string): string {
  return s.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim().slice(0, 80) || "—";
}

export function normalizaNumeroArchivo(v: string): string {
  const raw = String(v ?? "").trim();
  if (!raw) return `0001-${new Date().getFullYear()}`;
  if (/^\d{1,6}-\d{4}$/.test(raw)) {
    const [n, y] = raw.split("-");
    // Mantener 4 dígitos (spec 000xyz -> si quieren 6, cambia padStart a 6)
    return `${n.padStart(4, "0")}-${y}`;
  }
  const digits = raw.replace(/\D/g, "");
  if (digits) return `${digits.padStart(4, "0")}-${new Date().getFullYear()}`;
  return raw;
}

export function nombreArchivoCotizacion(
  numero: string,
  razonSocial: string,
  servicio: string,
  ext: string = "docx",
): string {
  const num = normalizaNumeroArchivo(numero);
  const emp = sanitizeArchivo(razonSocial);
  const serv = sanitizeArchivo(servicio);
  // Formato solicitado: cotizacion 000xyz-2026 - NOMBRE EMPRESA - NOMBRE SERVICIO
  return `cotizacion ${num} - ${emp} - ${serv}.${ext}`.replace(/[\\/:*?"<>|]/g, "-");
}
