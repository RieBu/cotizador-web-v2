"use client";

import type { TarifaFila } from "@/lib/calculos/types";

type FilaTarifa = TarifaFila & { id: string };

export function mapTarifaDB(f: FilaTarifa): TarifaFila {
  return {
    plan: f.plan,
    tipo: f.tipo,
    nivel_ingreso: f.nivel_ingreso ?? "",
    regimen_tributario: f.regimen_tributario ?? "",
    num_comprobantes: f.num_comprobantes ?? "",
    num_trabajadores: f.num_trabajadores ?? "",
    regimen_laboral: f.regimen_laboral ?? "",
    monto: Number(f.monto),
  };
}

async function api<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Error de servidor");
  return data as T;
}

// ---------------------------------------------------------------------------
// TARIFAS
// ---------------------------------------------------------------------------

export async function cargarTarifas(): Promise<TarifaFila[]> {
  const data = await api<{ tarifas: FilaTarifa[] }>("/api/tarifas");
  return data.tarifas.map(mapTarifaDB);
}

export async function upsertTarifa(fila: TarifaFila, id?: string): Promise<void> {
  if (id) {
    await api(`/api/tarifas/${id}`, { method: "PUT", body: JSON.stringify(fila) });
  } else {
    await api("/api/tarifas", { method: "POST", body: JSON.stringify(fila) });
  }
}

export async function eliminarTarifa(id: string): Promise<void> {
  await api(`/api/tarifas/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// CLIENTES
// ---------------------------------------------------------------------------

export interface Cliente {
  id: string;
  razon_social: string;
  ruc: string | null;
  atencion: string | null;
  ciudad: string | null;
  tipo_empresa: string;
}

export interface InputCliente {
  razon_social: string;
  ruc?: string;
  atencion?: string;
  ciudad?: string;
  tipo_empresa?: string;
}

export async function buscarClientePorRuc(ruc: string): Promise<Cliente | null> {
  if (!ruc) return null;
  const data = await api<{ cliente: Cliente | null }>(`/api/clientes?ruc=${encodeURIComponent(ruc)}`);
  return data.cliente;
}

export async function listarClientes(busqueda = ""): Promise<Cliente[]> {
  const data = await api<{ clientes: Cliente[] }>(
    `/api/clientes?q=${encodeURIComponent(busqueda)}`,
  );
  return data.clientes ?? [];
}

export async function guardarCliente(input: InputCliente): Promise<Cliente> {
  const data = await api<{ cliente: Cliente }>("/api/clientes", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.cliente;
}

export async function eliminarCliente(id: string): Promise<void> {
  await api(`/api/clientes/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// COTIZACIONES
// ---------------------------------------------------------------------------

export interface Cotizacion {
  id: string;
  numero: string;
  fecha: string;
  cliente_id: string | null;
  plan: string;
  nivel_ingreso: string;
  regimen_tributario: string;
  regimen_laboral: string;
  num_trabajadores: string;
  num_comprobantes: string;
  descuento_tipo: string;
  descuento_monto: number;
  subtotal: number;
  total: number;
  servicios: { descripcion: string; monto: number }[];
  created_at: string;
  clientes?: Cliente;
}

export interface InputCotizacion {
  numero: string;
  fecha: string;
  cliente_id: string | null;
  plan: string;
  nivel_ingreso?: string;
  regimen_tributario?: string;
  regimen_laboral?: string;
  num_trabajadores?: string;
  num_comprobantes?: string;
  descuento_tipo: string;
  descuento_monto: number;
  subtotal: number;
  total: number;
  servicios: { descripcion: string; monto: number }[];
}

export async function crearCotizacion(input: InputCotizacion): Promise<Cotizacion> {
  const data = await api<{ cotizacion: Cotizacion }>("/api/cotizaciones", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.cotizacion;
}

export async function listarCotizaciones(opts?: {
  plan?: string;
  busqueda?: string;
}): Promise<Cotizacion[]> {
  const params = new URLSearchParams();
  if (opts?.plan) params.set("plan", opts.plan);
  if (opts?.busqueda) params.set("q", opts.busqueda);
  const data = await api<{ cotizaciones: Cotizacion[] }>(`/api/cotizaciones?${params.toString()}`);
  return data.cotizaciones ?? [];
}

export async function obtenerCotizacion(id: string): Promise<Cotizacion | null> {
  const data = await api<{ cotizacion: Cotizacion | null }>(`/api/cotizaciones/${id}`);
  return data.cotizacion;
}

export async function nextNumero(): Promise<string> {
  const data = await api<{ numero: string }>("/api/cotizaciones/next", { method: "POST" });
  return data.numero;
}

export async function previewNumero(): Promise<string> {
  const data = await api<{ numero: string }>("/api/cotizaciones/preview-number");
  return data.numero;
}

// ---------------------------------------------------------------------------
// USUARIOS (solo ADMIN)
// ---------------------------------------------------------------------------

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: string;
}

export async function listarUsuarios(): Promise<Usuario[]> {
  const data = await api<{ usuarios: Usuario[] }>("/api/auth/users");
  return data.usuarios ?? [];
}

export async function crearUsuario(input: {
  email: string;
  password: string;
  nombre: string;
  rol: string;
}): Promise<Usuario> {
  const data = await api<{ user: Usuario }>("/api/auth/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.user;
}
