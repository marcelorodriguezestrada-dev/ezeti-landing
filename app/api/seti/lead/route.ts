import { NextRequest, NextResponse } from "next/server";
import { getLeadsCol } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { nombre, email, whatsapp } = await req.json();

    if (!nombre || (!email && !whatsapp)) {
      return NextResponse.json({ error: "Falta el nombre y al menos un contacto (email o whatsapp)." }, { status: 400 });
    }

    const lead = {
      nombre,
      email: email || "",
      whatsapp: whatsapp || "",
      mensaje: "",
      producto: "Seti — producto interactivo",
      campaignId: null,
      origen: "seti_interactivo",
      status: "nuevo" as const,
      guionGenerado: null,
      createdAt: Date.now(),
    };

    const doc = await getLeadsCol().add(lead);
    return NextResponse.json({ id: doc.id, ...lead });
  } catch (err) {
    console.error("Error en POST /api/seti/lead:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
