import { NextRequest, NextResponse } from "next/server";
import { campaignsCol } from "@/lib/firebaseAdmin";
import { callGroq } from "@/lib/groq";
import { generateSlug } from "@/lib/slug";
import type { Plataforma, CampaignVariant } from "@/lib/types";

const LIMITES_PLATAFORMA: Record<Plataforma, string> = {
  instagram: "Caption de hasta 150 palabras, tono cercano, termina con una pregunta o CTA claro.",
  linkedin: "Post de hasta 200 palabras, tono profesional pero humano, con un insight o aprendizaje, sin sonar a folleto de venta.",
  facebook: "Texto de hasta 120 palabras, directo, con beneficio concreto y CTA simple.",
  tiktok: "Guion corto de video de 30-45 segundos: gancho en las primeras 2 líneas, desarrollo breve, cierre con CTA. Formato guion, no caption.",
};

export async function POST(req: NextRequest) {
  try {
    const { producto, objetivo, publico, tono, plataforma, destinoUrl } = await req.json();

    if (!producto || !objetivo || !plataforma || !destinoUrl) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: producto, objetivo, plataforma, destinoUrl" },
        { status: 400 }
      );
    }

    const lineamiento = LIMITES_PLATAFORMA[plataforma as Plataforma] || LIMITES_PLATAFORMA.instagram;

    const systemPrompt = `Sos copywriter senior especializado en marketing digital para redes sociales en LATAM/Argentina.
Escribís copy que vende sin sonar a venta forzada: directo, con un beneficio concreto, cero relleno.
Nunca inventás cifras de resultados, testimonios o clientes que no te dieron.
Devolvés ÚNICAMENTE JSON válido, sin texto ni markdown alrededor, con esta forma exacta:
{
  "variantes": [
    { "texto": "...", "hashtags": ["...", "..."] },
    { "texto": "...", "hashtags": ["...", "..."] },
    { "texto": "...", "hashtags": ["...", "..."] }
  ]
}
Las 3 variantes deben tener ángulos distintos entre sí (ej: una centrada en el problema, otra en el resultado, otra en la urgencia/oportunidad) — no repitas la misma idea con sinónimos.`;

    const userPrompt = `Generá 3 variantes de copy para ${plataforma}.

Producto/servicio: ${producto}
Objetivo de la campaña: ${objetivo}
Público objetivo: ${publico || "no especificado, usá criterio general"}
Tono deseado: ${tono || "profesional y cercano"}

Lineamiento de formato para esta plataforma: ${lineamiento}

Incluí 4-6 hashtags relevantes por variante (sin el símbolo #, lo agrego yo después).`;

    const raw = await callGroq(userPrompt, systemPrompt, 1500);
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();

    let variantes: CampaignVariant[];
    try {
      variantes = JSON.parse(cleaned).variantes;
    } catch (e) {
      return NextResponse.json(
        { error: `La IA no devolvió JSON válido: ${(e as Error).message}` },
        { status: 502 }
      );
    }

    const slug = generateSlug();
    const campaign = {
      producto,
      objetivo,
      publico: publico || "",
      tono: tono || "",
      plataforma,
      variantes,
      varianteElegida: 0,
      destinoUrl,
      slug,
      status: "borrador" as const,
      visitas: 0,
      likes: 0,
      comentarios: 0,
      compartidos: 0,
      createdAt: Date.now(),
      publishedAt: null,
    };

    const doc = await campaignsCol.add(campaign);
    return NextResponse.json({ id: doc.id, ...campaign });
  } catch (err) {
    console.error("Error en /api/admin/campaigns/generate:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
