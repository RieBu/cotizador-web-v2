"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { listarClientes, guardarCliente, eliminarCliente, type Cliente } from "@/lib/datos";
import { TIPOS_EMPRESA } from "@/lib/calculos/motor";
import { Reveal } from "@/components/motion";
import { SkeletonRows } from "@/components/ui/skeleton";

const toopts = (arr: string[]): SelectOption[] => arr.map((a) => ({ label: a, value: a }));

export default function ClientesPage() {
  const [rows, setRows] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

  const [editId, setEditId] = useState<string | null>(null);
  const [razon, setRazon] = useState("");
  const [ruc, setRuc] = useState("");
  const [atencion, setAtencion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [tipo, setTipo] = useState("EIRL");
  const [msg, setMsg] = useState("");

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listarClientes(busqueda));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [busqueda]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function resetForm() {
    setEditId(null);
    setRazon("");
    setRuc("");
    setAtencion("");
    setCiudad("");
    setTipo("EIRL");
    setMsg("");
  }

  function editar(c: Cliente) {
    setEditId(c.id);
    setRazon(c.razon_social);
    setRuc(c.ruc ?? "");
    setAtencion(c.atencion ?? "");
    setCiudad(c.ciudad ?? "");
    setTipo(c.tipo_empresa);
  }

  async function guardar() {
    if (!razon.trim()) return;
    try {
      await guardarCliente({ razon_social: razon.trim(), ruc: ruc.trim(), atencion, ciudad, tipo_empresa: tipo });
      setMsg("Cliente guardado.");
      resetForm();
      cargar();
    } catch (e) {
      setMsg(e instanceof Error ? `Error: ${e.message}` : "Error al guardar");
    }
  }

  async function borrar(id: string) {
    if (!confirm("¿Eliminar este cliente?")) return;
    await eliminarCliente(id);
    cargar();
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Reveal>
        <h1 className="mb-1 font-display text-3xl font-semibold tracking-tight text-foreground">Clientes</h1>
        <p className="mb-6 text-sm text-muted">Registra y gestiona la cartera de clientes.</p>
      </Reveal>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{editId ? "Editar cliente" : "Nuevo cliente"}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Field label="Razón social">
              <Input value={razon} onChange={(e) => setRazon(e.target.value)} placeholder="Nombre de la empresa" />
            </Field>
            <Field label="RUC">
              <Input value={ruc} onChange={(e) => setRuc(e.target.value)} placeholder="20XXXXXXXXX" />
            </Field>
            <Field label="Atención">
              <Input value={atencion} onChange={(e) => setAtencion(e.target.value)} placeholder="Persona de contacto" />
            </Field>
            <Field label="Ciudad">
              <Input value={ciudad} onChange={(e) => setCiudad(e.target.value)} placeholder="Trujillo / Piura / Lima" />
            </Field>
            <Field label="Tipo de empresa">
              <Select value={tipo} onChange={setTipo} options={toopts(TIPOS_EMPRESA)} />
            </Field>
            {msg && <p className="text-sm text-zinc-600">{msg}</p>}
            <div className="flex gap-2">
              <Button onClick={guardar} className="flex-1">
                <Plus className="h-4 w-4" /> {editId ? "Guardar" : "Agregar"}
              </Button>
              {editId && (
                <Button variant="outline" onClick={resetForm}>Cancelar</Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Field label="Buscar" className="mb-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Nombre o RUC..." className="pl-9" />
            </div>
          </Field>
          <Card>
            <CardHeader>
              <CardTitle>{rows.length} clientes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <SkeletonRows rows={4} />
              ) : rows.length === 0 ? (
                <div className="p-8 text-sm text-muted">Sin clientes.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHead>
                      <tr>
                        <TableHeaderCell>Razón social</TableHeaderCell>
                        <TableHeaderCell>RUC</TableHeaderCell>
                        <TableHeaderCell>Ciudad</TableHeaderCell>
                        <TableHeaderCell>Tipo</TableHeaderCell>
                        <TableHeaderCell></TableHeaderCell>
                      </tr>
                    </TableHead>
                    <TableBody>
                      {rows.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>
                            <div className="font-medium">{c.razon_social}</div>
                            <div className="text-xs text-zinc-400">{c.atencion}</div>
                          </TableCell>
                          <TableCell>{c.ruc}</TableCell>
                          <TableCell>{c.ciudad}</TableCell>
                          <TableCell>{c.tipo_empresa}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" onClick={() => editar(c)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" onClick={() => borrar(c.id)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
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
      </div>
    </div>
  );
}
