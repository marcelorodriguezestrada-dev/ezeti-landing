import { NextResponse } from "next/server";
import { getSettingsDoc } from "@/lib/firebaseAdmin";

// Público a propósito -- el link de agendamiento no es un dato sensible,
// y la página de captura de leads (que también es pública) lo necesita.
export async function GET() {
  try {
    const snap = await getSettingsDoc().get();
    const data = snap.exists ? snap.data() : {};
    return NextResponse.json({ calLink: data?.calLink || "" });
  } catch (err) {
    console.error("Error en GET /api/settings-public:", err);
    return NextResponse.json({ calLink: "" });
  }
}
