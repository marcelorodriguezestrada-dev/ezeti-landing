"use client";
import React, { useEffect, useRef, useState } from "react";

interface TraceItem {
  id: string;
  time: string;
  lvl: "info" | "warn" | "error";
  msg: string;
}

interface Diagnosis {
  matched_ids: string[];
  causa_raiz: string;
  confianza: "alta" | "media" | "baja";
  accion_recomendada: string;
}

const PRESETS = [
  {
    label: "Analytics no carga",
    ticket:
      "Un cliente escribió que entra al panel y la sección de Analytics se queda cargando para siempre, nunca muestra los números. Pasó hoy a la tarde.",
  },
  {
    label: "No guarda el link de reservas",
    ticket:
      "El equipo de ventas reporta que cuando intentan cambiar el link de Cal.com en Configuración, aprieta guardar y no pasa nada / tira error.",
  },
  {
    label: "TV de campañas en blanco",
    ticket:
      "La pantalla TV de la oficina que muestra las campañas quedó congelada mostrando un error, no actualiza los datos desde hace un rato.",
  },
];

const NOISE_IDS = new Set(["t3", "t8"]);

export default function TraceLinkPage() {
  const [trace, setTrace] = useState<TraceItem[]>([]);
  const [ticket, setTicket] = useState(PRESETS[0].ticket);
  const [presetIdx, setPresetIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [error, setError] = useState("");

  const tracePanelRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [beamPath, setBeamPath] = useState("");

  useEffect(() => {
    fetch("/api/tracelink/analyze")
      .then((r) => r.json())
      .then(setTrace)
      .catch(() => setError("No se pudo cargar el log de trazas."));
  }, []);

  useEffect(() => {
    if (!diagnosis || !tracePanelRef.current || diagnosis.matched_ids.length === 0) {
      setBeamPath("");
      return;
    }
    const panelRect = tracePanelRef.current.getBoundingClientRect();
    const firstEl = lineRefs.current[diagnosis.matched_ids[0]];
    if (!firstEl) return;
    const lineRect = firstEl.getBoundingClientRect();
    const startY = 20;
    const endY = lineRect.top - panelRect.top + lineRect.height / 2;
    setBeamPath(`M 0 ${startY} C 60 ${startY}, 60 ${endY}, 18 ${endY}`);
  }, [diagnosis]);

  async function analyze() {
    if (!ticket.trim()) return;
    setLoading(true);
    setDiagnosis(null);
    setError("");
    try {
      const res = await fetch("/api/tracelink/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al analizar.");
      setDiagnosis(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const lvlColor: Record<string, string> = {
    info: "text-slate-500",
    warn: "text-amber-600/80",
    error: "text-red-400/90",
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200 font-sans">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* header */}
        <header className="flex items-center justify-between border-b border-slate-800/60 pb-5 mb-8">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-teal-400 shadow-[0_0_0_3px_rgba(45,212,191,0.25)]" />
            <span className="font-mono text-[15px] font-semibold tracking-wide">TraceLink</span>
            <span className="text-xs text-slate-500 ml-2">agente de correlación de incidentes</span>
          </div>
          <a href="/" className="text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors">
            ← volver a ezeti.pro
          </a>
        </header>

        <h1 className="font-mono text-2xl font-semibold leading-snug mb-2">
          Pegá un ticket. Encontrá la traza que lo causó.
        </h1>
        <p className="text-slate-400 text-sm max-w-xl leading-relaxed mb-7">
          El agente lee el reporte del usuario, lo cruza contra el log de trazas del sistema y señala exactamente
          qué operación técnica falló — filtrando el ruido que no tiene nada que ver.
        </p>

        {/* presets */}
        <div className="flex flex-wrap gap-2 mb-6">
          {PRESETS.map((p, i) => (
            <button
              key={p.label}
              onClick={() => {
                setPresetIdx(i);
                setTicket(p.ticket);
                setDiagnosis(null);
              }}
              className={`font-mono text-xs rounded-md border px-3 py-1.5 transition-colors ${
                i === presetIdx
                  ? "border-amber-500/70 text-amber-400 bg-amber-500/5"
                  : "border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.35fr] items-start">
          {/* ticket panel */}
          <div className="rounded-[10px] border border-slate-800 bg-[#101A30] overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800/60 bg-[#16213A]">
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                <span className="text-amber-400">●</span> ticket entrante
              </span>
            </div>
            <div className="p-4">
              <textarea
                value={ticket}
                onChange={(e) => setTicket(e.target.value)}
                placeholder="Describí el problema que reportó el usuario..."
                className="w-full min-h-[108px] bg-transparent outline-none text-sm leading-relaxed text-slate-200 placeholder:text-slate-600 resize-y"
              />
              <div className="flex gap-3.5 mt-3 pt-3 border-t border-slate-800/60 font-mono text-[11px] text-slate-600">
                <span>#TCK-4471</span>
                <span>prioridad: alta</span>
                <span>canal: soporte</span>
              </div>
              <button
                onClick={analyze}
                disabled={loading}
                className="w-full mt-3.5 rounded-md bg-amber-500 text-[#1A1206] font-mono font-semibold text-[13.5px] py-2.5 tracking-wide disabled:opacity-50 hover:brightness-105 transition-all"
              >
                {loading ? "ANALIZANDO…" : "ANALIZAR Y CORRELACIONAR"}
              </button>
            </div>

            {(diagnosis || error) && (
              <div className="border-t border-slate-800/60">
                <div className="px-4 py-3 flex items-center justify-between bg-[#16213A]">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-teal-400">diagnóstico</span>
                  {diagnosis && (
                    <span
                      className={`font-mono text-[11px] rounded-full border px-2.5 py-0.5 ${
                        diagnosis.confianza === "alta"
                          ? "text-teal-400 border-teal-900"
                          : diagnosis.confianza === "media"
                          ? "text-amber-500 border-amber-900"
                          : "text-slate-500 border-slate-700"
                      }`}
                    >
                      confianza: {diagnosis.confianza}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  {error && <p className="text-sm text-red-400">{error}</p>}
                  {diagnosis && (
                    <div className="space-y-4">
                      <div>
                        <div className="font-mono text-[10.5px] uppercase tracking-wider text-slate-600 mb-1.5">
                          causa raíz
                        </div>
                        <p className="text-sm leading-relaxed">{diagnosis.causa_raiz}</p>
                      </div>
                      <div>
                        <div className="font-mono text-[10.5px] uppercase tracking-wider text-slate-600 mb-1.5">
                          acción recomendada
                        </div>
                        <p className="text-sm leading-relaxed">{diagnosis.accion_recomendada}</p>
                      </div>
                      <div>
                        <div className="font-mono text-[10.5px] uppercase tracking-wider text-slate-600 mb-1.5">
                          líneas de traza vinculadas
                        </div>
                        <p className="font-mono text-xs text-amber-400">{diagnosis.matched_ids.join(", ")}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* trace panel */}
          <div ref={tracePanelRef} className="relative rounded-[10px] border border-slate-800 bg-[#101A30] overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800/60 bg-[#16213A]">
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                <span className="text-teal-400">●</span> log de trazas del sistema — últimos 6 min
              </span>
            </div>
            <div className="max-h-[420px] overflow-y-auto font-mono text-[12.3px] leading-[1.9]">
              {trace.map((t) => {
                const isMatched = diagnosis?.matched_ids.includes(t.id);
                const isNoise = NOISE_IDS.has(t.id);
                return (
                  <div
                    key={t.id}
                    ref={(el) => {
                      lineRefs.current[t.id] = el;
                    }}
                    className={`grid grid-cols-[62px_66px_1fr] gap-2.5 px-4 py-0.5 border-l-2 whitespace-pre transition-colors duration-300 ${
                      isMatched
                        ? "border-amber-500 bg-gradient-to-r from-amber-900/10 to-transparent text-amber-400 font-medium"
                        : "border-transparent " + (isNoise ? "opacity-40 text-slate-600" : "text-slate-500")
                    }`}
                  >
                    <span className="text-slate-600">{t.time}</span>
                    <span className={lvlColor[t.lvl]}>{t.lvl.toUpperCase()}</span>
                    <span className="overflow-x-auto">{t.msg}</span>
                  </div>
                );
              })}
            </div>
            {beamPath && (
              <svg className="absolute inset-0 pointer-events-none w-full h-full">
                <path
                  d={beamPath}
                  fill="none"
                  stroke="#F5A623"
                  strokeWidth={1.6}
                  strokeDasharray="6 5"
                  style={{ filter: "drop-shadow(0 0 4px rgba(245,166,35,0.5))" }}
                />
              </svg>
            )}
          </div>
        </div>

        <footer className="mt-10 pt-4 border-t border-slate-800/60 flex justify-between flex-wrap gap-2 font-mono text-[11.5px] text-slate-600">
          <span>TraceLink · MVP interno</span>
          <span>Motor: Llama 3.3 70B (Groq) · correlación en vivo</span>
        </footer>
      </div>
    </div>
  );
}
