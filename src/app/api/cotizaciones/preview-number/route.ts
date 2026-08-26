import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAuth } from "@/lib/route";

export const GET = requireAuth(async () => {
  const { rows } = await query<{ preview_numero_cotizacion: string }>(
    "select preview_numero_cotizacion()",
  );
  return NextResponse.json({ numero: rows[0].preview_numero_cotizacion });
});
