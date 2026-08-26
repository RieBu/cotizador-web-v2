// Motor de cálculo de cotizaciones — port 1:1 de motor_calculo.py
// Lógica INDEX/MATCH del Excel para los 9 planes de servicio.

import {
  buildIndex,
  buscarMonto,
  type TarifaIndex,
} from "./tarifas";
import { TODAS_LAS_TARIFAS } from "./seed-data";
import type { ParamsCotizacion, ResultadoCotizacion, Servicio } from "./types";

// ---------------------------------------------------------------------------
// NIVELES DE INGRESO (orden de tarifario)
// ---------------------------------------------------------------------------
export const ORDEN_INGRESOS = [
  "Hasta S/5,000",
  "Hasta S/8,000",
  "Hasta S/10,000",
  "Hasta S/20,000",
  "Hasta S/30,000",
  "Hasta S/40,000",
  "Hasta S/50,000",
  "Hasta S/80,000",
  "Hasta S/100,000",
  "Hasta S/150,000",
  "Hasta S/200,000",
  "Hasta S/250,000",
  "Hasta S/300,000",
  "Hasta S/500,000",
  "Hasta S/700,000",
  "Hasta S/1,000,000",
  "Desde S/1,000,000",
  "Desde S/1,100,000",
];

export const ORDEN_TRABAJADORES = [
  "Hasta 2 trabajadores",
  "Hasta 5 trabajadores",
  "Hasta 10 trabajadores",
  "Hasta 15 trabajadores",
  "Hasta 20 trabajadores",
  "Hasta 25 trabajadores",
  "Hasta 30 trabajadores",
];

// ---------------------------------------------------------------------------
// LISTAS DE OPCIONES DE UI (espejo de main_window.py)
// ---------------------------------------------------------------------------
export const NIVELES_INGRESO = [
  "Hasta S/5,000",
  "Hasta S/8,000",
  "Hasta S/10,000",
  "Hasta S/20,000",
  "Hasta S/30,000",
  "Hasta S/40,000",
  "Hasta S/50,000",
  "Hasta S/80,000",
  "Hasta S/100,000",
  "Hasta S/150,000",
  "Hasta S/200,000",
  "Hasta S/250,000",
  "Hasta S/300,000",
  "Hasta S/500,000",
  "Hasta S/700,000",
  "Hasta S/1,000,000",
  "Desde S/1,000,000",
  "Desde S/1,100,000",
];

export const NIVELES_EMPRESARIAL_2026 = [
  "Hasta S/30,000",
  "Hasta S/50,000",
  "Hasta S/70,000",
  "Hasta S/100,000",
  "Hasta S/150,000",
  "Hasta S/250,000",
  "Hasta S/300,000",
  "Hasta S/500,000",
  "Hasta S/700,000",
  "Hasta S/1,000,000",
  "Desde S/1,000,000",
];

export const NIVELES_INTEGRAL = [
  "Hasta S/10,000",
  "Hasta S/20,000",
  "Hasta S/40,000",
  "Hasta S/50,000",
  "Hasta S/100,000",
  "Hasta S/150,000",
  "Hasta S/250,000",
  "Hasta S/300,000",
  "Hasta S/500,000",
  "Hasta S/700,000",
  "Hasta S/1,000,000",
  "Desde S/1,000,000",
];

export const NIVELES_RER = [
  "Hasta S/10,000",
  "Hasta S/20,000",
  "Hasta S/40,000",
];

export const COMPROBANTES_RER = ["100", "200"];
export const NUM_TRABAJADORES_RER = [
  "Hasta 2 trabajadores",
  "Hasta 5 trabajadores",
  "Hasta 10 trabajadores",
];

export const NIVELES_PDT_RUS = ["Hasta S/5,000", "Hasta S/8,000"];
export const NIVELES_PDT_ESPECIAL = ["Hasta S/20,000", "Hasta S/30,000", "Hasta S/40,000"];
export const NIVELES_PDT_MYPE = [
  "Hasta S/20,000",
  "Hasta S/30,000",
  "Hasta S/40,000",
  "Hasta S/80,000",
  "Hasta S/100,000",
];
export const NUM_COMPROBANTES_PDT = [
  "Hasta 100 comprobantes",
  "Hasta 200 comprobantes",
  "Más de 200 comprobantes",
];

