import { NextRequest, NextResponse } from "next/server";
import { getLeadsCol, getSettingsDoc } from "@/lib/firebaseAdmin";

// Público -- es el link que clickea el lead desde la página de gracias
// para agendar la videollamada. Marca la intención en el CRM y redirige.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const settingsSnap = await getSettingsDoc().get();
  const calLink = settingsSnap.exists ? settingsSnap.data()?.calLink : null;
  const leadRef = getLeadsCol().doc(id);

  try {
    await leadRef.update({ status: "quiere_agendar" });
  } catch {
    // Si el lead no existe más, no rompemos el redirect igual.
  }

  if (!calLink) {
    return NextResponse.redirect(new URL("/", "https://ezeti.pro"));
  }

  return NextResponse.redirect(calLink);
}
