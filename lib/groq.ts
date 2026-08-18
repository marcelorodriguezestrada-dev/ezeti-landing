import Groq from "groq-sdk";

// Mismo motivo que en firebaseAdmin.ts: si esto se crea a nivel módulo,
// Next.js lo ejecuta durante el build (sin la env var todavía disponible)
// y explota. Lo creamos recién cuando se llama a callGroq() de verdad.
let groq: Groq | null = null;
function getGroqClient() {
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groq;
}

export async function callGroq(userPrompt: string, systemPrompt: string, maxTokens = 1200) {
  const completion = await getGroqClient().chat.completions.create({
    // llama-3.3-70b-versatile fue discontinuado por Groq (apagado final:
    // 16-ago-2026). openai/gpt-oss-120b es el reemplazo que recomienda el
    // propio Groq -- mismo tamaño de contexto, más rápido.
    model: "openai/gpt-oss-120b",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: maxTokens,
    temperature: 0.8,
  });
  return completion.choices[0]?.message?.content?.trim() || "";
}
