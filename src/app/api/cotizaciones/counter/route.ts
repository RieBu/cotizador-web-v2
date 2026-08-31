import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdminAuth } from "@/lib/route";

// Establece el contador manualmente: si envías { numero: "0400-2026" } o { valor: 400 }
// el siguiente next_numero_cotizacion() será 0401-2026. Solo ADMIN.
export const PUT = requireAdminAuth(async (_user, req) => {
  const body = (await req.json().catch(() => ({}))) as { valor?: number | string; numero?: string };
  let valor: number | null = null;
  if (body.numero) {
    const part = String(body.numero).split("-")[0].replace(/\D/g, "");
    const n = parseInt(part, 10);
    if (Number.isFinite(n) && n > 0) valor = n;
  } else if (body.valor != null) {
    const n = typeof body.valor === "string" ? parseInt(String(body.valor).replace(/\D/g, ""), 10) : Number(body.valor);
    if (Number.isFinite(n) && n > 0) valor = n;
  }
  if (valor == null) {
    return NextResponse.json({ error: "Valor inválido. Envía { valor: 498 } o { numero: '0498-2026' }" }, { status: 400 });
  }
  await query(
    `insert into configuracion (clave, valor, updated_at) values ('contador_cotizacion', $1::text, now())
     on conflict (clave) do update set valor = $1::text, updated_at = now()`,
    [String(valor)],
  );
  const { rows } = await query<{ preview_numero_cotizacion: string }>("select preview_numero_cotizacion()");
  return NextResponse.json({ valor, preview: rows[0].preview_numero_cotizacion });
});

export const GET = requireAdminAuth(async () => {
  const { rows } = await query<{ valor: string }>("select valor from configuracion where clave='contador_cotizacion'");
  const valor = rows[0]?.valor ?? "1";
  const preview = await query<{ preview_numero_cotizacion: string }>("select preview_numero_cotizacion()");
  return NextResponse.json({ valor, preview: preview.rows[0].preview_numero_cotizacion });
});
