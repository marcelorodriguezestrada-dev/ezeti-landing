import { NextRequest, NextResponse } from "next/server";
import { getProyectosCol, getTicketsCol } from "@/lib/firebaseAdmin";

// Sin chequeo de contraseña a propósito -- es la ruta que alimenta la
// página pública /proyecto/[id], pensada para compartir con un cliente
// o el equipo sin que necesiten el login de admin. El id de Firestore
// ya funciona como "token" razonable (es largo y no adivinable a mano);
// no es data sensible como para justificar algo más elaborado.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const doc = await getProyectosCol().doc(id).get();
    if (!doc.exists) return NextResponse.json({ error: "No encontramos ese proyecto." }, { status: 404 });

    const ticketsSnap = await getTicketsCol().where("proyectoId", "==", id).get();
    const tickets = ticketsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    tickets.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));

    return NextResponse.json({ proyecto: { id: doc.id, ...doc.data() }, tickets });
  } catch (err) {
    console.error("Error en GET /api/proyecto-publico/[id]:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
