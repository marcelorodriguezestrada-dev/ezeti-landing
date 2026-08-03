import { NextRequest, NextResponse } from "next/server";
import { callGroq } from "@/lib/groq";

// Le pasás cualquier texto suelto sobre tu negocio (una descripción, el
// texto de tu web pegado, notas de WhatsApp, lo que tengas) y la IA lo
// estructura en los campos que necesita el generador de campañas.
// Esto NO guarda nada -- solo devuelve los campos para que los revises
// (y ajustes si hace falta) antes de guardar el sitio de verdad.
export async function POST(req: NextRequest) {
  try {
    const { texto, url } = await req.json();

    if (!texto || texto.trim().length < 15) {
      return NextResponse.json({ error: "Contame un poco más sobre el producto/negocio (mínimo unas líneas)." }, { status: 400 });
    }

    const systemPrompt = `Sos un analista de negocio que lee una descripción libre (puede venir desordenada, informal, con errores de tipeo) y la estructura en campos concretos para un generador de campañas de marketing.

Devolvés ÚNICAMENTE JSON válido, sin texto ni markdown alrededor, con esta forma EXACTA:
{
  "emoji": "un emoji que represente el negocio",
  "nombre": "nombre corto del negocio/producto (2-4 palabras)",
  "descripcion": "1-2 frases vendiendo esto como PRODUCTO/TECNOLOGÍA/SERVICIO -- para campañas B2B o de venta directa de la solución",
  "temaNegocio": "1-2 frases vendiendo el RUBRO/PASIÓN detrás -- para contenido de marca sin mencionar tecnología ni plataformas, enfocado en el beneficio humano/emocional (ej: para lombrices de compost, hablar de huertas felices, no de e-commerce)",
  "publico": "a quién le vendría bien esto, en pocas palabras",
  "objetivoSugerido": "un objetivo de campaña razonable para este negocio (ej: 'conseguir primeras ventas', 'agendar consultas')"
}

Si el texto menciona precios, cantidades o beneficios concretos (ej: "100 lombrices a tanto"), usalos tal cual los mencionan en descripcion/temaNegocio -- no los inventes ni los cambies, y no agregues cifras que no te dieron.`;

    const userPrompt = `Texto sobre el negocio/producto:\n"""\n${texto}\n"""\n${url ? `\nURL del sitio: ${url}` : ""}`;

    const raw = await callGroq(userPrompt, systemPrompt, 800);
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();

    let extraido;
    try {
      extraido = JSON.parse(cleaned);
    } catch (e) {
      return NextResponse.json({ error: `La IA no devolvió JSON válido: ${(e as Error).message}` }, { status: 502 });
    }

    return NextResponse.json(extraido);
  } catch (err) {
    console.error("Error en /api/admin/sites/extract:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
