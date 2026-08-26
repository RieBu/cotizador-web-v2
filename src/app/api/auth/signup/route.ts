import { NextResponse } from "next/server";
import {
  crearUsuario,
  hayUsuarios,
  signSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";
import { limitar } from "@/lib/rate-limit";

// Registro abierto SOLO como bootstrap: permite crear el primer administrador
// cuando la tabla de usuarios está vacía. Después, el registro queda cerrado.
export async function POST(req: Request) {
  const rl = limitar(req);
  if (!rl.ok) {
    return NextResponse.json({ error: "Demasiados intentos. Intenta en un minuto." }, { status: 429 });
  }
  try {
    if (await hayUsuarios()) {
      return NextResponse.json(
        { error: "El registro está cerrado. Pide a un administrador que cree tu cuenta." },
        { status: 403 },
      );
    }
    const body = await req.json();
    const email = (body.email ?? "") as string;
    const password = (body.password ?? "") as string;
    const nombre = (body.nombre ?? "") as string;
    if (!email || !password || !nombre) {
      return NextResponse.json({ error: "Completa nombre, correo y contraseña" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
    }
    const user = await crearUsuario(email, password, nombre, "ADMIN");
    const token = await signSession(user);
    const res = NextResponse.json({ user });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al crear la cuenta";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
