import { NextRequest, NextResponse } from "next/server";
import { getTicketsCol } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const proyectoId = req.nextUrl.searchParams.get("proyectoId");
    let query = getTicketsCol().orderBy("createdAt", "desc") as FirebaseFirestore.Query;
    if (proyectoId) query = getTicketsCol().where("proyectoId", "==", proyectoId);
    const snap = await query.get();
    const tickets = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    // El orderBy de arriba no se puede combinar con el where sin un
    // índice compuesto en Firestore -- más simple ordenar acá mismo,
    // en memoria, ya que no son volúmenes grandes de tickets.
    tickets.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
    return NextResponse.json(tickets);
  } catch (err) {
    console.error("Error en GET /api/admin/tickets-dev:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.proyectoId || !body.titulo) {
      return NextResponse.json({ error: "Falta el proyecto o el título del ticket." }, { status: 400 });
    }
    const now = Date.now();
    const ticket = {
      proyectoId: body.proyectoId,
      titulo: body.titulo,
      descripcion: body.descripcion || "",
      estado: "backlog" as const,
      prioridad: body.prioridad || "media",
      createdAt: now,
      updatedAt: now,
      fechaHecho: null,
      subtareas: [],
      adjuntos: [],
      notas: [],
    };
    const doc = await getTicketsCol().add(ticket);
    return NextResponse.json({ id: doc.id, ...ticket });
  } catch (err) {
    console.error("Error en POST /api/admin/tickets-dev:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
