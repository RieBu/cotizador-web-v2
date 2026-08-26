"use client";

import { useCallback, useEffect, useState } from "react";
import { FileDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Field } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { formatMonto, formatFecha } from "@/lib/format";
import { listarCotizaciones, type Cotizacion, type Cliente } from "@/lib/datos";
import { generarPDF } from "@/lib/generar-pdf";
import { PLANES } from "@/lib/calculos/motor";
import { Reveal } from "@/components/motion";
import { SkeletonRows } from "@/components/ui/skeleton";

type Fila = Cotizacion & { clientes?: Cliente };

export default function HistorialPage() {
  const [rows, setRows] = useState<Fila[]>([]);
  const [plan, setPlan] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listarCotizaciones({ plan: plan || undefined, busqueda: busqueda || undefined });
      setRows(data);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [plan, busqueda]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function reimprimir(c: Fila) {
    generarPDF({
      plan: c.plan,
      tipo_empresa: c.clientes?.tipo_empresa ?? "EIRL",
      razon_social: c.clientes?.razon_social ?? "—",
      atencion: c.clientes?.atencion ?? "",
      ciudad: c.clientes?.ciudad ?? "",
      servicios: c.servicios ?? [],
      subtotal: c.subtotal,
      total: c.total,
      descuento_monto: c.descuento_monto,
      numero: c.numero,
      fecha: c.fecha,
    });
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Reveal>
        <h1 className="mb-1 font-display text-3xl font-semibold tracking-tight text-foreground">Historial de cotizaciones</h1>
        <p className="mb-6 text-sm text-muted">Consulta, filtra y reimprime tus cotizaciones.</p>
      </Reveal>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field label="Plan" className="sm:w-64">
          <Select
            value={plan}
            onChange={setPlan}
            options={[{ label: "Todos", value: "" }, ...PLANES.map((p) => ({ label: p, value: p }))]}
          />
        </Field>
        <Field label="Buscar" className="flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="N° de cotización..." className="pl-9" />
          </div>
        </Field>
        <Button onClick={cargar} variant="outline">Actualizar</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{rows.length} cotizaciones</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <SkeletonRows rows={5} />
          ) : rows.length === 0 ? (
            <div className="p-8 text-sm text-muted">Sin cotizaciones registradas.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>N°</TableHeaderCell>
                    <TableHeaderCell>Fecha</TableHeaderCell>
                    <TableHeaderCell>Cliente</TableHeaderCell>
                    <TableHeaderCell>Plan</TableHeaderCell>
                    <TableHeaderCell className="text-right">Subtotal</TableHeaderCell>
                    <TableHeaderCell className="text-right">Total</TableHeaderCell>
                    <TableHeaderCell></TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {rows.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.numero}</TableCell>
                      <TableCell>{c.fecha}</TableCell>
                      <TableCell>
                        <div>{c.clientes?.razon_social ?? "—"}</div>
                        <div className="text-xs text-zinc-400">{c.clientes?.ruc ?? ""}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{c.plan}</Badge></TableCell>
                      <TableCell className="text-right tabular-nums">{formatMonto(c.subtotal)}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{formatMonto(c.total)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" onClick={() => reimprimir(c)}>
                          <FileDown className="h-4 w-4" /> PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
