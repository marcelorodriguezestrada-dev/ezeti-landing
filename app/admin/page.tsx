"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "ezeti-marketing-admin";

export default function AdminPage() {
  const [business, setBusiness] = useState("EZETI");
  const [offer, setOffer] = useState("automatización con IA");
  const [goal, setGoal] = useState("captar clientes para una consultora");
  const [audience, setAudience] = useState("empresas medianas y pymes");
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setBusiness(parsed.business || "EZETI");
        setOffer(parsed.offer || "automatización con IA");
        setGoal(parsed.goal || "captar clientes para una consultora");
        setAudience(parsed.audience || "empresas medianas y pymes");
      } catch {
        // ignore
      }
    }
  }, []);

  const buildUrl = useMemo(() => {
    if (!campaign) return "";
    const params = new URLSearchParams({
      utm_source: campaign.utmSource,
      utm_medium: campaign.utmMedium,
      utm_campaign: campaign.utmCampaign,
    });
    return `${campaign.landingUrl}?${params.toString()}`;
  }, [campaign]);

  const generateCampaign = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business, offer, goal, audience }),
      });

      const data = await response.json();
      if (!response.ok || data?.error) {
        throw new Error(data?.error || "No se pudo generar la campaña");
      }

      setCampaign(data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ business, offer, goal, audience }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400">Panel privado</p>
            <h1 className="mt-2 text-3xl font-black text-white">Generador de campañas con IA y UTM</h1>
            <p className="mt-3 max-w-2xl text-slate-400">Crea anuncios, mensajes de seguimiento y links listos para medir desde una sola herramienta.</p>
          </div>
          <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300">Acceso exclusivo para EZETI</div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/70 p-6">
            <div className="space-y-4">
              <label className="block text-sm text-slate-300">
                Negocio
                <input value={business} onChange={(e) => setBusiness(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2" />
              </label>
              <label className="block text-sm text-slate-300">
                Oferta / servicio
                <input value={offer} onChange={(e) => setOffer(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2" />
              </label>
              <label className="block text-sm text-slate-300">
                Objetivo
                <input value={goal} onChange={(e) => setGoal(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2" />
              </label>
              <label className="block text-sm text-slate-300">
                Audiencia
                <input value={audience} onChange={(e) => setAudience(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2" />
              </label>
              <button onClick={generateCampaign} disabled={loading} className="w-full rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60">
                {loading ? "Generando campaña..." : "Generar campaña con IA"}
              </button>
              {error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div> : null}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/70 p-6">
            {!campaign ? (
              <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-slate-400">
                Aún no hay una campaña generada. Completa los datos y crea tu primera propuesta de marketing.
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400">Headline</p>
                  <h2 className="mt-2 text-2xl font-black text-white">{campaign.headline}</h2>
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400">Copy</p>
                  <p className="mt-2 leading-7 text-slate-300">{campaign.body}</p>
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400">CTA</p>
                  <p className="mt-2 font-semibold text-white">{campaign.cta}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400">UTM</p>
                  <div className="mt-3 space-y-2 text-sm text-slate-300">
                    <div>Fuente: <span className="font-semibold text-white">{campaign.utmSource}</span></div>
                    <div>Medio: <span className="font-semibold text-white">{campaign.utmMedium}</span></div>
                    <div>Campaña: <span className="font-semibold text-white">{campaign.utmCampaign}</span></div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400">Link de seguimiento</p>
                  <a href={buildUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex break-all text-sm text-cyan-400">{buildUrl}</a>
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400">Hashtags</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {campaign.hashtags.map((tag: string) => (
                      <span key={tag} className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{tag}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400">Mensaje de seguimiento</p>
                  <p className="mt-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-3 text-sm leading-7 text-slate-300">{campaign.followUpMessage}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
