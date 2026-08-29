import { NextRequest, NextResponse } from "next/server";
import { getProspectosCol } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    const snap = await getProspectosCol().orderBy("updatedAt", "desc").get();
    const prospectos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json(prospectos);
  } catch (err) {
    console.error("Error en GET /api/admin/prospectos:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.nombre) {
      return NextResponse.json({ error: "Falta el nombre." }, { status: 400 });
    }
    const now = Date.now();
    const prospecto = {
      nombre: body.nombre,
      empresa: body.empresa || "",
      cargo: body.cargo || "",
      contexto: body.contexto || "",
      linkedinUrl: body.linkedinUrl || "",
      sitioWebEmpresa: body.sitioWebEmpresa || "",
      productoOfrecido: body.productoOfrecido || "",
      notasEncuentro: body.notasEncuentro || "",
      analisisIA: null,
      propuestaIA: null,
      mensajeSugerido: null,
      proximoPasoIA: null,
      status: "nuevo" as const,
      seguimiento: [],
      createdAt: now,
      updatedAt: now,
    };
    const doc = await getProspectosCol().add(prospecto);
    return NextResponse.json({ id: doc.id, ...prospecto });
  } catch (err) {
    console.error("Error en POST /api/admin/prospectos:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
