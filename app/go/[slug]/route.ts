import { NextRequest, NextResponse } from "next/server";
import { getCampaignsCol, getVisitsCol, admin } from "@/lib/firebaseAdmin";

// Link público que va en el post de la red social (ej: ezeti.pro/go/x7k2p9).
// Cada click suma una visita en Firestore y redirige al destino real, y
// además queda un registro individual con fecha en "visits" para poder
// armar el desglose por día/mes/año en el dashboard.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const snap = await getCampaignsCol().where("slug", "==", slug).limit(1).get();

  if (snap.empty) {
    return NextResponse.redirect(new URL("/", "https://ezeti.pro"));
  }

  const doc = snap.docs[0];
  const data = doc.data();
  const now = Date.now();

  await Promise.all([
    doc.ref.update({ visitas: admin.firestore.FieldValue.increment(1) }),
    getVisitsCol().add({
      campaignId: doc.id,
      slug,
      producto: data.producto,
      plataforma: data.plataforma,
      timestamp: now,
      fecha: new Date(now).toISOString().split("T")[0], // "2026-07-31"
    }),
  ]);

  return NextResponse.redirect(data.destinoUrl);
}
