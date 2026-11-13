import { test } from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";

import { generarDocx, type DatosDocx } from "../src/lib/docx.ts";

const base: DatosDocx = {
  plan: "Empresarial CTP",
  tipo_empresa: "Firma",
  razon_social: "COMERCIALIZADORA ANDINA DEL PERU S.A.C.",
  atencion: "Sra. Maria Fernanda Quispe Huaman",
  ciudad: "Lima",
  servicios: [{ descripcion: "Contabilidad Tributacion", monto: 350 }],
  subtotal: 350,
  total: 350,
  descuento_monto: 0,
  numero: "COT-2026-0003",
  fecha: "13/11/2026",
};

const fmt = (n: number) =>
  `S/ ${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

async function xml(d: Partial<DatosDocx>): Promise<string> {
  const buf = await generarDocx({ ...base, ...d });
  const zip = await JSZip.loadAsync(buf);
  return zip.file("word/document.xml")!.async("string");
}

const strip = (s: string) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const paragraphs = (s: string) => s.match(/<w:p[ >][\s\S]*?<\/w:p>/g) ?? [];
const text = (s: string) => paragraphs(s).map(strip).join(" ");
const table = (s: string) =>
  (s.match(/<w:tbl>[\s\S]*?<\/w:tbl>/g) ?? []).find((t) => /Sub Total/i.test(strip(t))) ?? "";
const rows = (s: string) => s.match(/<w:tr[ >][\s\S]*?<\/w:tr>/g) ?? [];

test("DOCX CTP: número y fecha sin dígito residual", async () => {
  const t = text(await xml({}));
  assert.ok(t.includes(base.numero));
  assert.ok(t.includes(base.fecha));
  assert.ok(!new RegExp(base.numero + "\\d").test(t), "número con dígito extra");
  assert.ok(!new RegExp(base.fecha + "\\d").test(t), "fecha con dígito extra");
});

test("DOCX CTP: descuento muestra fila y total exacto", async () => {
  const s = await xml({ descuento_monto: 50, total: 300 });
  const r = rows(table(s));
  const descuento = r.find((x) => /Descuento/i.test(strip(x)));
  assert.ok(descuento, "falta fila de descuento");
  assert.ok(strip(descuento!).includes(fmt(50)));
  const totalRow = r.find((x) => /TotalFinal/.test(x))!;
  const cell = (totalRow.match(/<w:tc>[\s\S]*?<\/w:tc>/g) ?? []).find((c) => /TotalFinal/.test(c))!;
  assert.equal(strip(cell), fmt(300));
});

test("DOCX CTP: ciudad no arrastra el placeholder", async () => {
  const t = text(await xml({}));
  assert.ok(!/LimaPiura/.test(t), "ciudad con residuo Piura");
});

test("DOCX CTP: poda servicios no seleccionados", async () => {
  const s = await xml({});
  assert.ok(!/w:name="UnitPlanilla"/.test(s), "Planilla no seleccionada quedó en la tabla");
});

test("DOCX Registro de Marca: total sin duplicado y descuento visible", async () => {
  const s = await xml({
    plan: "Registro de Marca",
    servicios: [{ descripcion: "Servicio de registro de marca", monto: 1500 }],
    subtotal: 1500,
    descuento_monto: 200,
    total: 1300,
  });
  const r = rows(table(s));
  const totalRow = r.find((x) => /TotalFinal/.test(x))!;
  const cell = (totalRow.match(/<w:tc>[\s\S]*?<\/w:tc>/g) ?? []).find((c) => /TotalFinal/.test(c))!;
  assert.equal(strip(cell), fmt(1300));
  assert.ok(r.some((x) => /Descuento/i.test(strip(x))), "falta fila de descuento");
});

test("DOCX Integral Externo: descuento visible", async () => {
  const s = await xml({
    plan: "Integral Externo",
    servicios: [
      { descripcion: "Asesoría Integral Externa", monto: 500 },
      { descripcion: "Laboral", monto: 80 },
    ],
    subtotal: 580,
    descuento_monto: 80,
    total: 500,
  });
  assert.ok(rows(table(s)).some((x) => /Descuento/i.test(strip(x))), "falta fila de descuento");
});

test("DOCX: firma canónica en todas las plantillas Firma", async () => {
  const planes: Array<[string, Partial<DatosDocx>]> = [
    ["Empresarial CT", { plan: "Empresarial CT" }],
    ["Empresarial CTP", {}],
    ["Integral 2026", { plan: "Integral 2026" }],
    ["Régimen Especial", { plan: "Régimen Especial", servicios: [{ descripcion: "Contabilidad RER", monto: 250 }] }],
    ["Declaración Express", { plan: "Declaración Express", servicios: [{ descripcion: "Declaración Express", monto: 150 }] }],
    ["Integral Externo", { plan: "Integral Externo" }],
    ["Registro de Marca", { plan: "Registro de Marca", servicios: [{ descripcion: "Servicio de registro de marca", monto: 1500 }] }],
    ["Constitución de Empresa", { plan: "Constitución de Empresa", servicios: [{ descripcion: "CONSTITUCION DE EMPRESA", monto: 1000 }] }],
    ["Asociación Pro Vivienda", { plan: "Asociación Pro Vivienda", servicios: [{ descripcion: "Constitución de asociación", monto: 5000 }] }],
    ["Asesoría Financiera", { plan: "Asesoría Financiera", servicios: [{ descripcion: "Asesoría Financiera", monto: 2000 }] }],
  ];
  for (const [name, d] of planes) {
    const t = text(await xml(d));
    assert.ok(t.includes("FIRMA DE ASESORIA EMPRESARIAL JYS S.A.C."), `${name}: firma no canónica`);
    assert.ok(t.includes("20613497049"), `${name}: falta RUC nuevo`);
  }
});
