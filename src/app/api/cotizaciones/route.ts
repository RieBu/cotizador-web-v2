import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAuth } from "@/lib/route";

export const GET = requireAuth(async (_user, req) => {
  const url = new URL(req.url);
  const plan = url.searchParams.get("plan");
  const q = url.searchParams.get("q") ?? "";
  const params: unknown[] = [];
  const where: string[] = [];
  if (plan) {
    params.push(plan);
    where.push(`co.plan = $${params.length}`);
  }
  if (q) {
    params.push(`%${q}%`);
    where.push(`co.numero ilike $${params.length}`);
  }
  const whereSql = where.length ? `where ${where.join(" and ")}` : "";
  const { rows } = await query(
    `select co.*, c.razon_social, c.ruc, c.atencion, c.ciudad, c.tipo_empresa
     from cotizaciones co left join clientes c on c.id = co.cliente_id
     ${whereSql}
     order by co.created_at desc limit 300`,
    params,
  );
  const cotizaciones = (rows as Record<string, unknown>[]).map(rowToCotizacion);
  return NextResponse.json({ cotizaciones });
});

export const POST = requireAuth(async (_user, req) => {
  const body = await req.json();
  const { rows } = await query(
    `insert into cotizaciones
        (numero, fecha, cliente_id, plan, nivel_ingreso, regimen_tributario,
         regimen_laboral, num_trabajadores, num_comprobantes, descuento_tipo,
         descuento_porcentaje, descuento_monto, subtotal, total, servicios)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      returning *`,
    [
      body.numero,
      body.fecha,
      body.cliente_id ?? null,
      body.plan,
      body.nivel_ingreso ?? "",
      body.regimen_tributario ?? "",
      body.regimen_laboral ?? "",
      body.num_trabajadores ?? "",
      body.num_comprobantes ?? "",
      body.descuento_tipo ?? "",
      body.descuento_porcentaje ?? 0,
      body.descuento_monto ?? 0,
      body.subtotal,
      body.total,
      JSON.stringify(body.servicios ?? []),
    ],
  );
  // Sincronizar contador para numeración manual continua: si guarda 0400, el siguiente será 0401
  try {
    const raw = String(body.numero ?? "").trim();
    const part = raw.split("-")[0].replace(/\D/g, "");
    const n = parseInt(part, 10);
    if (Number.isFinite(n) && n > 0) {
      const siguiente = n + 1;
      await query(
        `update configuracion
         set valor = case when (valor::int < $1) then $1::text else valor end,
             updated_at = now()
         where clave = 'contador_cotizacion'`,
        [siguiente],
      );
    }
  } catch {
    // best-effort, no bloquea la creación
  }
  return NextResponse.json({ cotizacion: rows[0] }, { status: 201 });
});

function rowToCotizacion(r: Record<string, unknown>) {
  const cliente =
    r.razon_social != null
      ? {
          id: r.cliente_id,
          razon_social: r.razon_social,
          ruc: r.ruc,
          atencion: r.atencion,
          ciudad: r.ciudad,
          tipo_empresa: r.tipo_empresa,
        }
      : null;
  return {
    id: r.id,
    numero: r.numero,
    fecha: r.fecha,
    cliente_id: r.cliente_id,
    plan: r.plan,
    nivel_ingreso: r.nivel_ingreso,
    regimen_tributario: r.regimen_tributario,
    regimen_laboral: r.regimen_laboral,
    num_trabajadores: r.num_trabajadores,
    num_comprobantes: r.num_comprobantes,
    descuento_tipo: r.descuento_tipo,
    descuento_monto: r.descuento_monto,
    subtotal: Number(r.subtotal),
    total: Number(r.total),
    servicios: r.servicios ?? [],
    created_at: r.created_at,
    clientes: cliente,
  };
}
