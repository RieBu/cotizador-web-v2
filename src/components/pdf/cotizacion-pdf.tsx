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

const BRAND = "#00355f";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: "#1a1a1a", padding: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  logoBox: { width: 48, height: 48, backgroundColor: BRAND, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  logoText: { color: "#ffffff", fontSize: 14, fontWeight: "bold" },
  headerRight: { alignItems: "flex-end", textAlign: "right" },
  h1: { fontSize: 16, fontWeight: "bold", color: BRAND },
  sub: { fontSize: 9, color: "#666" },
  card: { border: 1, borderColor: "#e5e7eb", borderRadius: 6, padding: 12, marginBottom: 16 },
  row2: { flexDirection: "row", justifyContent: "space-between" },
  label: { width: 130, color: "#666", fontSize: 9 },
  value: { flex: 1, fontWeight: "bold" },
  title: { fontSize: 12, fontWeight: "bold", color: BRAND, marginBottom: 8 },
  table: { flexDirection: "row", backgroundColor: "#f4f4f5", paddingVertical: 6, paddingHorizontal: 8, fontSize: 9, fontWeight: "bold", color: BRAND },
  thead: { width: "8%" },
  thead2: { width: "62%" },
  thead3: { width: "15%", textAlign: "right" },
  trow: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8, borderBottom: 1, borderColor: "#f0f0f0" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, paddingHorizontal: 8, fontWeight: "bold" },
  igvNote: { fontSize: 7, color: "#666", textAlign: "right", marginTop: 4, fontStyle: "italic" },
  footnote: { marginTop: 24, fontSize: 8, color: "#999", lineHeight: 1.4 },
});

function CotizacionPDF({ d }: { d: InputPDF }): ReactElement {
  return (
    <Document title={`Cotización ${d.numero} - ${d.razon_social}`} author="Cotizador JyS">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>JyS</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.h1}>COTIZACIÓN</Text>
            <Text style={styles.sub}>N° {d.numero}</Text>
            <Text style={styles.sub}>Fecha: {d.fecha}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Datos del cliente</Text>
          {[
            ["Razón social", d.razon_social],
            ["Tipo de empresa", d.tipo_empresa],
            ["Atención", d.atencion || "—"],
            ["Ciudad", d.ciudad || "—"],
          ].map(([l, v]) => (
            <View key={l} style={styles.row2}>
              <Text style={styles.label}>{l}</Text>
              <Text style={styles.value}>{v}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Plan {d.plan}</Text>
          <View style={styles.table}>
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
          <View style={[styles.totalRow, { borderTop: 1, borderColor: BRAND, marginTop: 4 }]}>
            <Text style={{ flex: 1, color: BRAND }}>Inversión TOTAL</Text>
            <Text style={{ color: BRAND }}>{formatMonto(d.total)}</Text>
          </View>
          <Text style={styles.igvNote}>*NO INCLUYE IGV (18%)</Text>
        </View>

        <Text style={styles.footnote}>
          Esta cotización tiene una validez de 15 días hábiles. El monto no incluye IGV salvo que se
          indique lo contrario. Los servicios contratados se regirán por los términos y condiciones
          del contrato correspondiente. Cotizador JyS.
        </Text>
      </Page>
    </Document>
  );
}

export async function renderPdfBlob(input: InputPDF): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  return pdf(<CotizacionPDF d={input} />).toBlob();
}
