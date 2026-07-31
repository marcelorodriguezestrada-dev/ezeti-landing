import { NextRequest, NextResponse } from "next/server";
import { getCampaignsCol, admin } from "@/lib/firebaseAdmin";

// Link público que va en el post de la red social (ej: ezeti.pro/go/x7k2p9).
// Cada click suma una visita en Firestore y redirige al destino real.
// Sin esto, "visitas" sería un dato inventado -- con esto, es un conteo real.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const snap = await getCampaignsCol().where("slug", "==", slug).limit(1).get();

  if (snap.empty) {
    return NextResponse.redirect(new URL("/", "https://ezeti.pro"));
  }

  const doc = snap.docs[0];
  const data = doc.data();

  await doc.ref.update({ visitas: admin.firestore.FieldValue.increment(1) });

  return NextResponse.redirect(data.destinoUrl);
}