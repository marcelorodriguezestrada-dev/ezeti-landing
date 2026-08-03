"use client";
import { useState, useEffect, useCallback } from "react";
import type { Campaign } from "@/lib/types";

interface Analytics {
  totalVisitas: number;
  porDia: { key: string; visitas: number }[];
  porMes: { key: string; visitas: number }[];
  ranking: { producto: string; visitas: number }[];
}

export default function TVMode() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [hora, setHora] = useState("");
  const [ultimaCarga, setUltimaCarga] = useState("");

  const cargar = useCallback(async () => {
    try {
      // Secuencial en vez de Promise.all para no coincidir con la ráfaga
      // del panel /admin si están abiertos al mismo tiempo (ver nota en
      // app/admin/page.tsx sobre RESOURCE_EXHAUSTED de Firestore).
      const an = await fetch("/api/admin/analytics").then((r) => r.json());
      const camps = await fetch("/api/admin/campaigns").then((r) => r.json());
      setAnalytics(an);
      setCampaigns(camps);
      setUltimaCarga(new Date().toLocaleTimeString("es-AR"));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    cargar();
    // Antes cada 60s -- eso era lo que más gastaba la cuota gratis de
    // Firestore (analytics recalculaba hasta 5000 lecturas por llamada).
    // Con el caché de 4hs en /api/admin/analytics, no tiene sentido pedir
    // más seguido que eso igual.
    const iv = setInterval(cargar, 4 * 60 * 60 * 1000); // 4 horas
    return () => clearInterval(iv);
  }, [cargar]);

  useEffect(() => {
    const tick = () => setHora(new Date().toLocaleTimeString("es-AR"));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  if (!analytics) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-500 text-2xl">Cargando…</p>
      </div>
    );
  }

  const hoy = new Date().toISOString().split("T")[0];
  const visitasHoy = analytics.porDia.find((d) => d.key === hoy)?.visitas || 0;
  const mejorDia = [...analytics.porDia].sort((a, b) => b.visitas - a.visitas)[0];
  const mejorProducto = analytics.ranking[0];
  const activas = campaigns.filter((c) => c.status === "activa").length;
  const ultimos7 = analytics.porDia.slice(-7);
  const maxDia = Math.max(...ultimos7.map((d) => d.visitas), 1);
  const topCampanas = [...campaigns].sort((a, b) => (b.visitas || 0) - (a.visitas || 0)).slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 lg:p-12">
      <header className="flex items-center justify-between mb-10">
        <div className="text-3xl lg:text-4xl font-black">
          ezeti<span className="text-cyan-400">.marketing</span>
        </div>
        <div className="text-right">
          <div className="text-3xl lg:text-5xl font-black font-mono">{hora}</div>
          <div className="text-sm lg:text-base text-slate-500 capitalize">
            {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>
      </header>

      {/* KPIs GRANDES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <KpiCard label="Visitas totales" value={analytics.totalVisitas} color="cyan" />
        <KpiCard label="Visitas hoy" value={visitasHoy} color="emerald" />
        <KpiCard label="Campañas activas" value={activas} color="amber" />
        <KpiCard label="Mejor día" value={mejorDia ? mejorDia.visitas : 0} sub={mejorDia ? new Date(mejorDia.key + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short" }) : "—"} color="pink" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* GRAFICO ULTIMOS 7 DIAS */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8">
          <h2 className="text-xl lg:text-2xl font-bold mb-6">Últimos 7 días</h2>
          <div className="flex items-end gap-3 h-40">
            {ultimos7.map((d) => (
              <div key={d.key} className="flex-1 flex flex-col items-center justify-end h-full">
                <div className="text-cyan-400 font-bold text-lg mb-1">{d.visitas}</div>
                <div className="w-full bg-cyan-500/80 rounded-t-lg" style={{ height: `${(d.visitas / maxDia) * 100}%`, minHeight: 4 }} />
                <div className="text-xs text-slate-500 mt-2">
                  {new Date(d.key + "T00:00:00").toLocaleDateString("es-AR", { weekday: "short" })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PRODUCTO MAS VISITADO */}
        <div className="bg-slate-900/60 border border-cyan-500/40 rounded-3xl p-8 flex flex-col justify-center">
          <div className="text-sm uppercase tracking-wide text-slate-500 mb-3">🏆 Producto más visitado</div>
          {mejorProducto ? (
            <>
              <div className="text-2xl lg:text-3xl font-black text-white mb-2">{mejorProducto.producto}</div>
              <div className="text-4xl lg:text-5xl font-black text-cyan-400">{mejorProducto.visitas} <span className="text-lg text-slate-500 font-normal">visitas</span></div>
            </>
          ) : (
            <div className="text-slate-600 text-xl">Todavía sin datos</div>
          )}
        </div>
      </div>

      {/* RANKING DE CAMPAÑAS */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 mt-6">
        <h2 className="text-xl lg:text-2xl font-bold mb-6">Campañas con más visitas</h2>
        {topCampanas.length === 0 ? (
          <p className="text-slate-500 text-lg">Todavía no hay campañas con visitas.</p>
        ) : (
          <div className="space-y-4">
            {topCampanas.map((c, i) => {
              const max = topCampanas[0].visitas || 1;
              return (
                <div key={c.id} className="flex items-center gap-4">
                  <span className="text-2xl font-black text-slate-600 w-8">{i + 1}</span>
                  <span className="text-lg lg:text-xl text-white flex-1 truncate">{c.producto}</span>
                  <div className="flex-1 max-w-[300px] bg-slate-800 rounded-full h-3 overflow-hidden hidden md:block">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${((c.visitas || 0) / max) * 100}%` }} />
                  </div>
                  <span className="text-2xl font-black text-cyan-400 w-16 text-right">{c.visitas || 0}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <footer className="text-center text-slate-600 text-sm mt-8">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
        Se actualiza solo cada 60 segundos · última actualización: {ultimaCarga}
      </footer>
    </div>
  );
}

function KpiCard({ label, value, sub, color }: { label: string; value: number; sub?: string; color: "cyan" | "emerald" | "amber" | "pink" }) {
  const colores = {
    cyan: "text-cyan-400 border-cyan-500/30",
    emerald: "text-emerald-400 border-emerald-500/30",
    amber: "text-amber-400 border-amber-500/30",
    pink: "text-pink-400 border-pink-500/30",
  };
  return (
    <div className={`bg-slate-900/60 border rounded-3xl p-6 lg:p-8 ${colores[color]}`}>
      <div className="text-sm lg:text-base text-slate-500 uppercase tracking-wide mb-2">{label}</div>
      <div className={`text-5xl lg:text-6xl font-black ${colores[color].split(" ")[0]}`}>{value}</div>
      {sub && <div className="text-sm text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}
