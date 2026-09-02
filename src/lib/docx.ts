import path from "node:path";
import { readFileSync } from "node:fs";
import JSZip from "jszip";
import {
  DOMParser,
  XMLSerializer,
  type Document as XDoc,
  type Element as XEl,
  type Node as XNode,
} from "@xmldom/xmldom";

export interface DatosDocx {
  plan: string;
  tipo_empresa: string;
  razon_social: string;
  atencion: string;
  ciudad: string;
  servicios: { descripcion: string; monto: number }[];
  subtotal: number;
  total: number;
  descuento_monto: number;
  numero: string;
  fecha: string;
}

const TEMPLATES_DIR = path.join(process.cwd(), "public", "plantillas");

const PLAN_TO_TEMPLATE: Record<string, string> = {
  "Empresarial 2026": "Empresarial2026",
  "Integral 2026": "Integral",
  "Régimen Especial": "Especial",
  "Declaración Express": "DeclaracionExpress",
  "Integral Externo": "IntegralExterno",
  "Registro de Marca": "RegistroMarca",
  "Constitución de Empresa": "Constitucion",
  "Asociación Pro Vivienda": "AsociacionVivienda",
  "Asesoría Financiera": "AsesoriaFinanciera",
};

// Mapeo descripción → (unit bookmark, subtotal bookmark)
const DESC_TO_BM: Record<string, Record<string, [string, string]>> = {
  "Empresarial 2026": {
    "Contabilidad Tributacion": ["UnitConta", "SubTotalConta"],
    "Planilla": ["UnitPlanilla", "SubTotalPlanilla"],
  },
  "Integral 2026": {
    "Contabilidad": ["UnitConta", "SubTotalConta"],
    "Planilla": ["UnitPlanilla", "SubTotalPlanilla"],
    "Legal-Laboral": ["UnitAsesoria", "SubTotalAsesoria"],
  },
  "Régimen Especial": {
    "Contabilidad RER": ["UnitConta", "SubTotalConta"],
    "Planilla": ["UnitPlanilla", "SubTotalPlanilla"],
  },
  "Declaración Express": { "Declaración Express": ["UnitEmprendedor", "SubTotalEmprendedor"] },
  "Integral Externo": {
    "Asesoría Integral Externa": ["UnitConta", "SubTotalConta"],
    "Laboral": ["UnitPlanilla", "SubTotalPlanilla"],
  },
  "Registro de Marca": { "Servicio de registro de marca": ["UnitEmprendedor", "SubTotalEmprendedor"] },
  "Constitución de Empresa": { "CONSTITUCION DE EMPRESA": ["UnitEmprendedor", "SubTotalEmprendedor"] },
  "Asociación Pro Vivienda": { "Constitución de asociación": ["UnitConta", "SubTotalConta"] },
  "Asesoría Financiera": { "Asesoría Financiera": ["UnitEmprendedor", "SubTotalEmprendedor"] },
};

// Para podar filas de servicios no seleccionados
const PLAN_ROW_MAP: Record<string, Record<string, string[]>> = {
  "Empresarial 2026": {
    "Contabilidad Tributacion": ["UnitConta", "SubTotalConta"],
    "Planilla": ["UnitPlanilla", "SubTotalPlanilla"],
  },
  "Integral 2026": {
    "Contabilidad": ["UnitConta", "SubTotalConta"],
    "Planilla": ["UnitPlanilla", "SubTotalPlanilla"],
    "Legal-Laboral": ["UnitAsesoria", "SubTotalAsesoria"],
  },
  "Régimen Especial": {
    "Contabilidad RER": ["UnitConta", "SubTotalConta"],
    "Planilla": ["UnitPlanilla", "SubTotalPlanilla"],
  },
  "Integral Externo": {
    "Asesoría Integral Externa": ["UnitConta", "SubTotalConta"],
    "Laboral": ["UnitPlanilla", "SubTotalPlanilla"],
  },
};

