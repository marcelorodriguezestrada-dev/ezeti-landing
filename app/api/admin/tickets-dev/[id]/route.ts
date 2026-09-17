import { NextRequest, NextResponse } from "next/server";
import { getTicketsCol } from "@/lib/firebaseAdmin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const permitido = ["titulo", "descripcion", "estado", "prioridad", "subtareas", "adjuntos", "notas"] as const;
    const update: Record<string, unknown> = { updatedAt: Date.now() };
    for (const key of permitido) {
      if (body[key] !== undefined) update[key] = body[key];
    }
    // La fecha de "hecho" se calcula sola a partir del cambio de
    // estado -- no se manda desde el frontend, así no se puede quedar
    // desincronizada del estado real.
    if (body.estado === "hecho") update.fechaHecho = Date.now();
    else if (body.estado !== undefined) update.fechaHecho = null;

    await getTicketsCol().doc(id).update(update);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error en PATCH /api/admin/tickets-dev/[id]:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await getTicketsCol().doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error en DELETE /api/admin/tickets-dev/[id]:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
