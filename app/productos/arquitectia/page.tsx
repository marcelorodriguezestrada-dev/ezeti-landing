"use client";
import React, { useState } from "react";

interface Finding {
  categoria: "queries_costos" | "escalabilidad" | "calidad_datos" | "procesos";
  titulo: string;
  diagnostico: string;
  prioridad: "alta" | "media" | "baja";
  esfuerzo: "bajo" | "medio" | "alto";
  impacto_estimado: string;
  accion_recomendada: string;
}

interface Report {
  salud_general: "buena" | "regular" | "critica";
  resumen: string;
  hallazgos: Finding[];
}

const CATEGORY_LABEL: Record<string, string> = {
  queries_costos: "Queries & costos",
  escalabilidad: "Escalabilidad & nube",
  calidad_datos: "Calidad de datos",
  procesos: "Procesos",
};

const EXAMPLE = `Stack: Next.js en Vercel + Firestore (plan Spark, gratis) + Groq para generación de contenido.

Problema detectado hoy: el proyecto agotó la cuota gratuita de 50.000 lecturas/día de Firestore en menos de 24hs.

Causa identificada: el endpoint /api/admin/analytics recalcula estadísticas leyendo hasta 5000 documentos de la colección "visits" en CADA llamada (sin caché), y se llama automáticamente cada 60 segundos desde una pantalla de TV que queda encendida todo el día, además de cada vez que se abre el panel admin.

Otros datos:
- El panel admin pedía 5 endpoints distintos con Promise.all al mismo tiempo (campaigns, sites, analytics, leads, settings), generando picos de lecturas simultáneas.
- La colección "visits" no tiene contadores agregados: cada visita se guarda como documento individual y las estadísticas se recalculan desde cero cada vez, en vez de mantener un contador acumulado.
- No hay monitoreo/alertas configuradas para avisar cuando se acerca al límite de cuota -- nos enteramos recién cuando el panel empezó a tirar errores 500 en producción.
- El equipo es de 2 personas, sin un proceso formal de code review antes de deployar a producción.`;

