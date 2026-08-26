import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdminAuth } from "@/lib/route";

export const PUT = requireAdminAuth(async (_user, req, ctx) => {
  const params = await (ctx?.params ?? Promise.resolve<Record<string, string>>({}));
  const body = await req.json();
  await query(
    `update tarifas set
       plan=$1, tipo=$2, nivel_ingreso=$3, regimen_tributario=$4,
       num_comprobantes=$5, num_trabajadores=$6, regimen_laboral=$7, monto=$8
     where id=$9`,
    [
      body.plan,
      body.tipo,
      body.nivel_ingreso ?? "",
      body.regimen_tributario ?? "",
      body.num_comprobantes ?? "",
      body.num_trabajadores ?? "",
      body.regimen_laboral ?? "",
      body.monto ?? 0,
      params.id,
    ],
  );
  return NextResponse.json({ ok: true });
});

export const DELETE = requireAdminAuth(async (_user, _req, ctx) => {
  const params = await (ctx?.params ?? Promise.resolve<Record<string, string>>({}));
  await query("delete from tarifas where id=$1", [params.id]);
  return NextResponse.json({ ok: true });
});