function formatMoney(n: number | string): string {
  // Defensive: si n viene ya formateado como "S/ 100.00" o "100,00", normalizar antes de formatear
  let num: number;
  if (typeof n === "string") {
    const cleaned = n.replace(/[^0-9.,-]/g, "");
    // Detectar separador decimal: si contiene "," y "." el último es el decimal
    let normalized = cleaned;
    if (cleaned.includes(",") && cleaned.includes(".")) {
      normalized = cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")
        ? cleaned.replace(/\./g, "").replace(",", ".")
        : cleaned.replace(/,/g, "");
    } else if (cleaned.includes(",")) {
      normalized = cleaned.replace(",", ".");
    }
    num = parseFloat(normalized);
  } else {
    num = n;
  }
  const safe = Number.isFinite(num) ? num : 0;
  return `S/ ${safe.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parser(): DOMParser {
  return new DOMParser({ onError: () => undefined });
}

function elements(root: XNode, tag: string): XEl[] {
  const list = (root as XDoc).getElementsByTagName(tag);
  const out: XEl[] = [];
  for (let i = 0; i < list.length; i++) out.push(list.item(i) as XEl);
  return out;
}

function esEl(n: XNode | null): n is XEl {
  return !!n && n.nodeType === 1;
}

function ancestorParagraph(el: XNode | null): XEl | null {
  let node: XNode | null = el;
  while (node) {
    if (node.nodeType === 1 && (node as XEl).tagName === "w:p") return node as XEl;
    node = node.parentNode;
  }
  return null;
}

function appendRun(doc: XDoc, p: XEl, value: string): void {
  const r = doc.createElement("w:r");
  const t = doc.createElement("w:t");
  t.setAttribute("xml:space", "preserve");
  t.appendChild(doc.createTextNode(value));
  r.appendChild(t);
  p.appendChild(r);
}

function fillBookmark(doc: XDoc, name: string, value: string): void {
  for (const start of elements(doc, "w:bookmarkStart")) {
    if (start.getAttribute("w:name") !== name) continue;
    const p = ancestorParagraph(start);
    if (!p) continue;
    const id = start.getAttribute("w:id");
    const rangeTexts: XEl[] = [];
    let node = start.nextSibling;
    while (node) {
      if (esEl(node) && node.tagName === "w:bookmarkEnd") {
        if (node.getAttribute("w:id") === id) break;
      } else if (esEl(node) && node.tagName === "w:r") {
        for (const t of elements(node, "w:t")) rangeTexts.push(t);
      }
      node = node.nextSibling;
    }
    if (rangeTexts.length > 0) {
      setXText(rangeTexts[0], value);
      for (let i = 1; i < rangeTexts.length; i++) {
        const child = rangeTexts[i].firstChild;
        if (child && child.nodeType === 3) child.nodeValue = "";
      }
    } else {
      // Bookmark sin rango (caso Cliente/Atencion) o celda vacía: añadir run con valor después del bookmarkStart
      // No validar w:t length porque tras fixMembreteLabels el p ya tiene etiqueta "Razón Social: " pero aún necesita el valor
      const r = doc.createElement("w:r");
      const t = doc.createElement("w:t");
      t.setAttribute("xml:space", "preserve");
      t.appendChild(doc.createTextNode(value));
      r.appendChild(t);
      // Insertar inmediatamente después de bookmarkStart para mantener orden etiqueta -> valor
      if (start.nextSibling) start.parentNode?.insertBefore(r, start.nextSibling);
      else start.parentNode?.appendChild(r);
    }
  }
}

function setXText(t: XEl, value: string): void {
  const child = t.firstChild;
  if (child && child.nodeType === 3) {
    child.nodeValue = value;
    return;
  }
  const doc = t.ownerDocument;
  const node = doc?.createTextNode(value);
  if (node) t.appendChild(node);
}

function textContentSafe(t: XEl, value: string): void {
  setXText(t, value);
}

function tableText(tbl: XEl): string {
  return elements(tbl, "w:t").map((t) => t.textContent ?? "").join(" ");
}

function rowText(tr: XEl): string {
  return elements(tr, "w:t").map((t) => t.textContent ?? "").join("");
}

function findPricingTable(root: XNode): XEl | null {
  for (const tbl of elements(root, "w:tbl")) {
    const txt = tableText(tbl);
    const hasUnit = /P\.\s*Unit/i.test(txt);
    const hasSub = /Sub\s*Total/i.test(txt);
    if (hasUnit && hasSub) return tbl;
  }
  // Fallback: tabla que contiene bookmarks de precios
  for (const tbl of elements(root, "w:tbl")) {
    const bms = new Set(elements(tbl, "w:bookmarkStart").map((s) => s.getAttribute("w:name")));
    if (bms.has("UnitConta") || bms.has("UnitPlanilla") || bms.has("UnitEmprendedor") || bms.has("UnitAsesoria")) return tbl;
  }
  return null;
}

function stripFloatingTablePr(tbl: XEl): void {
  // Las tablas de precio vienen con w:tblpPr (flotante) que al podar filas deja Y fijo y descuadra en Word/preview
  const tblPrList = elements(tbl, "w:tblPr");
  for (const pr of tblPrList) {
    const floating = elements(pr, "w:tblpPr");
    for (const fp of floating) pr.removeChild(fp);
  }
}

function rowBookmarks(tr: XEl): Set<string> {
  const set = new Set<string>();
  for (const s of elements(tr, "w:bookmarkStart")) {
    const n = s.getAttribute("w:name");
    if (n) set.add(n);
  }
  return set;
}

function prunePricingRows(doc: XDoc, plan: string, serviciosDict: Record<string, number>, descuento: number): void {
  const tbl = findPricingTable(doc);
  if (!tbl) return;
  stripFloatingTablePr(tbl);
  const map = PLAN_ROW_MAP[plan];
  const faltantes = map ? Object.keys(map).filter((desc) => !(desc in serviciosDict)) : [];

  const rows = elements(tbl, "w:tr");
  const headerRow = rows.find((r) => /P\.\s*Unit/i.test(rowText(r)));

  const toRemove: XEl[] = [];
  for (const row of rows) {
    if (row === headerRow) continue;
    const bms = rowBookmarks(row);
    if (descuento === 0 && bms.has("ValDescuento")) {
      toRemove.push(row);
      continue;
    }
    if (!map) continue;
    for (const desc of faltantes) {
      const bmsDesc = map[desc];
      if (bmsDesc.some((b) => bms.has(b))) {
        toRemove.push(row);
        break;
      }
    }
  }
  for (const row of toRemove) row.parentNode?.removeChild(row);

  // Renumerar ítems de las filas de servicio restantes (limpiar todos los w:t y dejar solo el número)
  if (!map) return;
  const restantes = elements(tbl, "w:tr").filter((r) => r !== headerRow);
  let item = 1;
  for (const row of restantes) {
    const bms = rowBookmarks(row);
    const esServicio = Object.values(map).some((arr) => arr.some((b) => bms.has(b)));
    if (!esServicio) continue;
    const tc = elements(row, "w:tc")[0];
    if (!tc) continue;
    const ts = elements(tc, "w:t");
    if (ts.length === 0) continue;
    setXText(ts[0], String(item));
    // Limpiar texto residual en otros w:t de la misma celda (runs con bold etc)
    for (let i = 1; i < ts.length; i++) {
      const child = ts[i].firstChild;
      if (child && child.nodeType === 3) child.nodeValue = "";
      else if (ts[i].textContent) ts[i].textContent = "";
    }
    item++;
  }
}

function prunePropuesta(doc: XDoc, plan: string, serviciosDict: Record<string, number>): void {
  if (plan !== "Integral 2026" && plan !== "Empresarial 2026" && plan !== "Régimen Especial") return;
  const paragraphs = elements(doc, "w:p");
  const norm = (s: string) => (s ?? "").trim().toLowerCase().replace(/\s+/g, " ").replace(/[\u2013\u2014]/g, "-");

  const isPlanilla = (txt: string) => norm(txt) === "planilla";
  const isLegal = (txt: string) => norm(txt).startsWith("legal");
  const isDetalles = (txt: string) => norm(txt).startsWith("detalles del servicio");

  const quitarPlanilla = !("Planilla" in serviciosDict);
  const quitarLegal = plan === "Integral 2026" && !("Legal-Laboral" in serviciosDict);

  const toRemoveSet = new Set<XEl>();
  for (let i = 0; i < paragraphs.length; i++) {
    const headingNorm = norm(paragraphs[i].textContent ?? "");
    const isTarget = isPlanilla(headingNorm) || isLegal(headingNorm);
    if (!isTarget) continue;
    const removeThis = isPlanilla(headingNorm) ? quitarPlanilla : quitarLegal;
    if (!removeThis) continue;
    toRemoveSet.add(paragraphs[i]);
    for (let j = i + 1; j < paragraphs.length; j++) {
      const txt = norm(paragraphs[j].textContent ?? "");
      if (isPlanilla(txt) || isLegal(txt) || isDetalles(txt)) break;
      toRemoveSet.add(paragraphs[j]);
    }
  }
  for (const p of toRemoveSet) p.parentNode?.removeChild(p);
}

export async function generarDocx(d: DatosDocx): Promise<Buffer> {
  const template = PLAN_TO_TEMPLATE[d.plan] ?? "Integral";
  const file = `Plantilla_Plan_${template}_${d.tipo_empresa}.docx`;
  const buffer = readFileSync(path.join(TEMPLATES_DIR, file));

  const zip = await JSZip.loadAsync(buffer);
  const xmlFile = zip.file("word/document.xml");
  if (!xmlFile) throw new Error("document.xml no encontrado en la plantilla");
  const xml = await xmlFile.async("string");

  const doc = parser().parseFromString(xml, "application/xml");

  // Datos generales - mantener membrete exactamente como en programa cotizador (templates idénticos):
  // "Razón Social:" y "Atención:" quedan como w:p fuera de la tabla flotante, valores van en celdas
  fillBookmark(doc, "NumCotizacion", d.numero);
  fillBookmark(doc, "Fecha", d.fecha);
  fillBookmark(doc, "Cliente", d.razon_social);
  fillBookmark(doc, "Atencion", d.atencion);
  fillBookmark(doc, "Ciudad", d.ciudad);

  // Precios según plan
  const map = DESC_TO_BM[d.plan] ?? {};
  const serviciosDict: Record<string, number> = {};
  for (const s of d.servicios) serviciosDict[s.descripcion] = s.monto;

  for (const [desc, [unit, sub]] of Object.entries(map)) {
    const m = formatMoney(serviciosDict[desc] ?? 0);
    fillBookmark(doc, unit, m);
    fillBookmark(doc, sub, m);
  }
  fillBookmark(doc, "ValDescuento", formatMoney(d.descuento_monto));
  fillBookmark(doc, "TotalFinal", formatMoney(d.total));

  try {
    prunePricingRows(doc, d.plan, serviciosDict, d.descuento_monto);
    prunePropuesta(doc, d.plan, serviciosDict);
  } catch {
    // La poda es best-effort; no debe impedir la generación.
  }

  const outXml = new XMLSerializer().serializeToString(doc);
  zip.file("word/document.xml", outXml);

  return zip.generateAsync({ type: "nodebuffer" });
}
