import { NextRequest, NextResponse } from "next/server";
import { getSitesCol } from "@/lib/firebaseAdmin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const permitido = ["emoji", "nombre", "descripcion", "temaNegocio", "publico", "objetivoSugerido", "url", "activo", "facebookPageId", "facebookPageAccessToken"] as const;
    const update: Record<string, unknown> = {};
    for (const key of permitido) {
      if (body[key] !== undefined) update[key] = body[key];
    }
    await getSitesCol().doc(id).update(update);
    // Nunca devolvemos el token, ni siquiera el que acabamos de guardar.
    return NextResponse.json({ ok: true, hasFacebookToken: update.facebookPageAccessToken ? true : undefined });
  } catch (err) {
    console.error("Error en PATCH /api/admin/sites/[id]:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await getSitesCol().doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error en DELETE /api/admin/sites/[id]:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
