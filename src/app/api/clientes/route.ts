import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAuth } from "@/lib/route";

export const GET = requireAuth(async (_user, req) => {
  const url = new URL(req.url);
  const ruc = url.searchParams.get("ruc");
  if (ruc) {
    const { rows } = await query("select * from clientes where ruc=$1", [ruc]);
    return NextResponse.json({ cliente: rows[0] ?? null });
  }
  const q = url.searchParams.get("q") ?? "";
  const params: unknown[] = [];
  let where = "";
  if (q) {
    where = "where razon_social ilike $1 or ruc ilike $2";
    params.push(`%${q}%`, `%${q}%`);
  }
  const { rows } = await query(
    `select id, razon_social, ruc, atencion, ciudad, tipo_empresa from clientes ${where} order by razon_social limit 200`,
    params,
  );
  return NextResponse.json({ clientes: rows });
});

export const POST = requireAuth(async (_user, req) => {
  const body = await req.json();
  const { rows } = await query(
    `insert into clientes (razon_social, ruc, atencion, ciudad, tipo_empresa)
     values ($1,$2,$3,$4,$5)
     on conflict (ruc) do update set
       razon_social=excluded.razon_social,
       atencion=excluded.atencion,
       ciudad=excluded.ciudad,
       tipo_empresa=excluded.tipo_empresa
     returning id, razon_social, ruc, atencion, ciudad, tipo_empresa`,
    [
      body.razon_social,
      body.ruc || null,
      body.atencion || null,
      body.ciudad || null,
      body.tipo_empresa || "EIRL",
    ],
  );
  return NextResponse.json({ cliente: rows[0] }, { status: 201 });
});
