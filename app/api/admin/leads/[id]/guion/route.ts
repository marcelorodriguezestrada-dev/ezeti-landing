import { NextRequest, NextResponse } from "next/server";
import { getLeadsCol } from "@/lib/firebaseAdmin";
import { callGroq } from "@/lib/groq";
import type { Lead } from "@/lib/types";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ref = getLeadsCol().doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
    }
    const lead = { id: snap.id, ...snap.data() } as Lead;

    const systemPrompt = `Sos un vendedor consultivo experto en el primer contacto con leads. Tu estilo es el que se pide acá:
- Contacto inicial con MUCHA energía y emoción genuina -- transmitir que te entusiasma poder ayudar, no un tono robótico ni de call center.
- El objetivo del mensaje NO es cerrar la venta ni dar el diagnóstico ahí mismo -- es invitar directamente a una videollamada corta para que el lead cuente su problema y arme con el equipo (la "escuadra técnica") la mejor forma de resolverlo.
- Se manda un link de agendamiento (Cal.com) donde el lead elige el horario que más le sirve, sin ida y vuelta de mensajes coordinando.
- Nunca prometas resultados ni inventes casos de éxito -- el foco es la energía genuina y la invitación concreta a la llamada.

Devolvés SOLO el texto del mensaje, listo para pegar en WhatsApp o mail (nada de JSON, nada de explicación alrededor). Máximo 100 palabras. Si hay nombre del lead, usalo.`;

    const userPrompt = `Datos del lead:
- Nombre: ${lead.nombre}
- Llegó por: ${lead.producto} (canal: ${lead.origen})
- Contó esto: "${lead.mensaje || "no dejó mensaje, solo dejó sus datos de contacto"}"

Escribí el mensaje de primer contacto para este lead, invitándolo a agendar la videollamada a través del link (vos no conocés el link exacto, solo escribí "[LINK DE AGENDAMIENTO]" como placeholder donde correspondería pegarlo).`;

    const guion = await callGroq(userPrompt, systemPrompt, 400);

    await ref.update({ guionGenerado: guion.trim() });

    return NextResponse.json({ guion: guion.trim() });
  } catch (err) {
    console.error("Error en /api/admin/leads/[id]/guion:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
