import { NextRequest, NextResponse } from "next/server";
import { getProspectosCol } from "@/lib/firebaseAdmin";
import type { Prospecto } from "@/lib/types";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { texto } = await req.json();
    if (!texto || !texto.trim()) {
      return NextResponse.json({ error: "La nota no puede estar vacía." }, { status: 400 });
    }
    const ref = getProspectosCol().doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "No encontramos ese prospecto." }, { status: 404 });
    }
    const p = snap.data() as Prospecto;
    const seguimiento = [...(p.seguimiento || []), { texto: texto.trim(), fecha: Date.now() }];
    await ref.update({ seguimiento, updatedAt: Date.now() });
    return NextResponse.json({ seguimiento });
  } catch (err) {
    console.error("Error en /api/admin/prospectos/[id]/seguimiento:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
