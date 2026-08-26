import { NextResponse } from "next/server";
import { crearUsuario, listarUsuarios } from "@/lib/auth";
import { requireAdminAuth } from "@/lib/route";

export const GET = requireAdminAuth(async () => {
  const usuarios = await listarUsuarios();
  return NextResponse.json({ usuarios });
});

export const POST = requireAdminAuth(async (_user, req) => {
  const body = await req.json();
  const email = (body.email ?? "") as string;
  const password = (body.password ?? "") as string;
  const nombre = (body.nombre ?? "") as string;
  const rol = (body.rol ?? "ASESOR") as "ADMIN" | "ASESOR";

  if (!email || !password || !nombre) {
    return NextResponse.json({ error: "Completa nombre, correo y contraseña" }, { status: 400 });
  }
  if (!["ADMIN", "ASESOR"].includes(rol)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
  }

  const user = await crearUsuario(email, password, nombre, rol);
  return NextResponse.json({ user }, { status: 201 });
});
