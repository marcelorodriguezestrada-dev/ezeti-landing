import { NextRequest, NextResponse } from "next/server";
import { getLeadsCol } from "@/lib/firebaseAdmin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { tipoNegocio, objetivoSemilla, etapaActual, detalleLibre } = await req.json();

    const update: Record<string, string> = {};
    if (tipoNegocio !== undefined) update.tipoNegocio = tipoNegocio;
    if (objetivoSemilla !== undefined) update.objetivoSemilla = objetivoSemilla;
    if (etapaActual !== undefined) update.etapaActual = etapaActual;
    if (detalleLibre !== undefined) update.detalleLibre = detalleLibre.slice(0, 200); // tope duro, no dejamos que se cuele un prompt largo acá

    await getLeadsCol().doc(id).update(update);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error en PATCH /api/seti/lead/[id]:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
