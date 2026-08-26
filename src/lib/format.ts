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
  const limpio = valor.replace(/[^0-9.,-]/g, "").replace(",", ".");
  const n = parseFloat(limpio);
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
