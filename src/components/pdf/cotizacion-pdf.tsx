"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { formatMonto } from "@/lib/format";

export interface InputPDF {
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

const BRAND = "#7a0a10";
const BRAND2 = "#b30009";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: "#1a1a1a", padding: 36 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, borderBottom: 1, borderColor: "#e5e7eb", paddingBottom: 10 },
  logoBox: { width: 48, height: 48, backgroundColor: BRAND, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  logoText: { color: "#ffffff", fontSize: 14, fontWeight: "bold" },
  headerRight: { alignItems: "flex-end", textAlign: "right" },
  h1: { fontSize: 15, fontWeight: "bold", color: BRAND },
  sub: { fontSize: 9, color: "#222" },
  membrete: { marginBottom: 10 },
  membreteRow: { flexDirection: "row", alignItems: "flex-end", borderBottom: 1, borderColor: "#000", paddingVertical: 4, marginBottom: 4 },
  membreteLabel: { fontSize: 9, fontWeight: "bold", color: "#111", width: 90 },
  membreteValue: { fontSize: 10, flex: 1, fontWeight: "bold" },
  historia: { fontSize: 11, fontWeight: "bold", color: BRAND, textAlign: "center", marginVertical: 12, letterSpacing: 1.2 },
  card: { border: 1, borderColor: "#000", padding: 0, marginBottom: 14, overflow: "hidden" },
  title: { fontSize: 11, fontWeight: "bold", color: "#fff", backgroundColor: BRAND, paddingVertical: 6, paddingHorizontal: 8, textAlign: "left" },
  tableHead: { flexDirection: "row", backgroundColor: BRAND, paddingVertical: 6, paddingHorizontal: 6, fontSize: 8, fontWeight: "bold", color: "#fff" },
  thead: { width: "8%", textAlign: "center" },
  thead2: { width: "62%", textAlign: "left", paddingLeft: 4 },
  thead3: { width: "15%", textAlign: "right" },
  trow: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 6, borderBottom: 1, borderColor: "#e5e7eb", fontSize: 9 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, paddingHorizontal: 8, fontWeight: "bold", fontSize: 10 },
  igvNote: { fontSize: 7, color: "#666", textAlign: "right", marginTop: 4, fontStyle: "italic" },
  footnote: { marginTop: 14, fontSize: 7, color: "#555", lineHeight: 1.3, textAlign: "justify" },
  ciudad: { fontSize: 9, color: "#222", marginBottom: 10, fontStyle: "italic" },
});

function CotizacionPDF({ d }: { d: InputPDF }): ReactElement {
  return (
    <Document title={`Cotización ${d.numero} - ${d.razon_social}`} author="Cotizador JyS">
      <Page size="A4" style={styles.page}>
        {/* Header idéntico a Word: Número + Fecha en misma línea */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>JyS</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.h1}>COTIZACIÓN</Text>
            <Text style={styles.sub}>N° {d.numero}                Fecha: {d.fecha}</Text>
          </View>
        </View>

        {/* Membrete calcado a Word: líneas subrayadas con Razón Social / Atención */}
        <View style={styles.membrete}>
          <View style={styles.membreteRow}>
            <Text style={styles.membreteLabel}>Razón Social:</Text>
            <Text style={styles.membreteValue}>{d.razon_social}</Text>
          </View>
          <View style={styles.membreteRow}>
            <Text style={styles.membreteLabel}>Atención:</Text>
            <Text style={styles.membreteValue}>{d.atencion || "—"}</Text>
          </View>
        </View>

        <Text style={styles.historia}>NUESTRA HISTORIA</Text>
        <Text style={{ fontSize: 7, color: "#666", textAlign: "center", marginBottom: 10 }}>
          Estudio contable con más de 10 años brindando soluciones integrales a empresas de la región.
        </Text>

        {/* Tabla de precios - header calcado a Word w:tblStyle a2 */}
        <View style={styles.card}>
          <Text style={styles.title}>Plan {d.plan}</Text>
          <View style={styles.tableHead}>
            <Text style={styles.thead}>Ítem</Text>
            <Text style={styles.thead2}>Descripción</Text>
            <Text style={styles.thead3}>P. Unit</Text>
            <Text style={styles.thead3}>Sub Total</Text>
          </View>
          {d.servicios.map((sv, i) => (
            <View key={i} style={styles.trow} wrap={false}>
              <Text style={styles.thead}>{i + 1}</Text>
              <Text style={styles.thead2}>{sv.descripcion}</Text>
              <Text style={styles.thead3}>{formatMonto(sv.monto)}</Text>
              <Text style={styles.thead3}>{formatMonto(sv.monto)}</Text>
            </View>
          ))}
          {d.descuento_monto > 0 && (
            <View style={styles.totalRow}>
              <Text style={{ flex: 1 }}>Descuento</Text>
              <Text>-{formatMonto(d.descuento_monto)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, { borderTop: 1, borderColor: BRAND, marginTop: 4, backgroundColor: "#fff5f5" }]}>
            <Text style={{ flex: 1, color: BRAND }}>Inversión TOTAL</Text>
            <Text style={{ color: BRAND }}>{formatMonto(d.total)}</Text>
          </View>
          <Text style={styles.igvNote}>*NO INCLUYE IGV (18%)</Text>
        </View>

        <Text style={styles.ciudad}>Los precios detallados son considerados para la ciudad de {d.ciudad || "—"}.</Text>

        <Text style={styles.footnote}>
          Esta cotización tiene una validez de 15 días hábiles. El monto no incluye IGV salvo que se indique lo contrario.{"\n"}
          Los servicios contratados se regirán por los términos y condiciones del contrato correspondiente. Cotizador JyS - Trujillo / Piura / Lima.
        </Text>
      </Page>
    </Document>
  );
}

export async function renderPdfBlob(input: InputPDF): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  return pdf(<CotizacionPDF d={input} />).toBlob();
}
