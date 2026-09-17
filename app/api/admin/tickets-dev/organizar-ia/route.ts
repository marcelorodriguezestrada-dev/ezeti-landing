import { NextRequest, NextResponse } from "next/server";
import { getTicketsCol } from "@/lib/firebaseAdmin";
import { callGroq } from "@/lib/groq";

const SYSTEM_PROMPT = `Separás notas de una reunión en tareas puntuales de desarrollo (tickets).
Te paso texto en bruto, puede venir como una lista, párrafos sueltos, o mezclado -- cada punto o idea distinta es UNA tarea.
Para cada una, devolvé un título corto y accionable (empezando con un verbo: "Agregar...", "Arreglar...", "Revisar..."), una descripción de una o dos líneas con el detalle si lo hay, y una prioridad (baja/media/alta) según lo urgente o importante que suene en el texto.
Si dos puntos del texto son en realidad la misma tarea repetida con otras palabras, devolvé una sola.
Respondé SOLO JSON válido, sin backticks ni texto alrededor, con esta forma exacta:
{"tareas": [{"titulo": "...", "descripcion": "...", "prioridad": "baja"|"media"|"alta"}]}`;

export async function POST(req: NextRequest) {
  try {
    const { proyectoId, texto } = await req.json();
    if (!proyectoId || !texto?.trim()) {
      return NextResponse.json({ error: "Falta el proyecto o el texto de la reunión." }, { status: 400 });
    }

    const respuesta = await callGroq(texto, SYSTEM_PROMPT, 2000);
    const limpio = respuesta.replace(/```json|```/g, "").trim();

    let tareas: { titulo: string; descripcion?: string; prioridad?: string }[] = [];
    try {
      const parsed = JSON.parse(limpio);
      tareas = Array.isArray(parsed.tareas) ? parsed.tareas : [];
    } catch (e) {
      console.error("La IA no devolvió JSON válido:", limpio);
      return NextResponse.json({ error: "La IA no pudo organizar el texto. Probá de nuevo, o cargá las tareas a mano." }, { status: 502 });
    }

    if (tareas.length === 0) {
      return NextResponse.json({ error: "No se encontró ninguna tarea en ese texto." }, { status: 400 });
    }

    const now = Date.now();
    const col = getTicketsCol();
    const batch = col.firestore.batch();
    const creados: Record<string, unknown>[] = [];

    for (const t of tareas) {
      if (!t.titulo) continue;
      const prioridad = ["baja", "media", "alta"].includes(t.prioridad || "") ? t.prioridad : "media";
      const ticket = {
        proyectoId,
        titulo: t.titulo,
        descripcion: t.descripcion || "",
        estado: "backlog" as const,
        prioridad,
        createdAt: now,
        updatedAt: now,
        fechaHecho: null,
        subtareas: [],
        adjuntos: [],
        notas: [],
      };
      const ref = col.doc();
      batch.set(ref, ticket);
      creados.push({ id: ref.id, ...ticket });
    }
    await batch.commit();

    return NextResponse.json({ tickets: creados });
  } catch (err) {
    console.error("Error en POST /api/admin/tickets-dev/organizar-ia:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
