import { NextRequest, NextResponse } from "next/server";
import { getProspectosCol, getSitesCol } from "@/lib/firebaseAdmin";
import { callGroq } from "@/lib/groq";
import type { Prospecto, Site } from "@/lib/types";

// Extractor de texto bien simple: saca scripts/estilos/tags y colapsa espacios.
// No es un scraper sofisticado, pero para sacar el "de qué trata esta empresa"
// de una landing normal alcanza de sobra.
function extraerTextoDeHtml(html: string): string {
  const sinScripts = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
  const sinTags = sinScripts.replace(/<[^>]+>/g, " ");
  return sinTags.replace(/\s+/g, " ").trim().slice(0, 3000); // recortamos, no hace falta la página entera
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ref = getProspectosCol().doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "No encontramos ese prospecto." }, { status: 404 });
    }
    const p = { id: snap.id, ...snap.data() } as Prospecto;

    // Si dieron la web de la empresa, la leemos de verdad (esto sí es real,
    // no inventado -- a diferencia de "investigar en internet" en general,
    // que la IA no puede hacer sola).
    let textoSitioEmpresa = "";
    if (p.sitioWebEmpresa) {
      try {
        const res = await fetch(p.sitioWebEmpresa, { signal: AbortSignal.timeout(8000) });
        const html = await res.text();
        textoSitioEmpresa = extraerTextoDeHtml(html);
      } catch {
        textoSitioEmpresa = ""; // si no se pudo leer, seguimos igual sin esto
      }
    }

    // Catálogo real de lo que ofrece Ezeti, para que la IA proponga algo
    // concreto que existe, no que invente un producto genérico.
    const sitesSnap = await getSitesCol().where("activo", "==", true).get();
    const catalogo = sitesSnap.docs
      .map((d) => d.data() as Site)
      .map((s) => `- ${s.nombre}: ${s.descripcion}`)
      .join("\n");

    const systemPrompt = `Sos un estratega comercial senior de Ezeti, una consultora de soluciones con IA. Analizás un contacto real (una persona que se conoció en un evento, por referido, LinkedIn, etc.) y proponés cómo convertirlo en cliente.
Nunca inventás datos concretos sobre la persona o su empresa que no te dieron -- si falta información, decilo explícitamente en vez de inventar.
Sos concreto y accionable, no genérico ni con frases de manual de ventas.
Devolvés ÚNICAMENTE JSON válido, sin markdown ni texto alrededor, con esta forma exacta:
{
  "analisis": "2-4 oraciones: qué necesidad real podría tener esta persona/empresa según el contexto dado, y por qué podría ser un buen fit",
  "propuesta": "qué producto/servicio del catálogo de Ezeti le conviene ofrecer y por qué, en 2-3 oraciones concretas",
  "mensajeSugerido": "mensaje de apertura para LinkedIn o WhatsApp, máximo 80 palabras, tono cercano y profesional, sin sonar a venta fría -- referenciando cómo se conocieron"
}`;

    const userPrompt = `Datos del contacto:
- Nombre: ${p.nombre}
- Empresa: ${p.empresa || "no especificada"}
- Cargo: ${p.cargo || "no especificado"}
- Cómo lo conocí: ${p.contexto || "no especificado"}
- Qué se le ofreció o le interesó: ${p.productoOfrecido || "no especificado todavía"}
- Notas del encuentro: ${p.notasEncuentro || "sin notas"}
${textoSitioEmpresa ? `\nContenido real extraído del sitio web de su empresa (${p.sitioWebEmpresa}):\n"""${textoSitioEmpresa}"""` : ""}

Catálogo de productos/servicios de Ezeti disponibles para proponer:
${catalogo || "(no hay sitios activos cargados)"}

Analizá este contacto y proponé cómo avanzar.`;

    const raw = await callGroq(userPrompt, systemPrompt, 900);
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    await ref.update({
      analisisIA: parsed.analisis,
      propuestaIA: parsed.propuesta,
      mensajeSugerido: parsed.mensajeSugerido,
      updatedAt: Date.now(),
    });

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Error en /api/admin/prospectos/[id]/analizar:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
