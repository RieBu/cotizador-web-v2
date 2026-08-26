import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAuth } from "@/lib/route";

export const POST = requireAuth(async () => {
  const { rows } = await query<{ next_numero_cotizacion: string }>(
    "select next_numero_cotizacion()",
  );
  return NextResponse.json({ numero: rows[0].next_numero_cotizacion });
});
