"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import type { Campaign, Plataforma } from "@/lib/types";

const PLATAFORMAS: { value: Plataforma; label: string; icon: string }[] = [
  { value: "instagram", label: "Instagram", icon: "📸" },
  { value: "linkedin", label: "LinkedIn", icon: "💼" },
  { value: "facebook", label: "Facebook", icon: "👥" },
  { value: "tiktok", label: "TikTok", icon: "🎵" },
];

// Tus productos reales -- un click llena producto, público y link de destino.
// El objetivo lo dejamos para que lo ajustes vos según qué estés impulsando
// esa semana (no hay un "objetivo correcto" único por producto).
const PRODUCT_PRESETS: { emoji: string; producto: string; publico: string; destinoUrl: string; objetivoSugerido: string }[] = [
  {
    emoji: "🔍",
    producto: "AuditIA — auditoría forense con IA para detectar irregularidades, fraude y pagos sospechosos",
    publico: "administradores de consorcios y responsables financieros",
    destinoUrl: "https://auditia-consorcial.onrender.com/overview",
    objetivoSugerido: "conseguir demos agendadas",
  },
  {
    emoji: "🏃",
    producto: "PaceAI — coaching deportivo con planes personalizados y métricas generadas por IA",
    publico: "corredores que entrenan para una carrera",
    destinoUrl: "https://paceia.ezeti.pro",
    objetivoSugerido: "conseguir nuevos usuarios registrados",
  },
  {
    emoji: "🩺",
    producto: "Consultorio Dra. Verónica — mejora la comunicación con pacientes",
    publico: "pacientes actuales y potenciales del consultorio",
    destinoUrl: "https://consultorio-dra-veronica.vercel.app/",
    objetivoSugerido: "generar turnos e interacción con pacientes",
  },
  {
    emoji: "🥚",
    producto: "Incubadora AI — descubrí hipótesis, oportunidades y caminos de negocio con IA",
    publico: "emprendedores en etapa de idea",
    destinoUrl: "https://incubadora-ai-frontend.onrender.com/",
    objetivoSugerido: "conseguir usuarios probando la herramienta",
  },
  {
    emoji: "🌱",
    producto: "Semilla AI — roadmap de desarrollo generado por IA para tu proyecto",
    publico: "emprendedores que ya tienen una idea validada",
    destinoUrl: "https://semillai-c0y1.onrender.com/dashboard",
    objetivoSugerido: "conseguir usuarios probando la herramienta",
  },
  {
    emoji: "🪱",
    producto: "Tierra Viva — e-commerce con IA para vender y escalar sin perder identidad de marca",
    publico: "dueños de emprendimientos chicos que venden online",
    destinoUrl: "https://tierraviva.ezeti.pro/",
    objetivoSugerido: "conseguir primeras ventas",
  },
  {
    emoji: "💼",
    producto: "JobTrack AI — organizá tu búsqueda laboral con scraping e IA",
    publico: "profesionales buscando trabajo activamente",
    destinoUrl: "https://jobtrack-ai-frontend.onrender.com/",
    objetivoSugerido: "conseguir usuarios probando la herramienta",
  },
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
  const [tab, setTab] = useState<"generar" | "campanas" | "calendario">("campanas");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
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
      setCampaigns(await api("/api/admin/campaigns"));
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

            <label className="block text-xs font-mono text-slate-500 uppercase mb-2">Elegí un producto (autocompleta todo)</label>
            <div className="flex flex-wrap gap-2 mb-6">
              {PRODUCT_PRESETS.map((p) => (
                <button
                  key={p.destinoUrl}
                  type="button"
                  onClick={() => {
                    setForm((f) => ({
                      ...f,
                      producto: p.producto,
                      publico: p.publico,
                      destinoUrl: p.destinoUrl,
                      objetivo: p.objetivoSugerido,
                    }));
                    setGenError("");
                  }}
                  className="text-xs font-semibold bg-slate-950 border border-slate-700 hover:border-cyan-500 hover:text-cyan-400 text-slate-300 px-3 py-2 rounded-lg transition-colors"
                >
                  {p.emoji} {p.producto.split(" — ")[0]}
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