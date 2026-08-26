import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdminAuth } from "@/lib/route";

export const DELETE = requireAdminAuth(async (_user, _req, ctx) => {
  const params = await (ctx?.params ?? Promise.resolve<Record<string, string>>({}));
  await query("delete from clientes where id=$1", [params.id]);
  return NextResponse.json({ ok: true });
});
