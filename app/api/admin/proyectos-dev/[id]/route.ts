import { NextRequest, NextResponse } from "next/server";
import { getProyectosCol, getTicketsCol } from "@/lib/firebaseAdmin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const permitido = ["nombre", "descripcion", "cliente", "fechaEntrega", "estado"] as const;
    const update: Record<string, unknown> = { updatedAt: Date.now() };
    for (const key of permitido) {
      if (body[key] !== undefined) update[key] = body[key];
    }
    await getProyectosCol().doc(id).update(update);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error en PATCH /api/admin/proyectos-dev/[id]:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// Borra el proyecto Y todos sus tickets -- si no, quedan tickets
// huérfanos apuntando a un proyectoId que ya no existe, invisibles
// desde cualquier lado de la UI pero ocupando lugar en la base.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ticketsSnap = await getTicketsCol().where("proyectoId", "==", id).get();
    const batch = getProyectosCol().firestore.batch();
    ticketsSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(getProyectosCol().doc(id));
    await batch.commit();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error en DELETE /api/admin/proyectos-dev/[id]:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
