"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, ShieldCheck, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { Reveal } from "@/components/motion";
import { listarUsuarios, crearUsuario, type Usuario } from "@/lib/datos";

const toopts = (arr: string[]): SelectOption[] => arr.map((a) => ({ label: a, value: a }));

export default function UsuariosPage() {
  const [rows, setRows] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("ASESOR");

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listarUsuarios());
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function crear() {
    if (!email.trim() || !password || !nombre.trim()) return;
    setMsg("");
    try {
      await crearUsuario({ email: email.trim(), password, nombre: nombre.trim(), rol });
      setMsg("Usuario creado.");
      setEmail(""); setPassword(""); setNombre("");
      cargar();
    } catch (e) {
      setMsg(e instanceof Error ? `Error: ${e.message}` : "Error al crear");
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Reveal>
        <h1 className="mb-1 font-display text-3xl font-semibold tracking-tight text-foreground">Usuarios</h1>
        <p className="mb-6 text-sm text-muted">Solo los administradores pueden crear cuentas.</p>
      </Reveal>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Nuevo usuario</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Field label="Nombre">
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre completo" />
            </Field>
            <Field label="Email">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@jys.com" type="email" />
            </Field>
            <Field label="Contraseña (mín. 8)">
              <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" type="password" />
            </Field>
            <Field label="Rol">
              <Select value={rol} onChange={setRol} options={toopts(["ADMIN", "ASESOR"])} />
            </Field>
            {msg && <p className="text-sm text-zinc-600">{msg}</p>}
            <Button onClick={crear} className="gap-2">
              <Plus className="h-4 w-4" /> Crear usuario
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-lg">{rows.length} usuarios</CardTitle>
            <Button variant="ghost" onClick={cargar} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Actualizar
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-sm text-muted">Cargando…</div>
            ) : rows.length === 0 ? (
              <div className="p-8 text-sm text-muted">Sin usuarios.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHead>
                    <tr>
                      <TableHeaderCell>Nombre</TableHeaderCell>
                      <TableHeaderCell>Email</TableHeaderCell>
                      <TableHeaderCell>Rol</TableHeaderCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {rows.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          <span className="flex items-center gap-2">
                            {u.rol === "ADMIN" ? <ShieldCheck className="h-4 w-4 text-primary" /> : <UserIcon className="h-4 w-4 text-muted" />}
                            {u.nombre || "—"}
                          </span>
                        </TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge variant={u.rol === "ADMIN" ? "accent" : "default"}>{u.rol}</Badge>
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
  );
}
