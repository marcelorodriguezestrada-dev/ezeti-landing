import { NextRequest, NextResponse } from "next/server";

type MarketingPayload = {
  business: string;
  offer: string;
  goal: string;
  audience: string;
};

type MarketingResponse = {
  headline: string;
  body: string;
  cta: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  landingUrl: string;
  hashtags: string[];
  followUpMessage: string;
};

function buildFallbackCampaign(payload: MarketingPayload): MarketingResponse {
  const slug = (payload.business || "ezeti")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const campaign = `${slug}-${(payload.goal || "growth").toLowerCase().replace(/\s+/g, "-")}`;

  return {
    headline: `${payload.offer || "Tu propuesta"} para ${payload.audience || "tu audiencia"}`,
    body: `Impulsa ${payload.business || "tu negocio"} con una campaña clara, enfocada en ${payload.goal || "captar clientes"}, con un mensaje directo y seguimiento UTM para medir cada clic.`,
    cta: `Quiero ${payload.offer || "una propuesta"}`,
    utmSource: "instagram",
    utmMedium: "social",
    utmCampaign: campaign || "marketing-ia",
    landingUrl: "https://ezeti.pro",
    hashtags: ["#EZETI", "#IA", "#MarketingDigital", "#Growth"],
    followUpMessage: `Hola, vi la idea de ${payload.offer || "tu propuesta"}. Te comparto una ruta rápida para activar la campaña y medir resultados desde hoy.`,
  };
}

function normalizeCampaign(raw: Partial<MarketingResponse> | null, fallback: MarketingResponse): MarketingResponse {
  return {
    headline: raw?.headline || fallback.headline,
    body: raw?.body || fallback.body,
    cta: raw?.cta || fallback.cta,
    utmSource: raw?.utmSource || fallback.utmSource,
    utmMedium: raw?.utmMedium || fallback.utmMedium,
    utmCampaign: raw?.utmCampaign || fallback.utmCampaign,
    landingUrl: raw?.landingUrl || fallback.landingUrl,
    hashtags: raw?.hashtags?.length ? raw.hashtags : fallback.hashtags,
    followUpMessage: raw?.followUpMessage || fallback.followUpMessage,
  };
}

function extractJsonCandidate(content: string) {
  const fenced = content.replace(/```json|```/g, "").trim();
  const match = fenced.match(/\{[\s\S]*\}/);
  return match ? match[0] : fenced;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as MarketingPayload;
    const fallback = buildFallbackCampaign(payload);

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(fallback);
    }

    const prompt = `Actúa como estratega de marketing digital para EZETI. Genera una campaña breve y persuasiva en español para una empresa que vende ${payload.offer || "un servicio"}. El negocio es ${payload.business || "un negocio"}. El objetivo es ${payload.goal || "captar clientes"}. El público objetivo es ${payload.audience || "empresas"}. Responde solo en JSON con este formato exacto: {"headline":"...","body":"...","cta":"...","utmSource":"...","utmMedium":"...","utmCampaign":"...","landingUrl":"https://ezeti.pro","hashtags":["#EZETI"],"followUpMessage":"..."}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: "Eres un estratega senior de marketing con foco en conversion, copy y seguimiento con UTM.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(errorBody || "No se pudo generar la campaña con Groq.");
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content || "{}";
    const cleaned = extractJsonCandidate(content);

    let parsed: Partial<MarketingResponse> = {};
    try {
      parsed = JSON.parse(cleaned) as Partial<MarketingResponse>;
    } catch {
      parsed = {};
    }

    return NextResponse.json(normalizeCampaign(parsed, fallback));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
