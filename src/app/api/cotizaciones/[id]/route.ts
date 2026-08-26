import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAuth } from "@/lib/route";

export const GET = requireAuth(async (_user, _req, ctx) => {
  const params = await (ctx?.params ?? Promise.resolve<Record<string, string>>({}));
  const { rows } = await query("select * from cotizaciones where id=$1", [params.id]);
  return NextResponse.json({ cotizacion: rows[0] ?? null });
});
