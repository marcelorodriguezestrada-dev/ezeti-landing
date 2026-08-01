import { NextRequest, NextResponse } from "next/server";
import { analyzeGithubRepo } from "@/lib/github";
import { callGroq } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const { repoUrl, url } = await req.json();
    if (!repoUrl) {
      return NextResponse.json({ error: "Falta la URL del repositorio de GitHub" }, { status: 400 });
    }

    const info = await analyzeGithubRepo(repoUrl);

    if (!info.readme && !info.landingSource && !info.descripcionRepo) {
      return NextResponse.json(
        { error: "El repo no tiene README, descripción, ni una página principal reconocible. Contame sobre el producto a mano en su lugar (modo ✨ Describir)." },
        { status: 422 }
      );
    }

    const systemPrompt = `Sos un analista de negocio que lee el código fuente y la documentación de un proyecto (README, descripción del repo, código de la página principal) y extrae de qué trata el negocio para armar campañas de marketing.

Prestá atención especial a: nombres de producto, precios, catálogos o listas de ítems que encuentres en el código -- si hay datos concretos (precios, cantidades, nombres reales de productos), usalos tal cual, no los inventes ni los cambies.

Devolvés ÚNICAMENTE JSON válido, sin texto ni markdown alrededor, con esta forma EXACTA:
{
  "emoji": "un emoji que represente el negocio",
  "nombre": "nombre corto del negocio/producto (2-4 palabras)",
  "descripcion": "1-2 frases vendiendo esto como PRODUCTO/TECNOLOGÍA/SERVICIO -- para campañas B2B o de venta directa de la solución",
  "temaNegocio": "1-2 frases vendiendo el RUBRO/PASIÓN detrás -- para contenido de marca sin mencionar tecnología ni plataformas, enfocado en el beneficio humano/emocional. Si encontraste productos/precios concretos en el código, mencionalos acá.",
  "publico": "a quién le vendría bien esto, en pocas palabras",
  "objetivoSugerido": "un objetivo de campaña razonable para este negocio"
}`;

    const userPrompt = `Repositorio: ${info.nombreRepo}
Descripción del repo: ${info.descripcionRepo || "(sin descripción)"}

${info.readme ? `README.md:\n"""\n${info.readme}\n"""\n` : ""}
${info.landingSource ? `Código de la página principal (${info.landingPath}):\n"""\n${info.landingSource}\n"""\n` : ""}`;

    const raw = await callGroq(userPrompt, systemPrompt, 900);
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();

    let extraido;
    try {
      extraido = JSON.parse(cleaned);
    } catch (e) {
      return NextResponse.json({ error: `La IA no devolvió JSON válido: ${(e as Error).message}` }, { status: 502 });
    }

    return NextResponse.json({ ...extraido, url: url || "" });
  } catch (err) {
    console.error("Error en /api/admin/sites/extract-github:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