export default function ArquitectIAPage() {
  const [input, setInput] = useState(EXAMPLE);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Record<number, boolean>>({});

  async function diagnose() {
    setLoading(true);
    setReport(null);
    setError("");
    setDone({});
    try {
      const res = await fetch("/api/arquitectia/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemDescription: input }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al diagnosticar.");
      setReport(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const healthColor: Record<string, string> = {
    buena: "text-teal-400 border-teal-900 bg-teal-500/5",
    regular: "text-amber-400 border-amber-900 bg-amber-500/5",
    critica: "text-red-400 border-red-900 bg-red-500/5",
  };
  const priorityColor: Record<string, string> = {
    alta: "text-red-400 border-red-900",
    media: "text-amber-400 border-amber-900",
    baja: "text-slate-500 border-slate-700",
  };
  const effortLabel: Record<string, string> = { bajo: "esfuerzo bajo", medio: "esfuerzo medio", alto: "esfuerzo alto" };

  const grouped = report
    ? report.hallazgos.reduce<Record<string, Finding[]>>((acc, f) => {
        (acc[f.categoria] ||= []).push(f);
        return acc;
      }, {})
    : {};

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200 font-sans">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="flex items-center justify-between border-b border-slate-800/60 pb-5 mb-8">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-400 shadow-[0_0_0_3px_rgba(129,140,248,0.25)]" />
            <span className="font-mono text-[15px] font-semibold tracking-wide">ArquitectIA</span>
            <span className="text-xs text-slate-500 ml-2">diagnóstico de arquitectura & costos</span>
          </div>
          <a href="/" className="text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors">
            ← volver a ezeti.pro
          </a>
        </header>

        <h1 className="font-mono text-2xl font-semibold leading-snug mb-2">
          Describí tu sistema. Recibí un plan de mejora priorizado.
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl leading-relaxed mb-7">
          Pegá logs, métricas de uso, o una descripción de tu stack. El agente audita queries costosas,
          oportunidades de escalar en la nube, calidad de datos y procesos de equipo — y arma un informe
          priorizado. La IA diagnostica; el equipo decide qué implementar y cuándo.
        </p>

        <div className="rounded-[10px] border border-slate-800 bg-[#101A30] overflow-hidden mb-6 relative">
          <div className="px-4 py-3 border-b border-slate-800/60 bg-[#16213A] flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
              <span className="text-indigo-400">●</span> descripción del sistema
            </span>
            <button
              onClick={() => setInput(EXAMPLE)}
              className="font-mono text-[11px] text-slate-600 hover:text-slate-400 transition-colors"
            >
              restaurar ejemplo
            </button>
          </div>
          <div className="p-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full min-h-[200px] bg-transparent outline-none text-[13.5px] leading-relaxed font-mono text-slate-300 placeholder:text-slate-600 resize-y"
            />
            <button
              onClick={diagnose}
              disabled={loading}
              className="w-full mt-3 rounded-md bg-indigo-500 text-white font-mono font-semibold text-[13.5px] py-2.5 tracking-wide disabled:opacity-50 hover:brightness-105 transition-all"
            >
              {loading ? "ESCANEANDO ARQUITECTURA…" : "DIAGNOSTICAR ARQUITECTURA"}
            </button>
          </div>

          {loading && (
            <div className="absolute inset-0 bg-[#0B1120]/70 backdrop-blur-[1px] pointer-events-none overflow-hidden">
              <div className="scan-sweep" />
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-md border border-red-900 bg-red-500/5 text-red-400 text-sm px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {report && (
          <div className="space-y-6">
            {/* resumen general */}
            <div className={`rounded-[10px] border px-5 py-4 ${healthColor[report.salud_general]}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[11px] uppercase tracking-wider">salud general</span>
                <span className="font-mono text-xs uppercase font-semibold">{report.salud_general}</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{report.resumen}</p>
            </div>

            {/* hallazgos agrupados */}
            {Object.entries(grouped).map(([cat, findings]) => (
              <div key={cat}>
                <h3 className="font-mono text-xs uppercase tracking-wider text-indigo-400 mb-2.5">
                  {CATEGORY_LABEL[cat] || cat}
                </h3>
                <div className="space-y-2.5">
                  {findings.map((f, i) => {
                    const globalIdx = report.hallazgos.indexOf(f);
                    return (
                      <div
                        key={globalIdx}
                        className={`rounded-lg border border-slate-800 bg-[#101A30] p-4 transition-opacity ${
                          done[globalIdx] ? "opacity-40" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <span className="text-sm font-medium text-slate-100">{f.titulo}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`font-mono text-[10px] rounded-full border px-2 py-0.5 ${priorityColor[f.prioridad]}`}>
                              {f.prioridad}
                            </span>
                          </div>
                        </div>
                        <p className="text-[13px] text-slate-400 leading-relaxed mb-2.5">{f.diagnostico}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-slate-600 mb-2.5">
                          <span>{effortLabel[f.esfuerzo]}</span>
                          <span className="text-teal-500/80">↳ {f.impacto_estimado}</span>
                        </div>
                        <div className="text-[13px] text-slate-300 bg-[#0B1120] rounded-md px-3 py-2 border border-slate-800/60 mb-2.5">
                          <span className="text-slate-600 font-mono text-[10.5px] uppercase mr-1.5">acción:</span>
                          {f.accion_recomendada}
                        </div>
                        <label className="flex items-center gap-2 text-[12px] text-slate-500 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={!!done[globalIdx]}
                            onChange={(e) => setDone((d) => ({ ...d, [globalIdx]: e.target.checked }))}
                            className="accent-indigo-500"
                          />
                          marcar como implementado
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <footer className="mt-10 pt-4 border-t border-slate-800/60 flex justify-between flex-wrap gap-2 font-mono text-[11.5px] text-slate-600">
          <span>ArquitectIA · MVP interno</span>
          <span>Motor: Llama 3.3 70B (Groq) · diagnóstico bajo demanda</span>
        </footer>
      </div>

      <style jsx global>{`
        .scan-sweep {
          position: absolute;
          top: 0;
          left: -30%;
          width: 30%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(129, 140, 248, 0.18), transparent);
          animation: sweep 1.4s ease-in-out infinite;
        }
        @keyframes sweep {
          0% { left: -30%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}
