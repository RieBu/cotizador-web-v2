import { test } from "node:test";
import assert from "node:assert/strict";

import { calcularCotizacion } from "../src/lib/calculos/motor.ts";
import type { ResultadoCotizacion } from "../src/lib/calculos/types.ts";

function val(plan: string, extra: Record<string, unknown>): ResultadoCotizacion {
  return calcularCotizacion({ plan, nivel_ingreso: "", ...extra });
}

test("Empresarial 2026: Mype Hasta S/30,000 + Planilla Pequeña 2 = 500 + 150", () => {
  const r = val("Empresarial 2026", {
    nivel_ingreso: "Hasta S/30,000",
    regimen_tributario: "Mype",
    num_trabajadores: "Hasta 2 trabajadores",
    regimen_laboral: "Pequena",
    incluir_contabilidad: true,
    incluir_planilla: true,
  });
  assert.equal(r.subtotal, 500 + 150);
  assert.equal(r.servicios.length, 2);
});

test("Empresarial 2026: General Desde S/1,000,000 + Planilla General 30 = 2400 + 1800", () => {
  const r = val("Empresarial 2026", {
    nivel_ingreso: "Desde S/1,000,000",
    regimen_tributario: "General",
    num_trabajadores: "Hasta 30 trabajadores",
    regimen_laboral: "General",
    incluir_contabilidad: true,
    incluir_planilla: true,
  });
  assert.equal(r.subtotal, 2400 + 1800);
});

test("Empresarial 2026: Sola contabilidad (sin planilla)", () => {
  const r = val("Empresarial 2026", {
    nivel_ingreso: "Hasta S/50,000",
    regimen_tributario: "Mype",
    num_trabajadores: "Hasta 2 trabajadores",
    regimen_laboral: "Remype",
    incluir_contabilidad: true,
    incluir_planilla: false,
  });
  assert.equal(r.subtotal, 650);
  assert.equal(r.servicios.length, 1);
});

test("Integral 2026: Mype Hasta S/20,000 + Planilla Base 2 + Asesoría = 550 + 50 + 150", () => {
  const r = val("Integral 2026", {
    nivel_ingreso: "Hasta S/20,000",
    regimen_tributario: "Mype",
    num_trabajadores: "Hasta 2 trabajadores",
    regimen_laboral: "Base",
    incluir_contabilidad: true,
    incluir_planilla: true,
    incluir_asesoria: true,
  });
  assert.equal(r.subtotal, 550 + 50 + 150);
});

test("Integral 2026: RUS Hasta S/10,000 + Planilla Remype 2 = 100 + 100", () => {
  const r = val("Integral 2026", {
    nivel_ingreso: "Hasta S/10,000",
    regimen_tributario: "RUS",
    num_trabajadores: "Hasta 2 trabajadores",
    regimen_laboral: "Remype",
    incluir_contabilidad: true,
    incluir_planilla: true,
    incluir_asesoria: false,
  });
  assert.equal(r.subtotal, 100 + 100);
});

test("Régimen Especial: Hasta S/10,000 (100 comprob) + Planilla 2 = 200 + 100", () => {
  const r = val("Régimen Especial", {
    nivel_ingreso: "Hasta S/10,000",
    num_comprobantes: "100",
    num_trabajadores: "Hasta 2 trabajadores",
    incluir_contabilidad: true,
    incluir_planilla: true,
  });
  assert.equal(r.subtotal, 200 + 100);
});

test("Declaración Express: RUS Hasta S/5,000 100 comprob + planilla = 100 + 50", () => {
  const r = val("Declaración Express", {
    nivel_ingreso: "Hasta S/5,000",
    regimen_tributario: "RUS",
    num_comprobantes: "Hasta 100 comprobantes",
    incluir_planilla: true,
  });
  assert.equal(r.subtotal, 150);
  assert.equal(r.planilla_rus, 50);
});

test("Declaración Express: Mype Hasta S/100,000 200 comprob (sin planilla) = 220", () => {
  const r = val("Declaración Express", {
    nivel_ingreso: "Hasta S/100,000",
    regimen_tributario: "Mype",
    num_comprobantes: "Hasta 200 comprobantes",
    incluir_planilla: false,
  });
  assert.equal(r.subtotal, 220);
});

test("Integral Externo: Hasta S/100,000 + Laboral 5 = 1550 + 250", () => {
  const r = val("Integral Externo", {
    nivel_ingreso: "Hasta S/100,000",
    num_trabajadores: "Hasta 5 trabajadores",
    incluir_laboral: true,
  });
  assert.equal(r.subtotal, 1550 + 250);
});

test("Registro de Marca = 1500", () => {
  const r = val("Registro de Marca", {});
  assert.equal(r.subtotal, 1500);
});

test("Constitución de Empresa = 1000", () => {
  const r = val("Constitución de Empresa", {});
  assert.equal(r.subtotal, 1000);
});

test("Asociación Pro Vivienda precio manual 5000 con descuento 500 = 4500", () => {
  const r = val("Asociación Pro Vivienda", { precio_manual: 5000, descuento_monto: 500 });
  assert.equal(r.subtotal, 5000);
  assert.equal(r.total, 4500);
});

test("Asesoría Financiera precio manual 2000 = 2000", () => {
  const r = val("Asesoría Financiera", { precio_manual: 2000 });
  assert.equal(r.subtotal, 2000);
});

test("Descuento aplicado: Integral 2026 subtotal 550+50+150 con descuento 200 = 550", () => {
  const r = val("Integral 2026", {
    nivel_ingreso: "Hasta S/20,000",
    regimen_tributario: "Mype",
    num_trabajadores: "Hasta 2 trabajadores",
    regimen_laboral: "Base",
    incluir_contabilidad: true,
    incluir_planilla: true,
    incluir_asesoria: true,
    descuento_monto: 200,
  });
  assert.equal(r.subtotal, 750);
  assert.equal(r.total, 550);
});

test("Error si Empresarial sin servicios", () => {
  assert.throws(() =>
    val("Empresarial 2026", {
      nivel_ingreso: "Hasta S/30,000",
      regimen_tributario: "Mype",
      num_trabajadores: "Hasta 2 trabajadores",
      regimen_laboral: "Remype",
      incluir_contabilidad: false,
      incluir_planilla: false,
    }),
  );
});