export const NUM_TRABAJADORES = [
  "Hasta 2 trabajadores",
  "Hasta 5 trabajadores",
  "Hasta 10 trabajadores",
  "Hasta 15 trabajadores",
  "Hasta 20 trabajadores",
  "Hasta 25 trabajadores",
  "Hasta 30 trabajadores",
];

export const TIPOS_EMPRESA = ["EIRL", "Firma"];

export const REG_LAB_SIN_BASE = ["Base", "Remype", "Pequena", "General"];
export const REG_LAB_CTP = ["Remype", "Pequena", "General"];

export const NIVELES_INTEGRAL_EXTERNO = [
  "Hasta S/40,000",
  "Hasta S/100,000",
  "Hasta S/200,000",
  "Hasta S/250,000",
  "Hasta S/300,000",
  "Hasta S/500,000",
  "Hasta S/1,000,000",
  "Desde S/1,100,000",
];

export const NUM_TRABAJADORES_EXTERNO = [
  "Hasta 5 trabajadores",
  "Hasta 10 trabajadores",
  "Hasta 15 trabajadores",
  "Hasta 20 trabajadores",
  "Hasta 30 trabajadores",
  "Hasta 40 trabajadores",
  "Hasta 50 trabajadores",
  "Hasta 80 trabajadores",
  "Hasta 100 trabajadores",
];

export const MAP_COMPROB: Record<string, string> = {
  "Hasta S/10,000": "100",
  "Hasta S/20,000": "200",
  "Hasta S/40,000": "200",
};

// ---------------------------------------------------------------------------
// PLANES y reglas
// ---------------------------------------------------------------------------
export const PLANES = [
  "Empresarial 2026",
  "Integral 2026",
  "Integral Externo",
  "Régimen Especial",
  "Declaración Express",
  "Registro de Marca",
  "Constitución de Empresa",
  "Asociación Pro Vivienda",
  "Asesoría Financiera",
];

export const REGIMENES_TRIBUTARIOS: Record<string, string[]> = {
  "Empresarial 2026": ["Mype", "General"],
  "Integral 2026": ["RUS", "Especial", "Mype", "General"],
  "Régimen Especial": ["Especial"],
  "Declaración Express": ["RUS", "Especial", "Mype"],
  "Integral Externo": [],
  "Registro de Marca": [],
  "Constitución de Empresa": [],
  "Asociación Pro Vivienda": [],
  "Asesoría Financiera": [],
};

export const REGIMENES_LABORALES: Record<string, string[]> = {
  "Empresarial 2026": ["Remype", "Pequena", "General"],
  "Integral 2026": ["Base", "Remype", "Pequena", "General"],
  "Régimen Especial": ["Remype"],
  "Declaración Express": [],
  "Integral Externo": [],
  "Registro de Marca": [],
  "Constitución de Empresa": [],
  "Asociación Pro Vivienda": [],
  "Asesoría Financiera": [],
};

// ---------------------------------------------------------------------------
// HELPERS DE BÚSQUEDA
// ---------------------------------------------------------------------------

function _calcularPlanilla(
  tarifasPlan: Partial<Record<string, number>>,
  num_trabajadores: string,
  regimen_laboral: string,
): number {
  if (regimen_laboral === "Pequena" || regimen_laboral === "General") {
    const montoRemype =
      buscarMonto(tarifasPlan, "planilla", "", "", "", num_trabajadores, "Remype") ?? 0;
    return regimen_laboral === "Pequena"
      ? Math.round(montoRemype * 1.5)
      : Math.round(montoRemype * 1.8);
  }
  return buscarMonto(tarifasPlan, "planilla", "", "", "", num_trabajadores, regimen_laboral) ?? 0;
}

function _monto(index: TarifaIndex, plan: string, tipo: string, params: {
  nivel?: string; rtrib?: string; comprob?: string; ntrab?: string; rlab?: string;
}): number {
  const planT = index[plan] ?? {};
  return buscarMonto(
    planT,
    tipo,
    params.nivel ?? "",
    params.rtrib ?? "",
    params.comprob ?? "",
    params.ntrab ?? "",
    params.rlab ?? "",
  ) ?? 0;
}

// ---------------------------------------------------------------------------
// CALCULADORES POR PLAN
// ---------------------------------------------------------------------------

