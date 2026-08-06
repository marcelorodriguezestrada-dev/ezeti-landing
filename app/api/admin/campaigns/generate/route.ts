import { NextRequest, NextResponse } from "next/server";
import { getCampaignsCol } from "@/lib/firebaseAdmin";
import { callGroq } from "@/lib/groq";
import { generateSlug } from "@/lib/slug";
import { buildUtmLinks } from "@/lib/utm";
import type { Plataforma, CampaignPost, CalendarioItem } from "@/lib/types";

const LINEAMIENTOS: Record<Plataforma, string> = {
  instagram: "Mezclá formatos Feed, Story y Reel. Captions de hasta 150 palabras, tono cercano, cierre con pregunta o CTA claro.",
  linkedin: "Posts de hasta 200 palabras, tono profesional pero humano, con un insight real, sin sonar a folleto de venta.",
  facebook: "Textos directos de hasta 120 palabras, beneficio concreto, CTA simple.",
  tiktok: "Guiones de video de 30-45 segundos: gancho en las primeras 2 líneas, desarrollo breve, cierre con CTA. Formato guion, no caption.",
};

export async function POST(req: NextRequest) {
  try {
    const { producto, objetivo, publico, tono, plataforma, destinoUrl, cantPosts, tipoCampana } = await req.json();

    if (!producto || !objetivo || !plataforma || !destinoUrl) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: producto, objetivo, plataforma, destinoUrl" },
        { status: 400 }
      );
    }

    const cantidad = Math.min(Math.max(Number(cantPosts) || 5, 1), 10);
    const lineamiento = LINEAMIENTOS[plataforma as Plataforma] || LINEAMIENTOS.instagram;
    const esContenidoDeRubro = tipoCampana === "negocio";

    // Generamos el slug ANTES del prompt: el link de tracking se agrega
    // siempre de forma determinística (ver más abajo y en el frontend),
    // no depende de que la IA decida escribirlo bien.
    const slug = generateSlug();

    const systemPrompt = esContenidoDeRubro
      ? `Sos estratega de contenidos y copywriter senior para redes sociales en LATAM/Argentina.
Armás contenido genuino sobre un tema/rubro puntual -- NO estás vendiendo tecnología, IA, ni ninguna plataforma. Es marketing de producto/estilo de vida: el objetivo es que el público se enamore del tema en sí (el hobby, el cuidado, la pasión detrás del negocio), no que sepa que "hay una app".
Prohibido mencionar palabras como "IA", "inteligencia artificial", "plataforma", "tecnología", "app" o similares -- el contenido tiene que sonar 100% humano y apasionado por el tema, como lo escribiría alguien que ama ese rubro.
Nunca inventás cifras de resultados, testimonios o clientes que no te dieron.
Devolvés ÚNICAMENTE JSON válido, sin texto ni markdown alrededor, con esta forma EXACTA:
{
  "posts": [
    { "titulo": "...", "texto": "...", "hashtags": ["...", "..."], "formato": "Feed", "horaOptima": "09:00", "cta": "...", "tipVisual": "descripción breve de qué imagen/video acompañaría este post" }
  ],
  "calendario": [
    { "dia": 0, "postIndex": 0, "nota": "por qué publicar este post primero" }
  ]
}
"titulo" es el titular grande que va a leer el cliente en la pieza gráfica (imagen de Instagram/Story) -- máximo 8 palabras, un gancho real y autocontenido (no una meta interna de marketing, no repitas el objetivo de la campaña palabra por palabra). Cada post necesita un "titulo" distinto, coherente con su "texto".
"dia" es el offset en días desde hoy (0 = hoy). Distribuí los posts a lo largo de 10-14 días, no todos el mismo día.`
      : `Sos estratega de marketing digital y copywriter senior para redes sociales en LATAM/Argentina.
Armás campañas completas y listas para ejecutar: no un solo post suelto, sino una secuencia coherente de posts que juntos cuentan una historia (ej: problema → enfoque → prueba/ejemplo → oferta → urgencia), sin repetir la misma idea con sinónimos.
Nunca inventás cifras de resultados, testimonios o clientes que no te dieron.
Devolvés ÚNICAMENTE JSON válido, sin texto ni markdown alrededor, con esta forma EXACTA:
{
  "posts": [
    { "titulo": "...", "texto": "...", "hashtags": ["...", "..."], "formato": "Feed", "horaOptima": "09:00", "cta": "...", "tipVisual": "descripción breve de qué imagen/video acompañaría este post" }
  ],
  "calendario": [
    { "dia": 0, "postIndex": 0, "nota": "por qué publicar este post primero" }
  ]
}
"titulo" es el titular grande que va a leer el cliente en la pieza gráfica (imagen de Instagram/Story) -- máximo 8 palabras, un gancho real y autocontenido (no una meta interna de marketing, no repitas el objetivo de la campaña palabra por palabra). Cada post necesita un "titulo" distinto, coherente con su "texto".
"dia" es el offset en días desde hoy (0 = hoy). Distribuí los posts a lo largo de 10-14 días, no todos el mismo día.`;

    const userPrompt = `Generá una campaña de ${cantidad} posts para ${plataforma}.

Producto/servicio: ${producto}
Objetivo de la campaña: ${objetivo}
Público objetivo: ${publico || "no especificado, usá criterio general"}
Tono deseado: ${tono || "profesional y cercano"}

Lineamiento de formato para esta plataforma: ${lineamiento}

Cada post necesita: titulo (el gancho corto que se va a ver grande en la imagen, distinto en cada post), texto, 4-6 hashtags (sin el símbolo #), formato, horaOptima (mejor horario estimado para publicar según el hábito general de la plataforma), cta, y tipVisual.
El array "calendario" debe tener exactamente ${cantidad} entradas, una por post, en el orden en que conviene publicarlos.

Importante sobre el link: NO escribas ninguna URL dentro de "texto" -- el link de la campaña se agrega aparte, siempre, automáticamente. En "cta" simplemente indicá la acción (ej: "Escribinos para más info", "Conocé más acá 👇"), sin mencionar "bio" ni pegar la URL vos.`;

    const raw = await callGroq(userPrompt, systemPrompt, 3500);
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();

    let posts: CampaignPost[];
    let calendario: CalendarioItem[];
    try {
      const parsed = JSON.parse(cleaned);
      posts = parsed.posts;
      calendario = parsed.calendario;
    } catch (e) {
      return NextResponse.json(
        { error: `La IA no devolvió JSON válido: ${(e as Error).message}` },
        { status: 502 }
      );
    }

    const utmLinks = buildUtmLinks(destinoUrl, plataforma as Plataforma, slug);

    const campaign = {
      producto,
      objetivo,
      publico: publico || "",
      tono: tono || "",
      plataforma,
      tipoCampana: esContenidoDeRubro ? "negocio" : "tecnologia",
      posts,
      calendario,
      utmLinks,
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

    const doc = await getCampaignsCol().add(campaign);
    return NextResponse.json({ id: doc.id, ...campaign });
  } catch (err) {
    console.error("Error en /api/admin/campaigns/generate:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
