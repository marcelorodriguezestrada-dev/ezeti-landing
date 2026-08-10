import { NextRequest, NextResponse } from "next/server";
import { getCampaignsCol } from "@/lib/firebaseAdmin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Solo permitimos tocar estos campos desde el cliente -- nunca dejamos
    // que se pisen visitas/createdAt/slug por error desde el formulario.
    const permitido = [
      "status",
      "destinoUrl",
      "likes",
      "comentarios",
      "compartidos",
      "imagenFondo",
      "gastoPublicitario",
    ] as const;

    const update: Record<string, unknown> = {};
    for (const key of permitido) {
      if (body[key] !== undefined) update[key] = body[key];
    }

    if (body.status === "activa" && !body.skipPublishedAt) {
      update.publishedAt = Date.now();
    }

    await getCampaignsCol().doc(id).update(update);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error en PATCH /api/admin/campaigns/[id]:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await getCampaignsCol().doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error en DELETE /api/admin/campaigns/[id]:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
