"use client";
import { useState, useEffect, useCallback } from "react";
import type { Campaign, Plataforma } from "@/lib/types";

const PLATAFORMAS: { value: Plataforma; label: string; icon: string }[] = [
  { value: "instagram", label: "Instagram", icon: "📸" },
  { value: "linkedin", label: "LinkedIn", icon: "💼" },
  { value: "facebook", label: "Facebook", icon: "👥" },
  { value: "tiktok", label: "TikTok", icon: "🎵" },
];

const STATUS_CONFIG: Record<Campaign["status"], { label: string; color: string }> = {
  borrador: { label: "Borrador", color: "bg-slate-700 text-slate-300" },
  activa: { label: "Activa", color: "bg-cyan-500/20 text-cyan-400" },
  pausada: { label: "Pausada", color: "bg-amber-500/20 text-amber-400" },
  finalizada: { label: "Finalizada", color: "bg-slate-800 text-slate-500" },
};

async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

export default function AdminDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    producto: "",
    objetivo: "",
    publico: "",
    tono: "cercano y profesional",
    plataforma: "instagram" as Plataforma,
    destinoUrl: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("/api/admin/campaigns");
      setCampaigns(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerate = async () => {
    if (!form.producto || !form.objetivo || !form.destinoUrl) {
      setGenError("Completá al menos producto, objetivo y link de destino.");
      return;
    }
    setGenerating(true);
    setGenError("");
    try {
      await api("/api/admin/campaigns/generate", { method: "POST", body: JSON.stringify(form) });
      setForm((f) => ({ ...f, producto: "", objetivo: "", publico: "" }));
      setShowForm(false);
      await load();
    } catch (e) {
      setGenError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const updateCampaign = async (id: string, patch: Partial<Campaign>) => {
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    try {
      await api(`/api/admin/campaigns/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    } catch (e) {
      alert("Error guardando: " + (e as Error).message);
      load();
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm("¿Borrar esta campaña? No se puede deshacer.")) return;
    try {
      await api(`/api/admin/campaigns/${id}`, { method: "DELETE" });
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      alert("Error: " + (e as Error).message);
    }
  };

  const handleLogout = async () => {
    await api("/api/admin/login", { method: "DELETE" });
    window.location.href = "/admin/login";
  };

  const copyLink = (campaign: Campaign) => {
    const url = `${window.location.origin}/go/${campaign.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(campaign.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const totales = campaigns.reduce(
    (acc, c) => ({
      visitas: acc.visitas + (c.visitas || 0),
      likes: acc.likes + (c.likes || 0),
      comentarios: acc.comentarios + (c.comentarios || 0),
      compartidos: acc.compartidos + (c.compartidos || 0),
    }),
    { visitas: 0, likes: 0, comentarios: 0, compartidos: 0 }
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800/50 sticky top-0 bg-slate-950/90 backdrop-blur-xl z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-lg font-mono font-bold text-white">
            ezeti<span className="text-cyan-400">.admin</span>
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowForm((v) => !v)}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold px-4 py-2 rounded-lg transition-colors"
            >
              {showForm ? "Cancelar" : "+ Nueva campaña"}
            </button>
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-white text-sm px-3 py-2 transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* TOTALES */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Visitas totales", value: totales.visitas, sub: "conteo real (link tracking)" },
            { label: "Likes", value: totales.likes, sub: "carga manual" },
            { label: "Comentarios", value: totales.comentarios, sub: "carga manual" },
            { label: "Compartidos", value: totales.compartidos, sub: "carga manual" },
          ].map((m, i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <div className="text-2xl font-black text-cyan-400">{m.value}</div>
              <div className="text-xs text-white font-medium mt-1">{m.label}</div>
              <div className="text-[10px] text-slate-600 mt-0.5">{m.sub}</div>
            </div>
          ))}
        </div>

        {/* FORM DE GENERACIÓN */}
        {showForm && (
          <div className="bg-slate-900/50 border border-cyan-500/30 rounded-2xl p-6 mb-10">
            <h2 className="text-lg font-bold text-white mb-1">Generar nueva campaña con IA</h2>
            <p className="text-sm text-slate-500 mb-6">
              La IA arma 3 variantes de copy distintas. Elegís la que más te convence antes de publicar.
            </p>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Producto / servicio *</label>
                <input
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500"
                  placeholder="Ej: AuditIA — auditoría forense con IA para consorcios"
                  value={form.producto}
                  onChange={(e) => setForm((f) => ({ ...f, producto: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Objetivo de la campaña *</label>
                <input
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500"
                  placeholder="Ej: conseguir 10 demos agendadas este mes"
                  value={form.objetivo}
                  onChange={(e) => setForm((f) => ({ ...f, objetivo: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Público objetivo</label>
                <input
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500"
                  placeholder="Ej: administradores de consorcios en CABA"
                  value={form.publico}
                  onChange={(e) => setForm((f) => ({ ...f, publico: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Tono</label>
                <input
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500"
                  value={form.tono}
                  onChange={(e) => setForm((f) => ({ ...f, tono: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Link de destino *</label>
                <input
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500"
                  placeholder="https://ezeti.pro/#servicios"
                  value={form.destinoUrl}
                  onChange={(e) => setForm((f) => ({ ...f, destinoUrl: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Plataforma</label>
                <div className="flex gap-2">
                  {PLATAFORMAS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, plataforma: p.value }))}
                      className={[
                        "flex-1 text-xs font-semibold py-2 rounded-lg border transition-colors",
                        form.plataforma === p.value
                          ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                          : "bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500",
                      ].join(" ")}
                    >
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {genError && <p className="text-red-400 text-sm mb-4">{genError}</p>}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold px-6 py-3 rounded-lg transition-colors"
            >
              {generating ? "Generando con IA…" : "✨ Generar 3 variantes"}
            </button>
          </div>
        )}

        {/* LISTA DE CAMPAÑAS */}
        {loading ? (
          <p className="text-slate-500 text-center py-20">Cargando campañas…</p>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl">
            <p className="text-slate-400 mb-2">Todavía no generaste ninguna campaña.</p>
            <p className="text-slate-600 text-sm">Tocá &quot;+ Nueva campaña&quot; para crear la primera.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                onUpdate={(patch) => updateCampaign(c.id, patch)}
                onDelete={() => deleteCampaign(c.id)}
                onCopyLink={() => copyLink(c)}
                copied={copiedId === c.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function CampaignCard({
  campaign,
  onUpdate,
  onDelete,
  onCopyLink,
  copied,
}: {
  campaign: Campaign;
  onUpdate: (patch: Partial<Campaign>) => void;
  onDelete: () => void;
  onCopyLink: () => void;
  copied: boolean;
}) {
  const [metrics, setMetrics] = useState({
    likes: campaign.likes,
    comentarios: campaign.comentarios,
    compartidos: campaign.compartidos,
  });
  const [dirty, setDirty] = useState(false);
  const plataformaInfo = PLATAFORMAS.find((p) => p.value === campaign.plataforma);
  const statusInfo = STATUS_CONFIG[campaign.status];

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{plataformaInfo?.icon}</span>
            <h3 className="text-white font-bold">{campaign.producto}</h3>
            <span className={["text-[10px] font-mono px-2 py-0.5 rounded-full", statusInfo.color].join(" ")}>
              {statusInfo.label}
            </span>
          </div>
          <p className="text-xs text-slate-500">{campaign.objetivo}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={campaign.status}
            onChange={(e) => onUpdate({ status: e.target.value as Campaign["status"] })}
            className="bg-slate-950 border border-slate-700 rounded-lg text-xs px-2 py-1.5 text-slate-300 outline-none"
          >
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
          <button
            onClick={onDelete}
            className="text-slate-600 hover:text-red-400 text-xs px-2 py-1.5 transition-colors"
          >
            Borrar
          </button>
        </div>
      </div>

      {/* LINK DE TRACKING */}
      <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 mb-4">
        <span className="text-xs font-mono text-slate-500 flex-1 truncate">/go/{campaign.slug}</span>
        <button
          onClick={onCopyLink}
          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 whitespace-nowrap"
        >
          {copied ? "✓ Copiado" : "📋 Copiar link"}
        </button>
      </div>

      {/* VARIANTES */}
      <div className="grid md:grid-cols-3 gap-3 mb-5">
        {campaign.variantes.map((v, i) => (
          <button
            key={i}
            onClick={() => onUpdate({ varianteElegida: i })}
            className={[
              "text-left rounded-xl p-3 border transition-colors",
              campaign.varianteElegida === i
                ? "bg-cyan-500/10 border-cyan-500/50"
                : "bg-slate-950 border-slate-800 hover:border-slate-600",
            ].join(" ")}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-slate-500">Variante {i + 1}</span>
              {campaign.varianteElegida === i && <span className="text-[10px] text-cyan-400">✓ elegida</span>}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-2 whitespace-pre-wrap">{v.texto}</p>
            <p className="text-[10px] text-cyan-500/70">{v.hashtags.map((h) => `#${h}`).join(" ")}</p>
          </button>
        ))}
      </div>

      {/* MÉTRICAS */}
      <div className="flex flex-wrap items-end gap-4 pt-4 border-t border-slate-800/50">
        <div>
          <div className="text-[10px] text-slate-600 uppercase font-mono mb-1">Visitas (automático)</div>
          <div className="text-xl font-black text-cyan-400">{campaign.visitas}</div>
        </div>
        {(["likes", "comentarios", "compartidos"] as const).map((field) => (
          <div key={field}>
            <div className="text-[10px] text-slate-600 uppercase font-mono mb-1">{field}</div>
            <input
              type="number"
              min={0}
              value={metrics[field]}
              onChange={(e) => {
                setMetrics((m) => ({ ...m, [field]: Number(e.target.value) }));
                setDirty(true);
              }}
              className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white outline-none focus:border-cyan-500"
            />
          </div>
        ))}
        {dirty && (
          <button
            onClick={() => {
              onUpdate(metrics);
              setDirty(false);
            }}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
          >
            Guardar métricas
          </button>
        )}
      </div>
    </div>
  );
}
