import { NextRequest, NextResponse } from "next/server";
import { getProyectosCol, getTicketsCol } from "@/lib/firebaseAdmin";

// También sin password -- es justamente lo que permite que alguien del
// equipo o un cliente cargue un pedido sin tener que pedirte que lo
// hagas vos. Siempre entra como "pendiente"; el admin es quien decide
// después si pasa a "en progreso" desde el panel.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const proyectoDoc = await getProyectosCol().doc(id).get();
    if (!proyectoDoc.exists) return NextResponse.json({ error: "No encontramos ese proyecto." }, { status: 404 });

    const body = await req.json();
    if (!body.titulo?.trim()) {
      return NextResponse.json({ error: "Falta el título del ticket." }, { status: 400 });
    }

    const now = Date.now();
    const ticket = {
      proyectoId: id,
      titulo: body.titulo,
      descripcion: body.descripcion || "",
      // Se guarda quién lo pidió, si lo puso -- ayuda a saber de dónde
      // salió un ticket cargado desde afuera del panel de admin.
      solicitadoPor: body.solicitadoPor || "",
      estado: "pendiente" as const,
      prioridad: "media" as const,
      createdAt: now,
      updatedAt: now,
      fechaHecho: null,
    };
    const doc = await getTicketsCol().add(ticket);
    return NextResponse.json({ id: doc.id, ...ticket });
  } catch (err) {
    console.error("Error en POST /api/proyecto-publico/[id]/tickets:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
