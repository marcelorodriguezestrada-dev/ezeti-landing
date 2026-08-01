import { NextResponse } from "next/server";
import { getVisitsCol } from "@/lib/firebaseAdmin";

interface VisitDoc {
  fecha: string; // "2026-07-31"
  producto: string;
  plataforma: string;
}

export async function GET() {
  try {
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

    return NextResponse.json({
      totalVisitas: visits.length,
      porDia: toSortedArray(porDia),
      porMes: toSortedArray(porMes),
      porAnio: toSortedArray(porAnio),
      ranking,
    });
  } catch (err) {
    console.error("Error en GET /api/admin/analytics:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
