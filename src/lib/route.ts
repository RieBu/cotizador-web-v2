import { NextResponse } from "next/server";
import { requireAuthUser, requireAdmin, type SessionUser } from "@/lib/auth";

type Handler = (
  user: SessionUser,
  req: Request,
  ctx?: { params: Promise<Record<string, string>> },
) => Promise<NextResponse>;

function errorResponse(err: unknown): NextResponse {
  const status = (err as { status?: number }).status ?? 500;
  const message =
    status >= 500 && !(err as Error).message
      ? "Error interno del servidor"
      : (err as Error).message || "Error interno del servidor";
  return NextResponse.json({ error: message }, { status });
}

/** Valida sesión de usuario autenticado; si falla responde 401 (o 403 según rol). */
export function requireAuth(handler: Handler) {
  return async (req: Request, ctx?: { params: Promise<Record<string, string>> }) => {
    try {
      const user = await requireAuthUser();
      return await handler(user, req, ctx);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

/** Valida sesión + rol ADMIN; si no es admin responde 403. */
export function requireAdminAuth(handler: Handler) {
  return async (req: Request, ctx?: { params: Promise<Record<string, string>> }) => {
    try {
      const user = await requireAdmin();
      return await handler(user, req, ctx);
    } catch (err) {
      return errorResponse(err);
    }
  };
}
