import { NextRequest, NextResponse } from "next/server";
import { getProyectosCol } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    const snap = await getProyectosCol().orderBy("createdAt", "desc").get();
    const proyectos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json(proyectos);
  } catch (err) {
    console.error("Error en GET /api/admin/proyectos-dev:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.nombre) {
      return NextResponse.json({ error: "Falta el nombre del proyecto." }, { status: 400 });
    }
    const now = Date.now();
    const proyecto = {
      nombre: body.nombre,
      descripcion: body.descripcion || "",
      cliente: body.cliente || "",
      fechaEntrega: body.fechaEntrega ?? null,
      estado: "activo" as const,
      createdAt: now,
      updatedAt: now,
    };
    const doc = await getProyectosCol().add(proyecto);
    return NextResponse.json({ id: doc.id, ...proyecto });
  } catch (err) {
    console.error("Error en POST /api/admin/proyectos-dev:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
