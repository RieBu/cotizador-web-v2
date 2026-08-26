"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Field } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cargarTarifas, upsertTarifa, eliminarTarifa } from "@/lib/datos";
import type { TarifaFila } from "@/lib/calculos/types";
import { PLANES } from "@/lib/calculos/motor";
import { Reveal } from "@/components/motion";

const toopts = (arr: string[]): SelectOption[] => arr.map((a) => ({ label: a, value: a }));
const PLANES_TABLA = ["Adicional", ...PLANES];

function etiqueta(f: TarifaFila): string {
  return [f.nivel_ingreso, f.regimen_tributario, f.num_comprobantes, f.num_trabajadores, f.regimen_laboral]
    .filter(Boolean)
    .join(" · ");
}

export default function TarifasPage() {
  const [filas, setFilas] = useState<(TarifaFila & { id?: string })[]>([]);
  const [plan, setPlan] = useState(PLANES[0]);
  const [nuevo, setNuevo] = useState(false);
  const [msg, setMsg] = useState("");

  const cargar = useCallback(async () => {
    try {
      const data = await cargarTarifas();
      setFilas(data);
    } catch {
      setFilas([]);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const visibles = filas.filter((f) => f.plan === plan);

  async function onChangeMonto(id: string | undefined, monto: number) {
    if (!id) return;
    try {
      await upsertTarifa({ ...filas.find((f) => f.id === id)!, monto }, id);
      setMsg("Monto actualizado.");
      cargar();
    } catch (e) {
      setMsg(e instanceof Error ? `Sin permisos o error: ${e.message}` : "Error");
    }
  }

  async function crear(fila: TarifaFila) {
    try {
      await upsertTarifa(fila);
      setNuevo(false);
      setMsg("Tarifa agregada.");
      cargar();
    } catch (e) {
      setMsg(e instanceof Error ? `Error: ${e.message}` : "Error");
    }
  }

  async function borrar(id: string | undefined) {
    if (!id) return;
    if (!confirm("¿Eliminar esta tarifa?")) return;
    await eliminarTarifa(id);
    cargar();
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Reveal>
        <h1 className="mb-1 font-display text-3xl font-semibold tracking-tight text-foreground">Tarifas</h1>
        <p className="mb-6 text-sm text-muted">
          Administra el tarifario por plan. La escritura requiere rol ADMIN.
        </p>
      </Reveal>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Field label="Plan" className="sm:w-72">
          <Select value={plan} onChange={setPlan} options={toopts(PLANES_TABLA)} />
        </Field>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setNuevo(true)}>
            <Plus className="h-4 w-4" /> Nueva tarifa
          </Button>
        </div>
      </div>

      {msg && <p className="mb-3 text-sm text-zinc-600">{msg}</p>}

      {nuevo && (
        <NuevaTarifa plan={plan} onGuardar={crear} onCancelar={() => setNuevo(false)} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>{visibles.length} tarifas · {plan}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Tipo</TableHeaderCell>
                  <TableHeaderCell>Condiciones</TableHeaderCell>
                  <TableHeaderCell className="text-right">Monto</TableHeaderCell>
                  <TableHeaderCell></TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {visibles.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell><Badge variant="outline">{f.tipo}</Badge></TableCell>
                    <TableCell className="text-zinc-600">{etiqueta(f)}</TableCell>
                    <TableCell className="text-right">
                      <input
                        type="number"
                        defaultValue={f.monto}
                        className="w-28 rounded-md border border-zinc-200 px-2 py-1 text-right text-sm"
                        onBlur={(e) => {
                          const n = parseFloat(e.target.value);
                          if (n >= 0 && n !== f.monto) onChangeMonto(f.id, n);
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" className="text-red-600" onClick={() => borrar(f.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NuevaTarifa({
  plan,
  onGuardar,
  onCancelar,
}: {
  plan: string;
  onGuardar: (f: TarifaFila) => void;
  onCancelar: () => void;
}) {
  const [tipo, setTipo] = useState("contabilidad");
  const [nivel, setNivel] = useState("");
  const [rtrib, setRtrib] = useState("");
  const [comprob, setComprob] = useState("");
  const [ntrab, setNtrab] = useState("");
  const [rlab, setRlab] = useState("");
  const [monto, setMonto] = useState("");

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Nueva tarifa · {plan}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Field label="Tipo">
          <Select value={tipo} onChange={setTipo} options={toopts(["contabilidad", "planilla", "asesoria", "contable_legal", "laboral", "pdt", "pdt_planilla"])} />
        </Field>
        <Field label="Nivel de ingreso">
          <Input value={nivel} onChange={(e) => setNivel(e.target.value)} placeholder="ej. Hasta S/50,000" />
        </Field>
        <Field label="Régimen tributario">
          <Input value={rtrib} onChange={(e) => setRtrib(e.target.value)} placeholder="ej. Mype" />
        </Field>
        <Field label="Monto (S/)">
          <Input value={monto} onChange={(e) => setMonto(e.target.value)} inputMode="decimal" placeholder="0.00" />
        </Field>
        <Field label="N° comprobantes">
          <Input value={comprob} onChange={(e) => setComprob(e.target.value)} placeholder="ej. Hasta 100 comprobantes" />
        </Field>
        <Field label="N° trabajadores">
          <Input value={ntrab} onChange={(e) => setNtrab(e.target.value)} placeholder="ej. Hasta 10 trabajadores" />
        </Field>
        <Field label="Régimen laboral">
          <Input value={rlab} onChange={(e) => setRlab(e.target.value)} placeholder="ej. Remype" />
        </Field>
        <div className="flex items-end gap-2">
          <Button
            onClick={() =>
              onGuardar({
                plan,
                tipo,
                nivel_ingreso: nivel,
                regimen_tributario: rtrib,
                num_comprobantes: comprob,
                num_trabajadores: ntrab,
                regimen_laboral: rlab,
                monto: parseFloat(monto) || 0,
              })
            }
          >
            <Save className="h-4 w-4" /> Guardar
          </Button>
          <Button variant="outline" onClick={onCancelar}>Cancelar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
