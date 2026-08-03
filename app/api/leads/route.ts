import { NextRequest, NextResponse } from "next/server";
import { getLeadsCol, getCampaignsCol } from "@/lib/firebaseAdmin";

// Este endpoint es PÚBLICO a propósito -- lo llaman formularios embebidos en
// landings externas (Tierra Viva, AuditIA, etc.), que corren en otros
// dominios. Por eso tiene headers CORS abiertos, a diferencia de todo lo
// que vive bajo /api/admin (eso sí exige la cookie de sesión).

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const { nombre, email, whatsapp, mensaje, campaign } = await req.json();

    if (!nombre || (!email && !whatsapp)) {
      return NextResponse.json(
        { error: "Falta el nombre y al menos un contacto (email o whatsapp)" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Si vino desde el link de una campaña (?campaign=slug en /lead), le
    // pegamos el producto real -- así en el CRM sabés qué campaña generó
    // cada lead, no solo que "alguien llenó un formulario".
    let producto = "Directo (sin campaña)";
    let campaignId: string | null = null;
    let origen = "directo";

    if (campaign) {
      const snap = await getCampaignsCol().where("slug", "==", campaign).limit(1).get();
      if (!snap.empty) {
        const doc = snap.docs[0];
        producto = doc.data().producto;
        campaignId = doc.id;
        origen = doc.data().plataforma || "directo";
      }
    }

    const lead = {
      nombre,
      email: email || "",
      whatsapp: whatsapp || "",
      mensaje: mensaje || "",
      producto,
      campaignId,
      origen,
      status: "nuevo" as const,
      guionGenerado: null,
      createdAt: Date.now(),
    };

    const doc = await getLeadsCol().add(lead);

    return NextResponse.json({ id: doc.id, ...lead }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("Error en POST /api/leads:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500, headers: CORS_HEADERS });
  }
}
