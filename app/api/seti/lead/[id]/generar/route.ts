import { NextRequest, NextResponse } from "next/server";
import { getLeadsCol } from "@/lib/firebaseAdmin";
import { callGroq } from "@/lib/groq";
import type { Lead } from "@/lib/types";

const OBJETIVO_LABELS: Record<string, string> = {
  vender: "vender productos online",
  captar: "captar más clientes",
  organizar: "organizar turnos, inventario o pedidos",
  mostrar: "mostrar su trabajo",
};

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ref = getLeadsCol().doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "No encontramos ese lead." }, { status: 404 });
    }
    const lead = snap.data() as Lead;

    const esEcommerce = lead.tipoNegocio === "comercio";
    const objetivoLabel = OBJETIVO_LABELS[lead.objetivoSemilla || ""] || "hacer crecer su negocio";

    const contexto = `Nombre de la persona: ${lead.nombre}
Tipo de negocio: ${lead.tipoNegocio || "no especificado"}
Objetivo principal: ${objetivoLabel}
Etapa: ${lead.etapaActual === "cero" ? "arranca de cero" : "ya tiene algo y quiere mejorarlo"}
${lead.detalleLibre ? `Detalle que dio la persona: "${lead.detalleLibre}"` : ""}`;

    const systemPrompt = `Sos un redactor publicitario y diseñador que arma contenido de muestra para landings y tiendas online. Trabajás rápido, con textos concretos y creíbles, nunca genéricos tipo "Lorem ipsum". Nunca inventás datos de contacto reales ni afirmaciones verificables falsas.
Devolvés ÚNICAMENTE JSON válido, sin markdown ni texto alrededor.`;

    const userPrompt = esEcommerce
      ? `${contexto}

Generá contenido de muestra para una tienda online con este JSON exacto:
{
  "tipo": "ecommerce",
  "nombreNegocio": "nombre corto y creíble para este negocio",
  "tagline": "frase de una línea que resuma la propuesta",
  "colorPrimario": "un color hex que combine con el rubro, ej #16a34a",
  "productos": [
    { "nombre": "...", "precio": "$....", "descripcion": "una oración" }
  ]
}
El array "productos" debe tener exactamente 3 productos de muestra, coherentes con el rubro mencionado.`
      : `${contexto}

Generá contenido de muestra para una landing page con este JSON exacto:
{
  "tipo": "landing",
  "nombreNegocio": "nombre corto y creíble para este negocio",
  "tagline": "frase de una línea que resuma la propuesta",
  "colorPrimario": "un color hex que combine con el rubro, ej #2563eb",
  "hero": { "titulo": "titular principal, corto y directo", "subtitulo": "una oración de apoyo", "cta": "texto del botón, ej Quiero saber más" },
  "sobre": "un párrafo corto (2-3 oraciones) presentando el negocio",
  "servicios": [ { "titulo": "...", "descripcion": "una oración" } ],
  "contacto": "una oración invitando a escribir"
}
El array "servicios" debe tener exactamente 3 ítems, coherentes con el rubro y el objetivo mencionado.`;

    const raw = await callGroq(userPrompt, systemPrompt, 900);
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const vistaPreviaGenerada = JSON.parse(cleaned);

    await ref.update({ vistaPreviaGenerada });

    return NextResponse.json(vistaPreviaGenerada);
  } catch (err) {
    console.error("Error en /api/seti/lead/[id]/generar:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
