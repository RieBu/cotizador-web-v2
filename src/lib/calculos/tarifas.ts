import type { TarifaFila } from "./types";

export type ClaveTarifa = [string, string, string, string, string, string];

export type TarifaIndex = Record<string, Partial<Record<string, number>>>;

export function buildIndex(filas: TarifaFila[]): TarifaIndex {
  const index: TarifaIndex = {};
  for (const f of filas) {
    if (!index[f.plan]) index[f.plan] = {};
    const key = claveTarifa(f);
    index[f.plan][key] = f.monto;
  }
  return index;
}

function claveTarifa(f: TarifaFila): string {
  return JSON.stringify([
    f.tipo,
    f.nivel_ingreso,
    f.regimen_tributario,
    f.num_comprobantes,
    f.num_trabajadores,
    f.regimen_laboral,
  ]);
}

export function buscarMonto(
  tarifasPlan: Partial<Record<string, number>>,
  tipo: string,
  nivel_ingreso = "",
  regimen_tributario = "",
  num_comprobantes = "",
  num_trabajadores = "",
  regimen_laboral = "",
): number | undefined {
  const key = JSON.stringify([
    tipo,
    nivel_ingreso,
    regimen_tributario,
    num_comprobantes,
    num_trabajadores,
    regimen_laboral,
  ]);
  return tarifasPlan[key];
}
