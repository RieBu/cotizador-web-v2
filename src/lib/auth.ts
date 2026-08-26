import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";

export const SESSION_COOKIE = "jys_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 días

export interface SessionUser {
  id: string;
  email: string;
  nombre: string;
  rol: "ADMIN" | "ASESOR";
}

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET no está definida");
  return new TextEncoder().encode(secret);
}

async function hash(text: string): Promise<string> {
  return bcrypt.hash(text, 10);
}

async function verifyHash(text: string, hashValue: string): Promise<boolean> {
  return bcrypt.compare(text, hashValue);
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({
    email: user.email,
    nombre: user.nombre,
    rol: user.rol,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const id = payload.sub;
    if (!id) return null;
    return {
      id,
      email: (payload.email as string) ?? "",
      nombre: (payload.nombre as string) ?? "",
      rol: payload.rol === "ADMIN" ? "ADMIN" : "ASESOR",
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE,
  };
}

// ---------------------------------------------------------------------------
// Usuarios en BD
// ---------------------------------------------------------------------------

export interface UsuarioRow {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  password_hash: string;
}

export async function buscarUsuarioPorEmail(email: string): Promise<UsuarioRow | null> {
  const { rows } = await query<UsuarioRow>(
    "select id, email, nombre, rol, password_hash from usuarios where lower(email) = lower($1)",
    [email],
  );
  return rows[0] ?? null;
}

export async function verificarCredenciales(
  email: string,
  password: string,
): Promise<SessionUser | null> {
  const user = await buscarUsuarioPorEmail(email);
  if (!user) return null;
  const ok = await verifyHash(password, user.password_hash);
  if (!ok) return null;
  return { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol === "ADMIN" ? "ADMIN" : "ASESOR" };
}

export async function crearUsuario(
  email: string,
  password: string,
  nombre: string,
  rolForzar?: "ADMIN" | "ASESOR",
): Promise<SessionUser> {
  const rol = rolForzar ?? "ASESOR";
  const passwordHash = await hash(password);
  const { rows: inserted } = await query<{ id: string }>(
    "insert into usuarios (email, nombre, rol, password_hash) values ($1, $2, $3, $4) returning id",
    [email.toLowerCase(), nombre, rol, passwordHash],
  );
  return { id: inserted[0].id, email: email.toLowerCase(), nombre, rol };
}

export async function hayUsuarios(): Promise<boolean> {
  const { rows } = await query<{ count: string }>("select count(*)::text as count from usuarios");
  return Number(rows[0]?.count ?? 0) > 0;
}

export async function listarUsuarios(): Promise<Omit<UsuarioRow, "password_hash">[]> {
  const { rows } = await query<Omit<UsuarioRow, "password_hash">>(
    "select id, email, nombre, rol from usuarios order by created_at",
  );
  return rows;
}

// ---------------------------------------------------------------------------
// Lockout de intentos de inicio de sesión (fail_count + bloqueo temporal)
// ---------------------------------------------------------------------------

const MAX_FALLOS = 5;
const LOCK_MINUTOS = 15;

export interface LockStatus {
  locked: boolean;
  remainingMin?: number;
}

export async function estadoLockout(email: string): Promise<LockStatus> {
  const { rows } = await query<{ locked_until: string }>(
    "select to_char(locked_until, 'YYYY-MM-DD\"T\"HH24:MI:SSOF') as locked_until from login_attempts where email = $1",
    [email.toLowerCase()],
  );
  if (!rows[0]?.locked_until) return { locked: false };
  const until = new Date(rows[0].locked_until).getTime();
  if (until <= Date.now()) return { locked: false };
  return { locked: true, remainingMin: Math.ceil((until - Date.now()) / 60000) };
}

export async function registrarFallo(email: string): Promise<LockStatus> {
  const key = email.toLowerCase();
  const { rows } = await query<{ fail_count: number }>(
    `insert into login_attempts (email, fail_count, updated_at)
     values ($1, 1, now())
     on conflict (email) do update set fail_count = login_attempts.fail_count + 1, updated_at = now()
     returning fail_count`,
    [key],
  );
  const fail = rows[0]?.fail_count ?? 1;
  if (fail >= MAX_FALLOS) {
    await query(
      "update login_attempts set locked_until = now() + ($1 || ' minutes')::interval, fail_count = 0 where email = $2",
      [String(LOCK_MINUTOS), key],
    );
    return { locked: true, remainingMin: LOCK_MINUTOS };
  }
  return { locked: false };
}

export async function resetIntentos(email: string): Promise<void> {
  await query("delete from login_attempts where email = $1", [email.toLowerCase()]);
}

export async function esAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.rol === "ADMIN";
}

export async function requireAuthUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw Object.assign(new Error("No autenticado"), { status: 401 });
  }
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireAuthUser();
  if (session.rol !== "ADMIN") {
    throw Object.assign(new Error("Requiere rol ADMIN"), { status: 403 });
  }
  return session;
}