function calcularEmpresarial2026(index: TarifaIndex, p: ParamsCotizacion): ResultadoCotizacion {
  const c = p.incluir_contabilidad ?? true;
  const pl = p.incluir_planilla ?? true;
  if (!c && !pl) throw new Error("Seleccione al menos un servicio");
  const planT = index["Empresarial 2026"] ?? {};
  const contabilidad = c
    ? buscarMonto(planT, "contabilidad", p.nivel_ingreso ?? "", p.regimen_tributario ?? "") ?? 0
    : 0;
  const planilla = pl ? _calcularPlanilla(planT, p.num_trabajadores ?? "", p.regimen_laboral ?? "") : 0;

  const servicios: Servicio[] = [];
  if (c) servicios.push({ descripcion: "Contabilidad Tributacion", monto: contabilidad });
  if (pl) servicios.push({ descripcion: "Planilla", monto: planilla });
  const subtotal = contabilidad + planilla;
  return { servicios, subtotal, total: subtotal, descuento_monto: 0 };
}

function calcularIntegral2026(index: TarifaIndex, p: ParamsCotizacion): ResultadoCotizacion {
  const c = p.incluir_contabilidad ?? true;
  const pl = p.incluir_planilla ?? true;
  const as = p.incluir_asesoria ?? true;
  if (!c && !pl && !as) throw new Error("Seleccione al menos un servicio");
  const planT = index["Integral 2026"] ?? {};
  const contabilidad = c
    ? buscarMonto(planT, "contabilidad", p.nivel_ingreso ?? "", p.regimen_tributario ?? "") ?? 0
    : 0;
  const planilla = pl ? _calcularPlanilla(planT, p.num_trabajadores ?? "", p.regimen_laboral ?? "") : 0;
  const asesoria = as
    ? buscarMonto(planT, "asesoria", p.nivel_ingreso ?? "") ?? 0
    : 0;

  const servicios: Servicio[] = [];
  if (c) servicios.push({ descripcion: "Contabilidad", monto: contabilidad });
  if (pl) servicios.push({ descripcion: "Planilla", monto: planilla });
  if (as) servicios.push({ descripcion: "Legal-Laboral", monto: asesoria });
  const subtotal = contabilidad + planilla + asesoria;
  return { servicios, subtotal, total: subtotal, descuento_monto: 0 };
}

function calcularRegimenEspecial(index: TarifaIndex, p: ParamsCotizacion): ResultadoCotizacion {
  const c = p.incluir_contabilidad ?? true;
  const pl = p.incluir_planilla ?? true;
  if (!c && !pl) throw new Error("Seleccione al menos un servicio");
  const planT = index["Régimen Especial"] ?? {};
  const contabilidad = c
    ? buscarMonto(planT, "contabilidad", p.nivel_ingreso ?? "", "Especial", p.num_comprobantes ?? "") ?? 0
    : 0;
  const planilla = pl
    ? buscarMonto(planT, "planilla", "", "", "", p.num_trabajadores ?? "", "Remype") ?? 0
    : 0;
  const servicios: Servicio[] = [];
  if (c) servicios.push({ descripcion: "Contabilidad RER", monto: contabilidad });
  if (pl) servicios.push({ descripcion: "Planilla", monto: planilla });
  const subtotal = contabilidad + planilla;
  return { servicios, subtotal, total: subtotal, descuento_monto: 0 };
}

function calcularDeclaracionExpress(index: TarifaIndex, p: ParamsCotizacion): ResultadoCotizacion {
  const planT = index["Declaración Express"] ?? {};
  const monto =
    buscarMonto(planT, "pdt", p.nivel_ingreso ?? "", p.regimen_tributario ?? "", p.num_comprobantes ?? "") ?? 0;
  let subtotal = monto;
  let planilla = 0;
  let montoFinal = monto;
  if (p.regimen_tributario === "RUS" && (p.incluir_planilla ?? true)) {
    planilla = buscarMonto(planT, "pdt_planilla", p.nivel_ingreso ?? "") ?? 0;
    if (planilla) {
      subtotal += planilla;
      montoFinal = subtotal;
    }
  }
  const servicios: Servicio[] = [{ descripcion: "Declaración Express", monto: montoFinal }];
  return { servicios, subtotal, total: subtotal, descuento_monto: 0, planilla_rus: planilla };
}

