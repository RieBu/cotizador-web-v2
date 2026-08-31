import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/route";
import { generarDocx, type DatosDocx } from "@/lib/docx";

export const POST = requireAuth(async (_user, req) => {
  const body = (await req.json()) as DatosDocx;
  if (!body.plan || !body.razon_social) {
    return NextResponse.json({ error: "Faltan datos para generar el documento" }, { status: 400 });
  }
  const buf = await generarDocx(body);
  const planSafe = (body.plan || "").replace(/[\\/:*?"<>|]/g, "-");
  const filename = `Cotizacion_${(body.numero || "").replace(/[\\/:*?"<>|]/g, "-")}_Plan_${planSafe}_${body.razon_social.replace(/[\\/:*?"<>|]/g, "")}.docx`;
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
});
