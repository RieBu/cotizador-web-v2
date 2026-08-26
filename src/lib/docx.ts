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

function formatMoney(n: number): string {
  return `S/ ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
    } else if (elements(p, "w:t").length === 0) {
      // Celda sin placeholder (caso Cliente/Atencion en celdas combinadas): añadir run
      appendRun(doc, p, value);
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

function findPricingTable(root: XNode): XEl | null {
  for (const tbl of elements(root, "w:tbl")) {
    const hasUnit = elements(tbl, "w:t").some((t) => (t.textContent ?? "").includes("P. Unit"));
    const hasSub = elements(tbl, "w:t").some((t) => (t.textContent ?? "").includes("Sub Total"));
    if (hasUnit && hasSub) return tbl;
  }
  return null;
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
  const map = PLAN_ROW_MAP[plan];
  if (!map) return;
  const faltantes = Object.keys(map).filter((desc) => !(desc in serviciosDict));
  const tbl = findPricingTable(doc);
  if (!tbl) return;

  const rows = elements(tbl, "w:tr");
  const headerRow = rows.find((r) =>
    elements(r, "w:t").some((t) => (t.textContent ?? "").includes("P. Unit")),
  );

  const toRemove: XEl[] = [];
  for (const row of rows) {
    if (row === headerRow) continue;
    const bms = rowBookmarks(row);
    if (descuento === 0 && bms.has("ValDescuento")) {
      toRemove.push(row);
      continue;
    }
    for (const desc of faltantes) {
      const bmsDesc = map[desc];
      if (bmsDesc.some((b) => bms.has(b))) {
        toRemove.push(row);
        break;
      }
    }
  }
  for (const row of toRemove) row.parentNode?.removeChild(row);

  // Renumerar ítems de las filas de servicio restantes
  const restantes = elements(tbl, "w:tr").filter((r) => r !== headerRow);
  let item = 1;
  for (const row of restantes) {
    const bms = rowBookmarks(row);
    const esServicio = Object.values(map).some((arr) => arr.some((b) => bms.has(b)));
    if (!esServicio) continue;
    const tc = elements(row, "w:tc")[0];
    const t = tc ? elements(tc, "w:t")[0] : null;
    if (t) setXText(t, String(item));
    item++;
  }
}

function prunePropuesta(doc: XDoc, plan: string, serviciosDict: Record<string, number>): void {
  if (plan !== "Integral 2026" && plan !== "Empresarial 2026" && plan !== "Régimen Especial") return;
  const paragraphs = elements(doc, "w:p");
  const norm = (s: string) => (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");

  const targetHeading = (txt: string) => {
    const n = norm(txt);
    return n === "planilla" || n.startsWith("legal");
  };

  // Planilla no seleccionada → quitar bloque Planilla;
  // Legal-Laboral no seleccionada (Integral) → quitar bloque legal.
  const quitarPlanilla = !("Planilla" in serviciosDict);
  const quitarLegal = plan === "Integral 2026" && !("Legal-Laboral" in serviciosDict);

  const toRemove: XEl[] = [];
  for (let i = 0; i < paragraphs.length; i++) {
    const heading = norm(paragraphs[i].textContent ?? "");
    if (!targetHeading(heading)) continue;
    const removeThis = heading === "planilla" ? quitarPlanilla : quitarLegal;
    if (!removeThis) continue;
    toRemove.push(paragraphs[i]);
    for (let j = i + 1; j < paragraphs.length; j++) {
      const txt = norm(paragraphs[j].textContent ?? "");
      if (targetHeading(txt) || txt.startsWith("detalles del servicio")) break;
      toRemove.push(paragraphs[j]);
    }
  }
  for (const p of toRemove) p.parentNode?.removeChild(p);
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

  // Datos generales
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
