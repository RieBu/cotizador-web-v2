import { NextResponse } from "next/server";
import {
  verificarCredenciales,
  signSession,
  SESSION_COOKIE,
  sessionCookieOptions,
  estadoLockout,
  registrarFallo,
  resetIntentos,
} from "@/lib/auth";
import { limitar } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const rl = limitar(req);
  if (!rl.ok) {
    return NextResponse.json({ error: "Demasiados intentos. Espera un momento." }, { status: 429 });
  }
  try {
    const body = await req.json();
    const emailRaw = ((body.email ?? "") as string).toLowerCase();
    const password = (body.password ?? "") as string;

    const lock = await estadoLockout(emailRaw);
    if (lock.locked) {
      return NextResponse.json(
        { error: `Cuenta temporalmente bloqueada por intentos fallidos. Intenta en ~${lock.remainingMin} min.` },
        { status: 429 },
      );
    }

    const user = await verificarCredenciales(emailRaw, password);
    if (!user) {
      const nuevo = await registrarFallo(emailRaw);
      if (nuevo.locked) {
        return NextResponse.json(
          { error: `Demasiados intentos fallidos. Bloqueada por ${nuevo.remainingMin} min.` },
          { status: 429 },
        );
      }
      return NextResponse.json({ error: "Correo o contraseña incorrectos" }, { status: 401 });
    }

    await resetIntentos(emailRaw);
    const token = await signSession(user);
    const res = NextResponse.json({ user });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al iniciar sesión" },
      { status: 400 },
    );
  }
}
