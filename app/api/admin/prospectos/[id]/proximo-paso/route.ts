import { NextRequest, NextResponse } from "next/server";
import { getProspectosCol } from "@/lib/firebaseAdmin";
import { callGroq } from "@/lib/groq";
import type { Prospecto } from "@/lib/types";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ref = getProspectosCol().doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "No encontramos ese prospecto." }, { status: 404 });
    }
    const p = { id: snap.id, ...snap.data() } as Prospecto;

    const dias = Math.round((Date.now() - (p.seguimiento?.[p.seguimiento.length - 1]?.fecha || p.createdAt)) / 86400000);

    const historial = (p.seguimiento || [])
      .map((s) => `- (${new Date(s.fecha).toLocaleDateString("es-AR")}) ${s.texto}`)
      .join("\n") || "(sin notas de seguimiento todavía)";

    const systemPrompt = `Sos un coach de ventas B2B pragmático. Mirás el historial real de un contacto comercial y decís, sin vueltas, cuál es el próximo paso concreto -- no frases motivacionales genéricas.
Si hace mucho que no hay contacto, decilo directo y sugerí retomar. Si el contacto está frío o no contestó varias veces, es válido sugerir dejarlo enfriar o cerrar como perdido -- no insistas por insistir.
Devolvés SOLO el texto de la sugerencia (nada de JSON), máximo 60 palabras, tono directo y útil.`;

    const userPrompt = `Contacto: ${p.nombre} (${p.cargo || "sin cargo"} en ${p.empresa || "empresa no especificada"})
Estado actual: ${p.status}
Producto en discusión: ${p.productoOfrecido || "no definido todavía"}
Hace ${dias} día(s) que no hay una nota nueva.

Historial de seguimiento:
${historial}

¿Cuál es el próximo paso concreto?`;

    const sugerencia = await callGroq(userPrompt, systemPrompt, 200);

    await ref.update({ proximoPasoIA: sugerencia.trim(), updatedAt: Date.now() });

    return NextResponse.json({ proximoPasoIA: sugerencia.trim() });
  } catch (err) {
    console.error("Error en /api/admin/prospectos/[id]/proximo-paso:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
