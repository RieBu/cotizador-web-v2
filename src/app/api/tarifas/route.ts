import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAuth, requireAdminAuth } from "@/lib/route";

export const GET = requireAuth(async () => {
  const { rows } = await query<{
    id: string;
    plan: string;
    tipo: string;
    nivel_ingreso: string | null;
    regimen_tributario: string | null;
    num_comprobantes: string | null;
    num_trabajadores: string | null;
    regimen_laboral: string | null;
    monto: number | string;
  }>(
    "select id, plan, tipo, nivel_ingreso, regimen_tributario, num_comprobantes, num_trabajadores, regimen_laboral, monto from tarifas order by plan, tipo, nivel_ingreso, num_trabajadores",
  );
  return NextResponse.json({ tarifas: rows });
});

export const POST = requireAdminAuth(async (_user, req) => {
  const body = await req.json();
  const { rows } = await query(
    `insert into tarifas
       (plan, tipo, nivel_ingreso, regimen_tributario, num_comprobantes, num_trabajadores, regimen_laboral, monto)
     values ($1,$2,$3,$4,$5,$6,$7,$8) returning id`,
    [
      body.plan,
      body.tipo,
      body.nivel_ingreso ?? "",
      body.regimen_tributario ?? "",
      body.num_comprobantes ?? "",
      body.num_trabajadores ?? "",
      body.regimen_laboral ?? "",
      body.monto ?? 0,
    ],
  );
  return NextResponse.json({ id: rows[0].id }, { status: 201 });
});
