import { NextRequest, NextResponse } from "next/server";
import { callGroq } from "@/lib/groq";

// Log de trazas de DEMO -- fijo a propósito para el MVP/pitch comercial.
// En una implementación real para un cliente, esto se reemplaza por una
// consulta a donde el cliente centralice sus logs (Firestore, CloudWatch,
// Datadog, etc.), filtrando por una ventana de tiempo reciente.
const TRACE_LOG = [
  { id: "t1", time: "14:48:02", lvl: "info", msg: "GET /admin — panel cargado, iniciando fetch secuencial" },
  { id: "t2", time: "14:48:03", lvl: "info", msg: "GET /api/admin/campaigns → 200 (4 docs, 4 reads)" },
  { id: "t3", time: "14:48:03", lvl: "warn", msg: "ExtendedBroadcastMessage: Channel secret not available yet (ext. navegador)" },
  { id: "t4", time: "14:48:04", lvl: "info", msg: "GET /api/admin/sites → 200 (2 docs, 2 reads)" },
  { id: "t5", time: "14:48:05", lvl: "error", msg: "GET /api/admin/analytics → Firestore query .limit(5000) iniciada" },
  { id: "t6", time: "14:48:05", lvl: "error", msg: "Firestore: 8 RESOURCE_EXHAUSTED — Quota exceeded (x-debug-tracking-id: 7f3a...)" },
  { id: "t7", time: "14:48:05", lvl: "error", msg: "GET /api/admin/analytics → 500 (unhandled quota error)" },
  { id: "t8", time: "14:48:06", lvl: "warn", msg: "BitcoinAdapter.registerEventListeners — IN_PAGE_CHANNEL_NODE_ID not found (ext. navegador)" },
  { id: "t9", time: "14:48:06", lvl: "info", msg: "GET /api/admin/leads → 200 (6 docs, 6 reads)" },
  { id: "t10", time: "14:48:07", lvl: "error", msg: "PATCH /api/admin/settings → firebaseAdmin.getSettingsDoc().set() timeout tras 4200ms" },
  { id: "t11", time: "14:48:07", lvl: "error", msg: "PATCH /api/admin/settings → 500 (calLink no guardado)" },
  { id: "t12", time: "14:48:08", lvl: "info", msg: "GET /admin/tv → poll automático disparado (intervalo: 60s)" },
  { id: "t13", time: "14:48:08", lvl: "error", msg: "GET /api/admin/campaigns (desde TV) → 500 tras 3 reintentos" },
  { id: "t14", time: "14:52:41", lvl: "info", msg: 'Cloud Firestore console: cuota "operaciones de lectura" → 50.000 / 50.000 (ago 3 - ago 4)' },
];

const SYSTEM_PROMPT = `Sos un motor de correlación de incidentes técnicos (estilo AIOps). Recibís un ticket de soporte en lenguaje humano y un log de trazas del sistema con IDs de línea.
Tu trabajo: identificar cuáles líneas de traza son la causa raíz real del ticket, IGNORANDO ruido irrelevante (por ejemplo errores de extensiones del navegador, logs informativos sin relación).
Respondé ÚNICAMENTE con un objeto JSON, sin texto adicional, sin markdown, con este formato exacto:
{"matched_ids": ["t5","t6"], "causa_raiz": "explicación breve en español, 2-3 oraciones, en lenguaje claro no técnico", "confianza": "alta"|"media"|"baja", "accion_recomendada": "qué hacer para resolverlo, 1-2 oraciones"}`;

export async function POST(req: NextRequest) {
  try {
    const { ticket } = await req.json();
    if (!ticket || typeof ticket !== "string") {
      return NextResponse.json({ error: "Falta el texto del ticket." }, { status: 400 });
    }

    const traceText = TRACE_LOG.map((t) => `[${t.id}] ${t.time} ${t.lvl.toUpperCase()} ${t.msg}`).join("\n");
    const userPrompt = `TICKET:\n${ticket}\n\nLOG DE TRAZAS:\n${traceText}`;

    const raw = await callGroq(userPrompt, SYSTEM_PROMPT, 600);
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Error en POST /api/tracelink/analyze:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// Exponemos el log también por GET para que el frontend pueda pintarlo
// sin duplicar los datos en el cliente.
export async function GET() {
  return NextResponse.json(TRACE_LOG);
}
