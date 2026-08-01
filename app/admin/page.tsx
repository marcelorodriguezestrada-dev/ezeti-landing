"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import type { Campaign, Plataforma, Site } from "@/lib/types";

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

function buildGCalUrl(title: string, start: Date, minutes: number, details: string) {
  const end = new Date(start.getTime() + minutes * 60000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(details)}`;
}

function CopyBtn({ text, small }: { text: string; small?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className={[
        "font-bold whitespace-nowrap rounded-md transition-colors",
        small ? "text-[11px] px-2 py-1" : "text-xs px-3 py-1.5",
        copied ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400" : "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400",
      ].join(" ")}
    >
      {copied ? "✓ Copiado" : "Copiar"}
    </button>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<"generar" | "campanas" | "calendario" | "sitios" | "analytics">("campanas");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [analytics, setAnalytics] = useState<{
    totalVisitas: number;
    porDia: { key: string; visitas: number }[];
    porMes: { key: string; visitas: number }[];
    porAnio: { key: string; visitas: number }[];
    ranking: { producto: string; visitas: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
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
    cantPosts: 5,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [camps, sts, an] = await Promise.all([
        api("/api/admin/campaigns"),
        api("/api/admin/sites"),
        api("/api/admin/analytics"),
      ]);
      setCampaigns(camps);
      setSites(sts);
      setAnalytics(an);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
      await load();
      setTab("campanas");
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

  const copyTrackingLink = (campaign: Campaign) => {
    navigator.clipboard.writeText(`${window.location.origin}/go/${campaign.slug}`);
    setCopiedId(campaign.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const addSite = async (site: Omit<Site, "id" | "activo" | "createdAt">) => {
    const nuevo = await api("/api/admin/sites", { method: "POST", body: JSON.stringify(site) });
    setSites((prev) => [...prev, nuevo]);
  };

  const updateSite = async (id: string, patch: Partial<Site>) => {
    setSites((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    try {
      await api(`/api/admin/sites/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    } catch (e) {
      alert("Error guardando: " + (e as Error).message);
      load();
    }
  };

  const deleteSite = async (id: string) => {
    if (!confirm("¿Borrar este sitio de la lista? No afecta campañas ya generadas.")) return;
    try {
      await api(`/api/admin/sites/${id}`, { method: "DELETE" });
      setSites((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      alert("Error: " + (e as Error).message);
    }
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

  // Todos los posts agendados de todas las campañas, ordenados por fecha real
  const eventosCalendario = useMemo(() => {
    const eventos: { campaign: Campaign; postIndex: number; fecha: Date; nota: string }[] = [];
    for (const c of campaigns) {
      if (c.status === "finalizada") continue;
      for (const item of c.calendario || []) {
        const fecha = new Date(c.createdAt);
        fecha.setDate(fecha.getDate() + item.dia);
        const post = c.posts?.[item.postIndex];
        const [h, m] = (post?.horaOptima || "09:00").split(":").map(Number);
        fecha.setHours(h || 9, m || 0, 0, 0);
        eventos.push({ campaign: c, postIndex: item.postIndex, fecha, nota: item.nota });
      }
    }
    return eventos.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  }, [campaigns]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800/50 sticky top-0 bg-slate-950/90 backdrop-blur-xl z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-lg font-mono font-bold text-white">
            ezeti<span className="text-cyan-400">.admin</span>
          </span>
          <nav className="flex items-center gap-1 bg-slate-900/60 border border-slate-800 rounded-full p-1">
            {[
              { id: "generar", label: "✨ Generar" },
              { id: "campanas", label: "📋 Campañas" },
              { id: "calendario", label: "📅 Calendario" },
              { id: "analytics", label: "📊 Analytics" },
              { id: "sitios", label: "🌐 Sitios" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as typeof tab)}
                className={[
                  "text-sm font-semibold px-4 py-1.5 rounded-full transition-colors",
                  tab === t.id ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white",
                ].join(" ")}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <button onClick={handleLogout} className="text-slate-500 hover:text-white text-sm px-3 py-2 transition-colors">
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
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

        {tab === "generar" && (
          <div className="bg-slate-900/50 border border-cyan-500/30 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-1">Generar nueva campaña con IA</h2>
            <p className="text-sm text-slate-500 mb-6">
              La IA arma una secuencia completa de posts (no uno solo) con calendario sugerido y links UTM listos.
            </p>

            <label className="block text-xs font-mono text-slate-500 uppercase mb-2">Elegí un sitio (autocompleta todo)</label>
            <div className="flex flex-wrap gap-2 mb-6">
              {sites.filter((s) => s.activo).length === 0 && (
                <p className="text-xs text-slate-600">
                  No hay sitios activos todavía. Andá a la pestaña 🌐 Sitios para agregar o activar alguno.
                </p>
              )}
              {sites.filter((s) => s.activo).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setForm((f) => ({
                      ...f,
                      producto: s.descripcion,
                      publico: s.publico,
                      destinoUrl: s.url,
                      objetivo: s.objetivoSugerido,
                    }));
                    setGenError("");
                  }}
                  className="text-xs font-semibold bg-slate-950 border border-slate-700 hover:border-cyan-500 hover:text-cyan-400 text-slate-300 px-3 py-2 rounded-lg transition-colors"
                >
                  {s.emoji} {s.nombre}
                </button>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <Field label="Producto / servicio *">
                <input className="input" placeholder="Ej: AuditIA — auditoría forense con IA para consorcios"
                  value={form.producto} onChange={(e) => setForm((f) => ({ ...f, producto: e.target.value }))} />
              </Field>
              <Field label="Objetivo de la campaña *">
                <input className="input" placeholder="Ej: conseguir 10 demos agendadas este mes"
                  value={form.objetivo} onChange={(e) => setForm((f) => ({ ...f, objetivo: e.target.value }))} />
              </Field>
              <Field label="Público objetivo">
                <input className="input" placeholder="Ej: administradores de consorcios en CABA"
                  value={form.publico} onChange={(e) => setForm((f) => ({ ...f, publico: e.target.value }))} />
              </Field>
              <Field label="Tono">
                <input className="input" value={form.tono} onChange={(e) => setForm((f) => ({ ...f, tono: e.target.value }))} />
              </Field>
              <Field label="Link de destino *">
                <input className="input" placeholder="https://ezeti.pro/#servicios"
                  value={form.destinoUrl} onChange={(e) => setForm((f) => ({ ...f, destinoUrl: e.target.value }))} />
              </Field>
              <Field label="Cantidad de posts">
                <input type="number" min={1} max={10} className="input"
                  value={form.cantPosts} onChange={(e) => setForm((f) => ({ ...f, cantPosts: Number(e.target.value) }))} />
              </Field>
              <div className="md:col-span-2">
                <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Plataforma</label>
                <div className="flex gap-2">
                  {PLATAFORMAS.map((p) => (
                    <button key={p.value} type="button" onClick={() => setForm((f) => ({ ...f, plataforma: p.value }))}
                      className={[
                        "flex-1 text-xs font-semibold py-2 rounded-lg border transition-colors",
                        form.plataforma === p.value ? "bg-cyan-500/20 border-cyan-500 text-cyan-400" : "bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500",
                      ].join(" ")}>
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {genError && <p className="text-red-400 text-sm mb-4">{genError}</p>}
            <button onClick={handleGenerate} disabled={generating}
              className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold px-6 py-3 rounded-lg transition-colors">
              {generating ? "Generando campaña con IA… (puede tardar 15-30 seg)" : "✨ Generar campaña"}
            </button>
          </div>
        )}

        {tab === "campanas" && (
          loading ? (
            <p className="text-slate-500 text-center py-20">Cargando campañas…</p>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl">
              <p className="text-slate-400 mb-2">Todavía no generaste ninguna campaña.</p>
              <button onClick={() => setTab("generar")} className="text-cyan-400 text-sm font-semibold">✨ Generar la primera</button>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((c) => (
                <CampaignCard key={c.id} campaign={c}
                  onUpdate={(patch) => updateCampaign(c.id, patch)}
                  onDelete={() => deleteCampaign(c.id)}
                  onCopyLink={() => copyTrackingLink(c)}
                  copied={copiedId === c.id} />
              ))}
            </div>
          )
        )}

        {tab === "calendario" && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-1">Calendario de publicaciones</h2>
            <p className="text-sm text-slate-500 mb-6">Todos los posts sugeridos de tus campañas activas y borradores, en orden.</p>
            {eventosCalendario.length === 0 ? (
              <p className="text-slate-500 text-sm py-10 text-center">No hay posts programados todavía.</p>
            ) : (
              <div className="space-y-2">
                {eventosCalendario.map((ev, i) => {
                  const post = ev.campaign.posts?.[ev.postIndex];
                  const plataformaInfo = PLATAFORMAS.find((p) => p.value === ev.campaign.plataforma);
                  const esPasado = ev.fecha.getTime() < Date.now();
                  return (
                    <div key={i} className={["flex flex-wrap items-center gap-3 border-b border-slate-800/50 py-3", esPasado ? "opacity-40" : ""].join(" ")}>
                      <div className="text-xs font-mono text-cyan-400 w-32 shrink-0">
                        {ev.fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "short" })} · {ev.fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <span className="text-sm">{plataformaInfo?.icon}</span>
                      <div className="flex-1 min-w-[200px]">
                        <div className="text-sm text-white font-medium">{ev.campaign.producto}</div>
                        <div className="text-xs text-slate-500">{post?.formato} — {ev.nota}</div>
                      </div>
                      {!esPasado && post && (
                        <a
                          href={buildGCalUrl(
                            `${plataformaInfo?.icon} ${post.formato} — ${ev.campaign.producto}`,
                            ev.fecha,
                            30,
                            [post.texto, post.hashtags?.map((h) => `#${h}`).join(" "), `CTA: ${post.cta}`, `Visual: ${post.tipVisual}`].filter(Boolean).join("\n\n")
                          )}
                          target="_blank" rel="noreferrer"
                          className="text-xs bg-blue-500/10 border border-blue-500/30 text-blue-400 px-3 py-1.5 rounded-md font-semibold whitespace-nowrap"
                        >
                          📅 Agendar
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {tab === "analytics" && <AnalyticsTab analytics={analytics} campaigns={campaigns} />}
        {tab === "sitios" && <SitiosTab sites={sites} onAdd={addSite} onUpdate={updateSite} onDelete={deleteSite} />}
      </main>

      <style jsx global>{`
        .input {
          width: 100%;
          background: #020617;
          border: 1px solid #334155;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: white;
          outline: none;
        }
        .input:focus { border-color: #06b6d4; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-mono text-slate-500 uppercase mb-1">{label}</label>
      {children}
    </div>
  );
}

function CampaignCard({
  campaign, onUpdate, onDelete, onCopyLink, copied,
}: {
  campaign: Campaign;
  onUpdate: (patch: Partial<Campaign>) => void;
  onDelete: () => void;
  onCopyLink: () => void;
  copied: boolean;
}) {
  const [showPosts, setShowPosts] = useState(false);
  const [showUtm, setShowUtm] = useState(false);
  const [metrics, setMetrics] = useState({ likes: campaign.likes, comentarios: campaign.comentarios, compartidos: campaign.compartidos });
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
            <span className={["text-[10px] font-mono px-2 py-0.5 rounded-full", statusInfo.color].join(" ")}>{statusInfo.label}</span>
            <span className="text-[10px] text-slate-600">{campaign.posts?.length || 0} posts</span>
          </div>
          <p className="text-xs text-slate-500">{campaign.objetivo}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={campaign.status} onChange={(e) => onUpdate({ status: e.target.value as Campaign["status"] })}
            className="bg-slate-950 border border-slate-700 rounded-lg text-xs px-2 py-1.5 text-slate-300 outline-none">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
          </select>
          <button onClick={onDelete} className="text-slate-600 hover:text-red-400 text-xs px-2 py-1.5 transition-colors">Borrar</button>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 mb-4">
        <span className="text-xs font-mono text-slate-500 flex-1 truncate">/go/{campaign.slug} (link de tracking principal)</span>
        <button onClick={onCopyLink} className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 whitespace-nowrap">
          {copied ? "✓ Copiado" : "📋 Copiar"}
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setShowPosts((v) => !v)}
          className="text-xs font-semibold text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
          {showPosts ? "▲" : "▼"} Ver {campaign.posts?.length || 0} posts
        </button>
        <button onClick={() => setShowUtm((v) => !v)}
          className="text-xs font-semibold text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
          {showUtm ? "▲" : "▼"} Links UTM ({campaign.utmLinks?.length || 0})
        </button>
      </div>

      {showPosts && (
        <div className="grid md:grid-cols-2 gap-3 mb-4">
          {campaign.posts?.map((post, i) => (
            <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-slate-500">Post {i + 1} · {post.formato} · 🕐 {post.horaOptima}</span>
                <CopyBtn small text={`${post.texto}\n\n${(post.hashtags || []).map((h) => `#${h}`).join(" ")}`} />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap mb-2">{post.texto}</p>
              <p className="text-[10px] text-cyan-500/70 mb-2">{(post.hashtags || []).map((h) => `#${h}`).join(" ")}</p>
              {post.cta && <p className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 rounded px-2 py-1 mb-1">CTA: {post.cta}</p>}
              {post.tipVisual && <p className="text-[10px] text-slate-600">🎨 {post.tipVisual}</p>}
            </div>
          ))}
        </div>
      )}

      {showUtm && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 mb-4 space-y-2">
          {campaign.utmLinks?.map((link, i) => (
            <div key={i} className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-slate-300 min-w-[140px]">{link.label}</span>
              <code className="text-[10px] text-slate-600 flex-1 break-all">{link.url}</code>
              <CopyBtn small text={link.url} />
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-4 pt-4 border-t border-slate-800/50">
        <div>
          <div className="text-[10px] text-slate-600 uppercase font-mono mb-1">Visitas (automático)</div>
          <div className="text-xl font-black text-cyan-400">{campaign.visitas}</div>
        </div>
        {(["likes", "comentarios", "compartidos"] as const).map((field) => (
          <div key={field}>
            <div className="text-[10px] text-slate-600 uppercase font-mono mb-1">{field}</div>
            <input type="number" min={0} value={metrics[field]}
              onChange={(e) => { setMetrics((m) => ({ ...m, [field]: Number(e.target.value) })); setDirty(true); }}
              className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white outline-none focus:border-cyan-500" />
          </div>
        ))}
        {dirty && (
          <button onClick={() => { onUpdate(metrics); setDirty(false); }}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg transition-colors">
            Guardar métricas
          </button>
        )}
      </div>
    </div>
  );
}

function SitiosTab({
  sites, onAdd, onUpdate, onDelete,
}: {
  sites: Site[];
  onAdd: (site: Omit<Site, "id" | "activo" | "createdAt">) => Promise<void>;
  onUpdate: (id: string, patch: Partial<Site>) => void;
  onDelete: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [nuevo, setNuevo] = useState({
    emoji: "🌐",
    nombre: "",
    descripcion: "",
    publico: "",
    objetivoSugerido: "generar consultas de nuevos clientes",
    url: "",
  });

  const handleAdd = async () => {
    if (!nuevo.nombre || !nuevo.descripcion || !nuevo.url) {
      setError("Completá al menos nombre, descripción y URL.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onAdd(nuevo);
      setNuevo({ emoji: "🌐", nombre: "", descripcion: "", publico: "", objetivoSugerido: "generar consultas de nuevos clientes", url: "" });
      setShowForm(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white">Sitios / productos</h2>
          <p className="text-sm text-slate-500">Estos son los que aparecen como botones rápidos al generar una campaña. Solo los <strong>activos</strong> se muestran ahí.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          {showForm ? "Cancelar" : "+ Agregar sitio"}
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-900/50 border border-cyan-500/30 rounded-2xl p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Emoji</label>
              <input className="input" value={nuevo.emoji} onChange={(e) => setNuevo((f) => ({ ...f, emoji: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Nombre corto *</label>
              <input className="input" placeholder="Ej: Mi Nueva Web" value={nuevo.nombre} onChange={(e) => setNuevo((f) => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Descripción (esto es lo que ve la IA como &quot;producto&quot;) *</label>
              <input className="input" placeholder="Ej: Mi Nueva Web — plataforma para..." value={nuevo.descripcion} onChange={(e) => setNuevo((f) => ({ ...f, descripcion: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Público objetivo</label>
              <input className="input" placeholder="Ej: dueños de comercios" value={nuevo.publico} onChange={(e) => setNuevo((f) => ({ ...f, publico: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Objetivo sugerido</label>
              <input className="input" value={nuevo.objetivoSugerido} onChange={(e) => setNuevo((f) => ({ ...f, objetivoSugerido: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-mono text-slate-500 uppercase mb-1">URL *</label>
              <input className="input" placeholder="https://..." value={nuevo.url} onChange={(e) => setNuevo((f) => ({ ...f, url: e.target.value }))} />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button onClick={handleAdd} disabled={saving} className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold px-6 py-2.5 rounded-lg transition-colors">
            {saving ? "Guardando..." : "Guardar sitio"}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {sites.map((s) => (
          <div key={s.id} className={["bg-slate-900/50 border rounded-xl p-4 flex flex-wrap items-center gap-4", s.activo ? "border-slate-800" : "border-slate-800/50 opacity-50"].join(" ")}>
            <span className="text-xl">{s.emoji}</span>
            <div className="flex-1 min-w-[200px]">
              <div className="text-white font-semibold text-sm">{s.nombre}</div>
              <div className="text-xs text-slate-500 truncate">{s.url}</div>
            </div>
            <button
              onClick={() => onUpdate(s.id, { activo: !s.activo })}
              className={[
                "text-xs font-bold px-3 py-1.5 rounded-full transition-colors",
                s.activo ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-800 text-slate-500",
              ].join(" ")}
            >
              {s.activo ? "✓ Activo" : "Inactivo"}
            </button>
            <button onClick={() => onDelete(s.id)} className="text-slate-600 hover:text-red-400 text-xs px-2 py-1.5 transition-colors">
              Borrar
            </button>
          </div>
        ))}
        {sites.length === 0 && <p className="text-slate-500 text-sm text-center py-10">No hay sitios cargados todavía.</p>}
      </div>
    </div>
  );
}

function AnalyticsTab({
  analytics, campaigns,
}: {
  analytics: { totalVisitas: number; porDia: { key: string; visitas: number }[]; porMes: { key: string; visitas: number }[]; porAnio: { key: string; visitas: number }[]; ranking: { producto: string; visitas: number }[] } | null;
  campaigns: Campaign[];
}) {
  const [periodo, setPeriodo] = useState<"dia" | "mes" | "anio">("dia");

  if (!analytics) return <p className="text-slate-500 text-center py-20">Cargando analytics…</p>;

  const serie = periodo === "dia" ? analytics.porDia : periodo === "mes" ? analytics.porMes : analytics.porAnio;
  const ultimos = serie.slice(-30); // últimos 30 puntos, para que el gráfico no se achique de más
  const max = Math.max(...ultimos.map((d) => d.visitas), 1);

  const mejorDia = [...analytics.porDia].sort((a, b) => b.visitas - a.visitas)[0];
  const mejorProducto = analytics.ranking[0];
  const mejorCampaña = [...campaigns].sort((a, b) => (b.visitas || 0) - (a.visitas || 0))[0];

  const formatKey = (key: string) => {
    if (periodo === "dia") {
      const d = new Date(key + "T00:00:00");
      return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
    }
    if (periodo === "mes") {
      const [anio, mes] = key.split("-");
      return new Date(Number(anio), Number(mes) - 1).toLocaleDateString("es-AR", { month: "short", year: "2-digit" });
    }
    return key;
  };

  return (
    <div className="space-y-6">
      {/* DESTACADOS */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-slate-900/50 border border-cyan-500/30 rounded-xl p-4">
          <div className="text-[10px] text-slate-500 uppercase font-mono mb-1">🏆 Mejor día</div>
          {mejorDia ? (
            <>
              <div className="text-lg font-bold text-white">{new Date(mejorDia.key + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}</div>
              <div className="text-sm text-cyan-400">{mejorDia.visitas} visitas</div>
            </>
          ) : <div className="text-sm text-slate-600">Sin datos todavía</div>}
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/30 rounded-xl p-4">
          <div className="text-[10px] text-slate-500 uppercase font-mono mb-1">🥇 Producto más visitado</div>
          {mejorProducto ? (
            <>
              <div className="text-sm font-bold text-white truncate">{mejorProducto.producto}</div>
              <div className="text-sm text-cyan-400">{mejorProducto.visitas} visitas</div>
            </>
          ) : <div className="text-sm text-slate-600">Sin datos todavía</div>}
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/30 rounded-xl p-4">
          <div className="text-[10px] text-slate-500 uppercase font-mono mb-1">📣 Mejor campaña puntual</div>
          {mejorCampaña && (mejorCampaña.visitas || 0) > 0 ? (
            <>
              <div className="text-sm font-bold text-white truncate">{mejorCampaña.producto}</div>
              <div className="text-sm text-cyan-400">{mejorCampaña.visitas} visitas</div>
            </>
          ) : <div className="text-sm text-slate-600">Sin datos todavía</div>}
        </div>
      </div>

      {/* GRÁFICO */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Visitas en el tiempo</h2>
          <div className="flex gap-1 bg-slate-950 border border-slate-800 rounded-full p-1">
            {(["dia", "mes", "anio"] as const).map((p) => (
              <button key={p} onClick={() => setPeriodo(p)}
                className={["text-xs font-semibold px-3 py-1 rounded-full transition-colors", periodo === p ? "bg-cyan-500 text-slate-950" : "text-slate-400"].join(" ")}>
                {p === "dia" ? "Día" : p === "mes" ? "Mes" : "Año"}
              </button>
            ))}
          </div>
        </div>
        {ultimos.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-16">Todavía no hay visitas registradas. Compartí un link /go/ y volvé acá.</p>
        ) : (
          <div className="flex items-end gap-1.5 h-48">
            {ultimos.map((d) => (
              <div key={d.key} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                <div className="text-[10px] text-cyan-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{d.visitas}</div>
                <div className="w-full bg-cyan-500/70 hover:bg-cyan-400 rounded-t transition-colors" style={{ height: `${(d.visitas / max) * 100}%`, minHeight: 2 }} />
                <div className="text-[9px] text-slate-600 mt-1 rotate-0 whitespace-nowrap">{formatKey(d.key)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RANKING */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Ranking por producto</h2>
        {analytics.ranking.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-10">Sin datos todavía.</p>
        ) : (
          <div className="space-y-2">
            {analytics.ranking.map((r, i) => (
              <div key={r.producto} className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-600 w-5">{i + 1}</span>
                <span className="text-sm text-white flex-1 truncate">{r.producto}</span>
                <div className="flex-1 max-w-[200px] bg-slate-950 rounded-full h-2 overflow-hidden">
                  <div className="bg-cyan-500 h-full" style={{ width: `${(r.visitas / analytics.ranking[0].visitas) * 100}%` }} />
                </div>
                <span className="text-xs font-mono text-cyan-400 w-10 text-right">{r.visitas}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
