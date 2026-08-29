import { NextRequest, NextResponse } from "next/server";
import { getProspectosCol } from "@/lib/firebaseAdmin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const permitido = ["nombre", "empresa", "cargo", "contexto", "linkedinUrl", "sitioWebEmpresa", "productoOfrecido", "notasEncuentro", "status"] as const;
    const update: Record<string, unknown> = { updatedAt: Date.now() };
    for (const key of permitido) {
      if (body[key] !== undefined) update[key] = body[key];
    }
    await getProspectosCol().doc(id).update(update);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error en PATCH /api/admin/prospectos/[id]:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await getProspectosCol().doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error en DELETE /api/admin/prospectos/[id]:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
