import { NextResponse } from "next/server";
import { getVisitsCol } from "@/lib/firebaseAdmin";

interface VisitDoc {
  fecha: string; // "2026-07-31"
  producto: string;
  plataforma: string;
}

interface AnalyticsPayload {
  totalVisitas: number;
  porDia: { key: string; visitas: number }[];
  porMes: { key: string; visitas: number }[];
  porAnio: { key: string; visitas: number }[];
  ranking: { producto: string; visitas: number }[];
}

// Caché en memoria de 4hs. Este endpoint antes leía hasta 5000 documentos
// de Firestore en CADA llamada (1 lectura facturable por documento), y se
// llamaba seguido (panel admin + modo TV cada tanto). Eso fue justo lo que
// hizo tocar el límite gratis de 50k lecturas/día. Con este caché, salvo
// la primera vez cada 4hs, se responde sin pegarle a Firestore.
//
// OJO: en Vercel esto vive por instancia de función serverless. Si la
// instancia se recicla (cold start), el caché se pierde y se recalcula --
// pero como igual expira a las 4hs, el ahorro sigue siendo enorme frente a
// recalcular en cada request.
let cache: { data: AnalyticsPayload; ts: number } | null = null;
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 horas

async function calcularAnalytics(): Promise<AnalyticsPayload> {
  // Traemos hasta 5000 visitas más recientes -- de sobra para el volumen
  // de un panel de marketing chico/mediano. Si en algún momento esto
  // crece mucho, se puede paginar por rango de fechas.
  const snap = await getVisitsCol().orderBy("timestamp", "desc").limit(5000).get();
  const visits = snap.docs.map((d) => d.data() as VisitDoc);

  const porDia: Record<string, number> = {};
  const porMes: Record<string, number> = {};
  const porAnio: Record<string, number> = {};
  const porProducto: Record<string, number> = {};

  for (const v of visits) {
    if (!v.fecha) continue;
    const [anio, mes] = v.fecha.split("-");
    porDia[v.fecha] = (porDia[v.fecha] || 0) + 1;
    porMes[`${anio}-${mes}`] = (porMes[`${anio}-${mes}`] || 0) + 1;
    porAnio[anio] = (porAnio[anio] || 0) + 1;
    if (v.producto) porProducto[v.producto] = (porProducto[v.producto] || 0) + 1;
  }

  const toSortedArray = (obj: Record<string, number>) =>
    Object.entries(obj).map(([key, visitas]) => ({ key, visitas })).sort((a, b) => a.key.localeCompare(b.key));

  const ranking = Object.entries(porProducto)
    .map(([producto, visitas]) => ({ producto, visitas }))
    .sort((a, b) => b.visitas - a.visitas);

  return {
    totalVisitas: visits.length,
    porDia: toSortedArray(porDia),
    porMes: toSortedArray(porMes),
    porAnio: toSortedArray(porAnio),
    ranking,
  };
}

export async function GET() {
  try {
    const ahora = Date.now();
    if (cache && ahora - cache.ts < CACHE_TTL_MS) {
      return NextResponse.json(cache.data);
    }

    const data = await calcularAnalytics();
    cache = { data, ts: ahora };
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error en GET /api/admin/analytics:", err);
    // Si falla (por ej. quota agotada) y tenemos un caché viejo, mejor
    // devolver eso que romper el panel por completo.
    if (cache) return NextResponse.json(cache.data);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