function calcularIntegralExterno(index: TarifaIndex, p: ParamsCotizacion): ResultadoCotizacion {
  const planT = index["Integral Externo"] ?? {};
  const contableLegal = buscarMonto(planT, "contable_legal", p.nivel_ingreso ?? "") ?? 0;
  const incluir = p.incluir_laboral ?? true;
  const laboral = incluir
    ? buscarMonto(planT, "laboral", "", "", "", p.num_trabajadores ?? "") ?? 0
    : 0;
  const servicios: Servicio[] = [{ descripcion: "Asesoría Integral Externa", monto: contableLegal }];
  let subtotal = contableLegal;
  if (incluir) {
    servicios.push({ descripcion: "Laboral", monto: laboral });
    subtotal += laboral;
  }
  return { servicios, subtotal, total: subtotal, descuento_monto: 0 };
}

function calcularRegistroMarca(): ResultadoCotizacion {
  return {
    servicios: [{ descripcion: "Servicio de registro de marca", monto: 1500 }],
    subtotal: 1500,
    total: 1500,
    descuento_monto: 0,
  };
}

function calcularConstitucionEmpresa(): ResultadoCotizacion {
  return {
    servicios: [{ descripcion: "CONSTITUCION DE EMPRESA", monto: 1000 }],
    subtotal: 1000,
    total: 1000,
    descuento_monto: 0,
  };
}

function calcularAsociacionVivienda(precioManual: number): ResultadoCotizacion {
  if (!precioManual || precioManual <= 0) throw new Error("Ingrese el precio de la Asociación");
  return {
    servicios: [{ descripcion: "Constitución de asociación", monto: precioManual }],
    subtotal: precioManual,
    total: precioManual,
    descuento_monto: 0,
  };
}

function calcularAsesoriaFinanciera(precioManual: number): ResultadoCotizacion {
  if (!precioManual || precioManual <= 0) throw new Error("Ingrese el precio de Asesoría Financiera");
  return {
    servicios: [{ descripcion: "Asesoría Financiera", monto: precioManual }],
    subtotal: precioManual,
    total: precioManual,
    descuento_monto: 0,
  };
}

// ---------------------------------------------------------------------------
// CALCULADOR PRINCIPAL
// ---------------------------------------------------------------------------

export function calcularCotizacion(params: ParamsCotizacion): ResultadoCotizacion {
  const plan = params.plan;
  const precioManual = params.precio_manual ?? 0;
  let resultado: Omit<ResultadoCotizacion, "descuento_monto">;

  switch (plan) {
    case "Empresarial 2026":
      resultado = calcularEmpresarial2026(indexActual, params);
      break;
    case "Integral 2026":
      resultado = calcularIntegral2026(indexActual, params);
      break;
    case "Régimen Especial":
      resultado = calcularRegimenEspecial(indexActual, params);
      break;
    case "Declaración Express":
      resultado = calcularDeclaracionExpress(indexActual, params);
      break;
    case "Integral Externo":
      resultado = calcularIntegralExterno(indexActual, params);
      break;
    case "Registro de Marca":
      resultado = calcularRegistroMarca();
      break;
    case "Constitución de Empresa":
      resultado = calcularConstitucionEmpresa();
      break;
    case "Asociación Pro Vivienda":
      resultado = calcularAsociacionVivienda(precioManual);
      break;
    case "Asesoría Financiera":
      resultado = calcularAsesoriaFinanciera(precioManual);
      break;
    default:
      throw new Error(`Plan no reconocido: ${plan}`);
  }

  const subtotal = resultado.subtotal;
  let total = subtotal;
  const descuento = params.descuento_monto ?? 0;
  if (descuento > 0) total = subtotal - descuento;

  return {
    servicios: resultado.servicios,
    subtotal,
    total: Math.max(total, 0),
    descuento_monto: descuento,
    planilla_rus: (resultado as ResultadoCotizacion).planilla_rus,
  };
}

// ---------------------------------------------------------------------------
// ÍNDICE ACTIVO (cargable desde DB; por defecto usa semilla con datos de referencia)
// ---------------------------------------------------------------------------
let indexActual: TarifaIndex = buildIndex(TODAS_LAS_TARIFAS);

export function setTarifaIndex(filas: import("./types").TarifaFila[]): void {
  indexActual = buildIndex(filas);
}

export function getTarifaIndex(): TarifaIndex {
  return indexActual;
}
