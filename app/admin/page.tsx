"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { Campaign, Plataforma, Site, Lead, MediaImage, Coupon } from "@/lib/types";

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

async function api(path: string, opts: RequestInit = {}, retries = 3) {
  const res = await fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Firestore devuelve 500 + "RESOURCE_EXHAUSTED: Quota exceeded" cuando
    // hay ráfagas de lecturas simultáneas (típico en proyectos nuevos que
    // todavía no "escalaron" su límite de operaciones por segundo). En vez
    // de romper el panel, reintentamos con backoff antes de tirar el error.
    const isQuota = typeof data.error === "string" && data.error.includes("RESOURCE_EXHAUSTED");
    if (isQuota && retries > 0) {
      await new Promise((r) => setTimeout(r, (4 - retries) * 800 + 400));
      return api(path, opts, retries - 1);
    }
    throw new Error(data.error || `Error ${res.status}`);
  }
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
  const [tab, setTab] = useState<"generar" | "campanas" | "calendario" | "sitios" | "analytics" | "leads" | "imagenes" | "cac" | "automatizacion">("campanas");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [calLink, setCalLink] = useState("");
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
    siteId: "",
    objetivo: "",
    publico: "",
    miedoPrincipal: "",
    tono: "cercano y profesional",
    plataforma: "instagram" as Plataforma,
    destinoUrl: "",
    cantPosts: 5,
    tipoCampana: "tecnologia" as "tecnologia" | "negocio",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Antes se pedían las 5 rutas con Promise.all (todas al mismo
      // instante). Con Firestore recién creado eso puede gatillar
      // RESOURCE_EXHAUSTED aunque el volumen total sea bajo. Las pedimos
      // secuenciales -- unos milisegundos más de carga, pero sin ráfaga.
      const camps = await api("/api/admin/campaigns");
      const sts = await api("/api/admin/sites");
      const an = await api("/api/admin/analytics");
      const lds = await api("/api/admin/leads");
      const cps = await api("/api/admin/coupons");
      const settings = await api("/api/admin/settings");
      setCampaigns(camps);
      setSites(sts);
      setAnalytics(an);
      setLeads(lds);
      setCoupons(cps);
      setCalLink(settings.calLink || "");
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
      setForm((f) => ({ ...f, producto: "", siteId: "", objetivo: "", publico: "", miedoPrincipal: "" }));
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

  const updateLead = async (id: string, patch: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    try {
      await api(`/api/admin/leads/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    } catch (e) {
      alert("Error guardando: " + (e as Error).message);
      load();
    }
  };

  const deleteLead = async (id: string) => {
    if (!confirm("¿Borrar este lead? No se puede deshacer.")) return;
    try {
      await api(`/api/admin/leads/${id}`, { method: "DELETE" });
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      alert("Error: " + (e as Error).message);
    }
  };

  const generarGuion = async (id: string) => {
    const data = await api(`/api/admin/leads/${id}/guion`, { method: "POST" });
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, guionGenerado: data.guion } : l)));
    return data.guion as string;
  };

  const guardarCalLink = async () => {
    await api("/api/admin/settings", { method: "PATCH", body: JSON.stringify({ calLink }) });
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
              { id: "leads", label: "👥 Leads" },
              { id: "calendario", label: "📅 Calendario" },
              { id: "analytics", label: "📊 Analytics" },
              { id: "sitios", label: "🌐 Sitios" },
              { id: "automatizacion", label: "🤖 Automatización" },
              { id: "imagenes", label: "🖼️ Imágenes" },
              { id: "cac", label: "💰 CAC & Cupones" },
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
          <a href="/admin/tv" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-cyan-400 text-sm px-3 py-2 transition-colors font-semibold">
            📺 Modo TV
          </a>
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

            <label className="block text-xs font-mono text-slate-500 uppercase mb-2">Tipo de campaña</label>
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, tipoCampana: "tecnologia" }))}
                className={[
                  "flex-1 text-left text-xs font-semibold p-3 rounded-lg border transition-colors",
                  form.tipoCampana === "tecnologia" ? "bg-cyan-500/20 border-cyan-500 text-cyan-400" : "bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500",
                ].join(" ")}
              >
                🔧 Vender la tecnología / servicio
                <div className="font-normal text-slate-500 mt-1 normal-case">Ej: &quot;e-commerce con IA para vender online&quot;</div>
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, tipoCampana: "negocio" }))}
                className={[
                  "flex-1 text-left text-xs font-semibold p-3 rounded-lg border transition-colors",
                  form.tipoCampana === "negocio" ? "bg-cyan-500/20 border-cyan-500 text-cyan-400" : "bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500",
                ].join(" ")}
              >
                🌱 Vender el rubro en sí (contenido)
                <div className="font-normal text-slate-500 mt-1 normal-case">Ej: &quot;lombrices para tu huerta y ser feliz con tus plantas&quot;, sin mencionar tecnología</div>
              </button>
            </div>

            <label className="block text-xs font-mono text-slate-500 uppercase mb-2">Elegí un sitio (autocompleta todo)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {sites.filter((s) => s.activo).length === 0 && (
                <p className="text-xs text-slate-600">
                  No hay sitios activos todavía. Andá a la pestaña 🌐 Sitios para agregar o activar alguno.
                </p>
              )}
              {sites.filter((s) => s.activo).map((s) => {
                const sinTema = form.tipoCampana === "negocio" && !s.temaNegocio;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      const producto = form.tipoCampana === "negocio" ? (s.temaNegocio || s.descripcion) : s.descripcion;
                      setForm((f) => ({ ...f, producto, publico: s.publico, destinoUrl: s.url, objetivo: s.objetivoSugerido, siteId: s.id }));
                      setGenError("");
                    }}
                    title={sinTema ? "Este sitio no tiene 'tema de negocio' cargado todavía -- va a usar la descripción técnica. Completalo en 🌐 Sitios." : undefined}
                    className={[
                      "text-xs font-semibold bg-slate-950 border px-3 py-2 rounded-lg transition-colors",
                      sinTema ? "border-amber-700/50 text-amber-500/80 hover:border-amber-500" : "border-slate-700 hover:border-cyan-500 hover:text-cyan-400 text-slate-300",
                    ].join(" ")}
                  >
                    {s.emoji} {s.nombre}{sinTema ? " ⚠️" : ""}
                  </button>
                );
              })}
            </div>
            {form.tipoCampana === "negocio" && (
              <p className="text-[11px] text-slate-600 mb-4">
                ⚠️ = ese sitio todavía no tiene &quot;tema de negocio&quot; cargado (la pestaña 🌐 Sitios te deja completarlo).
              </p>
            )}
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
                <input className="input" placeholder="Ej: adultos mayores de 55+ con poca experiencia en tecnología"
                  value={form.publico} onChange={(e) => setForm((f) => ({ ...f, publico: e.target.value }))} />
              </Field>
              <div className="md:col-span-2">
                <Field label="¿Qué es lo que más teme o le preocupa a tu cliente? (opcional, pero muy recomendado)">
                  <textarea className="input min-h-[60px]" placeholder="Ej: tiene miedo de perder sus fotos y contactos al llevar el equipo a reparar, y de que le cobren de más porque 'no entiende de tecnología'"
                    value={form.miedoPrincipal} onChange={(e) => setForm((f) => ({ ...f, miedoPrincipal: e.target.value }))} />
                </Field>
                <p className="text-[11px] text-slate-600 mt-1">
                  Esto es lo que más cambia la calidad del contenido: la IA va a escribir *hablándole* a ese miedo concreto, en vez de un texto genérico de venta.
                </p>
              </div>
              <Field label="Tono">
                <input className="input" placeholder="Ej: paciente, empático, protector -- nunca frío ni técnico"
                  value={form.tono} onChange={(e) => setForm((f) => ({ ...f, tono: e.target.value }))} />
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
        {tab === "leads" && (
          <LeadsTab
            leads={leads}
            calLink={calLink}
            setCalLink={setCalLink}
            onGuardarCalLink={guardarCalLink}
            onUpdate={updateLead}
            onDelete={deleteLead}
            onGenerarGuion={generarGuion}
          />
        )}
        {tab === "analytics" && <AnalyticsTab analytics={analytics} campaigns={campaigns} />}
        {tab === "sitios" && <SitiosTab sites={sites} onAdd={addSite} onUpdate={updateSite} onDelete={deleteSite} />}
        {tab === "automatizacion" && <AutomatizacionTab campaigns={campaigns} />}
        {tab === "imagenes" && <ImagenesTab />}
        {tab === "cac" && <CacTab campaigns={campaigns} leads={leads} coupons={coupons} onUpdateCampaign={updateCampaign} onCouponsRefresh={load} />}
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
  const [showPicker, setShowPicker] = useState(false);
  const [library, setLibrary] = useState<MediaImage[] | null>(null);
  const [publishingIdx, setPublishingIdx] = useState<number | null>(null);
  const [publishError, setPublishError] = useState<{ index: number; message: string } | null>(null);
  const plataformaInfo = PLATAFORMAS.find((p) => p.value === campaign.plataforma);
  const statusInfo = STATUS_CONFIG[campaign.status];

  async function publishToFacebook(postIndex: number) {
    setPublishingIdx(postIndex);
    setPublishError(null);
    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}/publish-facebook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postIndex }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onUpdate({ posts: data.posts });
    } catch (err) {
      setPublishError({ index: postIndex, message: (err as Error).message });
    } finally {
      setPublishingIdx(null);
    }
  }

  function openPicker() {
    setShowPicker(true);
    if (!library) {
      fetch("/api/admin/media").then((r) => r.json()).then(setLibrary).catch(() => setLibrary([]));
    }
  }

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

      <div className="relative mb-4">
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
          {campaign.imagenFondo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={campaign.imagenFondo} alt="" className="w-9 h-9 rounded object-cover border border-slate-800 flex-shrink-0" />
          ) : (
            <span className="w-9 h-9 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-700 text-xs flex-shrink-0">🖼️</span>
          )}
          <input
            type="text"
            defaultValue={campaign.imagenFondo || ""}
            placeholder="URL de una foto real (opcional) — se usa de fondo en la imagen generada"
            className="flex-1 bg-transparent text-xs text-slate-300 outline-none placeholder:text-slate-600 min-w-0"
            onBlur={(e) => {
              if (e.target.value !== (campaign.imagenFondo || "")) onUpdate({ imagenFondo: e.target.value.trim() });
            }}
          />
          <button
            onClick={openPicker}
            className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 whitespace-nowrap flex-shrink-0"
          >
            📚 Elegir
          </button>
        </div>

        {showPicker && (
          <div className="absolute z-20 top-full mt-2 left-0 right-0 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-slate-400">Tu biblioteca de imágenes</span>
              <button onClick={() => setShowPicker(false)} className="text-slate-500 hover:text-white text-xs">✕</button>
            </div>
            {library === null ? (
              <p className="text-xs text-slate-500 py-4 text-center">Cargando…</p>
            ) : library.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                Todavía no subiste fotos. Andá a la pestaña <b>🖼️ Imágenes</b> para subir una.
              </p>
            ) : (
              <div className="grid grid-cols-5 gap-2 max-h-56 overflow-y-auto">
                {library.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => { onUpdate({ imagenFondo: img.url }); setShowPicker(false); }}
                    className="aspect-[4/5] rounded-lg overflow-hidden border-2 border-transparent hover:border-cyan-500 transition-colors"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.thumbUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
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
          {campaign.posts?.map((post, i) => {
            const link = typeof window !== "undefined" ? `${window.location.origin}/go/${campaign.slug}` : `/go/${campaign.slug}`;
            const hashtags = (post.hashtags || []).map((h) => `#${h}`).join(" ");
            return (
              <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-slate-500">Post {i + 1} · {post.formato} · 🕐 {post.horaOptima}</span>
                  <CopyBtn small text={`${post.texto}\n\n${link}\n\n${hashtags}`} />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap mb-2">{post.texto}</p>
                <p className="text-[10px] text-cyan-400 mb-2 break-all">{link}</p>
                <p className="text-[10px] text-cyan-500/70 mb-2">{hashtags}</p>
                {post.cta && <p className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 rounded px-2 py-1 mb-1">CTA: {post.cta}</p>}
                {post.tipVisual && <p className="text-[10px] text-slate-600 mb-2">🎨 {post.tipVisual}</p>}
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/api/admin/campaigns/${campaign.id}/poster?post=${i}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-2.5 py-1.5"
                  >
                    🖼️ Generar imagen para Instagram
                  </a>
                  {campaign.plataforma === "facebook" && (
                    post.facebookPostId ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg px-2.5 py-1.5">
                        ✓ Publicado en Facebook
                      </span>
                    ) : (
                      <button
                        onClick={() => publishToFacebook(i)}
                        disabled={publishingIdx === i}
                        className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/30 rounded-lg px-2.5 py-1.5 disabled:opacity-50"
                      >
                        {publishingIdx === i ? "⟳ Publicando..." : "👥 Publicar en Facebook"}
                      </button>
                    )
                  )}
                </div>
                {publishError?.index === i && (
                  <p className="text-[10px] text-red-400 mt-1.5">⚠ {publishError.message}</p>
                )}
              </div>
            );
          })}
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
  const [modo, setModo] = useState<"manual" | "ia" | "github">("ia");
  const [textoIA, setTextoIA] = useState("");
  const [urlIA, setUrlIA] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [repos, setRepos] = useState<{ name: string; fullName: string; description: string; homepage: string; private: boolean }[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [reposError, setReposError] = useState("");
  const [analizando, setAnalizando] = useState(false);
  const [nuevo, setNuevo] = useState({
    emoji: "🌐",
    nombre: "",
    descripcion: "",
    temaNegocio: "",
    publico: "",
    objetivoSugerido: "generar consultas de nuevos clientes",
    url: "",
  });

  const handleAnalizar = async () => {
    if (textoIA.trim().length < 15) {
      setError("Contame un poco más sobre el producto/negocio (mínimo unas líneas).");
      return;
    }
    setAnalizando(true);
    setError("");
    try {
      const res = await fetch("/api/admin/sites/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: textoIA, url: urlIA }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setNuevo({ ...data, url: urlIA || data.url || "" });
      setModo("manual"); // pasa al formulario normal para que revises/ajustes antes de guardar
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAnalizando(false);
    }
  };

  const loadRepos = async () => {
    if (repos.length > 0 || loadingRepos) return; // ya cargados, no repetir
    setLoadingRepos(true);
    setReposError("");
    try {
      const res = await fetch("/api/admin/github/repos");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setRepos(data);
    } catch (e) {
      setReposError((e as Error).message);
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleAnalizarGithub = async () => {
    if (!repoUrl.trim()) {
      setError("Pegá el link del repositorio (ej: https://github.com/usuario/repo)");
      return;
    }
    setAnalizando(true);
    setError("");
    try {
      const res = await fetch("/api/admin/sites/extract-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl, url: urlIA }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setNuevo({ ...data, url: urlIA || data.url || "" });
      setModo("manual");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAnalizando(false);
    }
  };

  const handleAdd = async () => {
    if (!nuevo.nombre || !nuevo.descripcion || !nuevo.url) {
      setError("Completá al menos nombre, descripción y URL.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onAdd(nuevo);
      setNuevo({ emoji: "🌐", nombre: "", descripcion: "", temaNegocio: "", publico: "", objetivoSugerido: "generar consultas de nuevos clientes", url: "" });
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
          <div className="flex gap-2 mb-5">
            <button
              type="button"
              onClick={() => setModo("ia")}
              className={["text-xs font-semibold px-3 py-1.5 rounded-full transition-colors", modo === "ia" ? "bg-cyan-500 text-slate-950" : "bg-slate-950 border border-slate-700 text-slate-400"].join(" ")}
            >
              ✨ Describir y que la IA lo arme
            </button>
            <button
              type="button"
              onClick={() => { setModo("github"); loadRepos(); }}
              className={["text-xs font-semibold px-3 py-1.5 rounded-full transition-colors", modo === "github" ? "bg-cyan-500 text-slate-950" : "bg-slate-950 border border-slate-700 text-slate-400"].join(" ")}
            >
              🐙 Desde GitHub
            </button>
            <button
              type="button"
              onClick={() => setModo("manual")}
              className={["text-xs font-semibold px-3 py-1.5 rounded-full transition-colors", modo === "manual" ? "bg-cyan-500 text-slate-950" : "bg-slate-950 border border-slate-700 text-slate-400"].join(" ")}
            >
              ✏️ Completar manual
            </button>
          </div>

          {modo === "github" && (
            <>
              <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Elegí tu repositorio</label>

              {loadingRepos && <p className="text-xs text-slate-500 mb-3">Cargando tus repos…</p>}

              {reposError && (
                <p className="text-xs text-amber-500 mb-3">
                  {reposError} — podés pegar la URL manualmente en el campo de abajo igual.
                </p>
              )}

              {repos.length > 0 && (
                <select
                  className="input mb-3"
                  value={repoUrl}
                  onChange={(e) => {
                    setRepoUrl(e.target.value);
                    const r = repos.find((x) => `https://github.com/${x.fullName}` === e.target.value);
                    if (r?.homepage) setUrlIA(r.homepage);
                  }}
                >
                  <option value="">-- Elegí un repo --</option>
                  {repos.map((r) => (
                    <option key={r.fullName} value={`https://github.com/${r.fullName}`}>
                      {r.private ? "🔒 " : ""}{r.name}{r.description ? ` — ${r.description}` : ""}
                    </option>
                  ))}
                </select>
              )}

              <label className="block text-xs font-mono text-slate-500 uppercase mb-1">
                {repos.length > 0 ? "...o pegá otra URL manualmente" : "Link del repositorio"}
              </label>
              <input className="input mb-3" placeholder="https://github.com/tu-usuario/tu-repo" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} />
              <label className="block text-xs font-mono text-slate-500 uppercase mb-1">URL del sitio en vivo (opcional, para el link de destino de las campañas)</label>
              <input className="input mb-4" placeholder="https://..." value={urlIA} onChange={(e) => setUrlIA(e.target.value)} />
              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
              <button onClick={handleAnalizarGithub} disabled={analizando} className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold px-6 py-2.5 rounded-lg transition-colors">
                {analizando ? "Leyendo el repo…" : "🐙 Analizar repositorio"}
              </button>
              <p className="text-[11px] text-slate-600 mt-3">
                Leo el README, la descripción del repo y el código de la página principal si la encuentro. Si es privado, necesitás tener <code className="text-slate-500">GITHUB_TOKEN</code> cargado en las variables de entorno.
              </p>
            </>
          )}

          {modo === "ia" && (
            <>
              <label className="block text-xs font-mono text-slate-500 uppercase mb-1">
                Contame sobre el producto/negocio (pegá lo que tengas: texto de tu web, notas, precios, lo que sea)
              </label>
              <textarea
                className="input mb-3"
                style={{ minHeight: 120, resize: "vertical" as const }}
                placeholder='Ej: "Vendemos lombrices californianas para compost casero. Pack de 100 lombrices a $8000, ideal para armar tu propia lombricompostera en casa y tener plantas más sanas..."'
                value={textoIA}
                onChange={(e) => setTextoIA(e.target.value)}
              />
              <label className="block text-xs font-mono text-slate-500 uppercase mb-1">URL (opcional)</label>
              <input className="input mb-4" placeholder="https://..." value={urlIA} onChange={(e) => setUrlIA(e.target.value)} />
              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
              <button onClick={handleAnalizar} disabled={analizando} className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold px-6 py-2.5 rounded-lg transition-colors">
                {analizando ? "Analizando…" : "✨ Analizar con IA"}
              </button>
            </>
          )}

          {modo === "manual" && (
            <>
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
            <div className="md:col-span-2">
              <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Tema de negocio (para campañas de contenido, sin mencionar tecnología)</label>
              <input className="input" placeholder="Ej: Lombrices para tu huerta y ser feliz con tus plantas" value={nuevo.temaNegocio} onChange={(e) => setNuevo((f) => ({ ...f, temaNegocio: e.target.value }))} />
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
            </>
          )}
        </div>
      )}

      <div className="space-y-3">
        {sites.map((s) => (
          <SiteRow key={s.id} site={s} onUpdate={onUpdate} onDelete={onDelete} />
        ))}
        {sites.length === 0 && <p className="text-slate-500 text-sm text-center py-10">No hay sitios cargados todavía.</p>}
      </div>
    </div>
  );
}

const LEAD_STATUS_CONFIG: Record<Lead["status"], { label: string; color: string }> = {
  nuevo: { label: "🆕 Nuevo", color: "bg-cyan-500/20 text-cyan-400" },
  quiere_agendar: { label: "📅 Quiere agendar", color: "bg-purple-500/20 text-purple-400" },
  contactado: { label: "💬 Contactado", color: "bg-amber-500/20 text-amber-400" },
  reunion_agendada: { label: "🗓️ Reunión agendada", color: "bg-blue-500/20 text-blue-400" },
  cliente: { label: "✅ Cliente", color: "bg-emerald-500/20 text-emerald-400" },
  descartado: { label: "❌ Descartado", color: "bg-slate-800 text-slate-500" },
};

function LeadsTab({
  leads, calLink, setCalLink, onGuardarCalLink, onUpdate, onDelete, onGenerarGuion,
}: {
  leads: Lead[];
  calLink: string;
  setCalLink: (v: string) => void;
  onGuardarCalLink: () => Promise<void>;
  onUpdate: (id: string, patch: Partial<Lead>) => void;
  onDelete: (id: string) => void;
  onGenerarGuion: (id: string) => Promise<string>;
}) {
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await onGuardarCalLink();
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    } finally {
      setGuardando(false);
    }
  };

  const nuevos = leads.filter((l) => l.status === "nuevo" || l.status === "quiere_agendar").length;

  return (
    <div className="space-y-6">
      {/* CONFIG CAL.COM */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-1">📅 Link de agendamiento (Cal.com)</h2>
        <p className="text-sm text-slate-500 mb-4">
          Después de dejar sus datos, el lead ve un botón para agendar una videollamada acá. Si no tenés cuenta,
          creála gratis en <a href="https://cal.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">cal.com</a> y pegá tu link de reserva (ej: cal.com/tu-usuario/consulta).
        </p>
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="https://cal.com/tu-usuario/consulta" value={calLink} onChange={(e) => setCalLink(e.target.value)} />
          <button onClick={handleGuardar} disabled={guardando} className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold px-5 py-2 rounded-lg whitespace-nowrap transition-colors">
            {guardando ? "Guardando..." : guardado ? "✓ Guardado" : "Guardar"}
          </button>
        </div>
      </div>

      {/* RESUMEN */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="text-2xl font-black text-cyan-400">{leads.length}</div>
          <div className="text-xs text-white font-medium mt-1">Total de leads</div>
        </div>
        <div className="bg-slate-900/50 border border-amber-500/30 rounded-xl p-4">
          <div className="text-2xl font-black text-amber-400">{nuevos}</div>
          <div className="text-xs text-white font-medium mt-1">Sin gestionar</div>
        </div>
        <div className="bg-slate-900/50 border border-emerald-500/30 rounded-xl p-4">
          <div className="text-2xl font-black text-emerald-400">{leads.filter((l) => l.status === "cliente").length}</div>
          <div className="text-xs text-white font-medium mt-1">Convertidos a cliente</div>
        </div>
        <div className="bg-slate-900/50 border border-purple-500/30 rounded-xl p-4">
          <div className="text-2xl font-black text-purple-400">{leads.filter((l) => l.status === "quiere_agendar" || l.status === "reunion_agendada").length}</div>
          <div className="text-xs text-white font-medium mt-1">En proceso de reunión</div>
        </div>
      </div>

      {/* LISTA */}
      {leads.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl">
          <p className="text-slate-400 mb-2">Todavía no llegó ningún lead.</p>
          <p className="text-slate-600 text-sm">
            Compartí el link <code className="text-slate-500">/lead?campaign=TU_SLUG</code> en tus campañas, o embebelo como formulario en tus landings.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((l) => (
            <LeadRow key={l.id} lead={l} onUpdate={onUpdate} onDelete={onDelete} onGenerarGuion={onGenerarGuion} />
          ))}
        </div>
      )}
    </div>
  );
}

function LeadRow({
  lead: l, onUpdate, onDelete, onGenerarGuion,
}: {
  lead: Lead;
  onUpdate: (id: string, patch: Partial<Lead>) => void;
  onDelete: (id: string) => void;
  onGenerarGuion: (id: string) => Promise<string>;
}) {
  const [generando, setGenerando] = useState(false);
  const [mostrarGuion, setMostrarGuion] = useState(false);
  const [error, setError] = useState("");
  const statusInfo = LEAD_STATUS_CONFIG[l.status];

  const handleGenerar = async () => {
    setGenerando(true);
    setError("");
    try {
      await onGenerarGuion(l.id);
      setMostrarGuion(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">{l.nombre}</span>
            <span className={["text-[10px] font-mono px-2 py-0.5 rounded-full", statusInfo.color].join(" ")}>{statusInfo.label}</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {l.email && <span>✉️ {l.email} </span>}
            {l.whatsapp && <span>📱 {l.whatsapp}</span>}
          </div>
          <div className="text-xs text-slate-600 mt-0.5">Vino de: {l.producto} ({l.origen})</div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={l.status}
            onChange={(e) => onUpdate(l.id, { status: e.target.value as Lead["status"] })}
            className="bg-slate-950 border border-slate-700 rounded-lg text-xs px-2 py-1.5 text-slate-300 outline-none"
          >
            {Object.entries(LEAD_STATUS_CONFIG).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
          </select>
          <button onClick={() => onDelete(l.id)} className="text-slate-600 hover:text-red-400 text-xs px-2 py-1.5 transition-colors">Borrar</button>
        </div>
      </div>

      {l.mensaje && (
        <p className="text-sm text-slate-300 bg-slate-950 border border-slate-800 rounded-lg p-3 mt-2">&quot;{l.mensaje}&quot;</p>
      )}

      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={l.guionGenerado ? () => setMostrarGuion((v) => !v) : handleGenerar}
          disabled={generando}
          className="text-xs font-semibold bg-slate-950 border border-slate-800 hover:border-cyan-500 hover:text-cyan-400 text-slate-400 px-3 py-1.5 rounded-lg transition-colors"
        >
          {generando ? "Generando…" : l.guionGenerado ? (mostrarGuion ? "▲ Ocultar guion" : "▼ Ver guion") : "✨ Generar guion de primer contacto"}
        </button>
        {l.guionGenerado && (
          <button onClick={handleGenerar} disabled={generando} className="text-xs text-slate-600 hover:text-slate-400">
            🔄 Regenerar
          </button>
        )}
      </div>

      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

      {mostrarGuion && l.guionGenerado && (
        <div className="mt-3 bg-slate-950 border border-cyan-500/30 rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Guion sugerido (con energía, invita a agendar)</span>
            <CopyBtn small text={l.guionGenerado} />
          </div>
          <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{l.guionGenerado}</p>
        </div>
      )}
    </div>
  );
}

interface CronLogEntry {
  id: string;
  ejecutadoEn: number;
  resultados: Array<{ site: string; ok: boolean; detalle: string }>;
}

function AutomatizacionTab({ campaigns }: { campaigns: Campaign[] }) {
  const [logs, setLogs] = useState<CronLogEntry[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/cron-logs")
      .then((r) => r.json())
      .then(setLogs)
      .catch(() => setError("No pudimos cargar el historial de corridas."));
  }, []);

  const autoCampaigns = campaigns
    .filter((c) => c.origen === "automatico")
    .sort((a, b) => (b.publishedAt || b.createdAt) - (a.publishedAt || a.createdAt));

  const fmtFecha = (ts: number) =>
    new Date(ts).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-white font-bold text-lg mb-1">🤖 Historial de corridas automáticas</h3>
        <p className="text-slate-500 text-sm mb-4">
          Cada vez que el cron se ejecuta (según <code className="text-cyan-400">vercel.json</code> o tu workflow de GitHub Actions), queda un registro acá, aunque no haya publicado nada.
        </p>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {logs === null && !error && <p className="text-slate-500 text-sm">Cargando...</p>}
        {logs?.length === 0 && <p className="text-slate-500 text-sm">Todavía no corrió ninguna vez.</p>}

        <div className="space-y-3">
          {logs?.map((log) => (
            <div key={log.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <div className="text-sm font-semibold text-white mb-2">🕐 {fmtFecha(log.ejecutadoEn)}</div>
              {log.resultados.length === 0 ? (
                <p className="text-xs text-slate-500">Corrió, pero ningún sitio tenía la auto-publicación activada.</p>
              ) : (
                <div className="space-y-1.5">
                  {log.resultados.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className={r.ok ? "text-green-400" : "text-red-400"}>{r.ok ? "✓" : "✗"}</span>
                      <span className="text-slate-300 font-medium">{r.site}:</span>
                      <span className="text-slate-500">{r.detalle}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-white font-bold text-lg mb-1">📈 Actividad de lo publicado automáticamente</h3>
        <p className="text-slate-500 text-sm mb-4">Visitas y engagement en vivo de cada post que generó y publicó la IA sola.</p>

        {autoCampaigns.length === 0 ? (
          <p className="text-slate-500 text-sm">Todavía no hay ninguna campaña generada automáticamente.</p>
        ) : (
          <div className="space-y-2">
            {autoCampaigns.map((c) => (
              <div key={c.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[180px]">
                  <div className="text-sm font-semibold text-white">{c.producto}</div>
                  <div className="text-xs text-slate-500">
                    {c.publishedAt ? fmtFecha(c.publishedAt) : "sin publicar"} · {c.plataforma}
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-slate-400">
                  <span>👁️ {c.visitas} visitas</span>
                  <span>❤️ {c.likes}</span>
                  <span>💬 {c.comentarios}</span>
                  <span>🔁 {c.compartidos}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SiteRow({ site: s, onUpdate, onDelete }: { site: Site & { hasFacebookToken?: boolean }; onUpdate: (id: string, patch: Partial<Site>) => void; onDelete: (id: string) => void }) {

  const [editing, setEditing] = useState(false);
  const [descripcion, setDescripcion] = useState(s.descripcion);
  const [temaNegocio, setTemaNegocio] = useState(s.temaNegocio || "");
  const [facebookPageId, setFacebookPageId] = useState(s.facebookPageId || "");
  const [facebookPageAccessToken, setFacebookPageAccessToken] = useState(""); // siempre vacío -- el token nunca vuelve del servidor
  const [autoPublicar, setAutoPublicar] = useState(s.autoPublicarFacebook || false);

  return (
    <div className={["bg-slate-900/50 border rounded-xl p-4", s.activo ? "border-slate-800" : "border-slate-800/50 opacity-50"].join(" ")}>
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-xl">{s.emoji}</span>
        <div className="flex-1 min-w-[200px]">
          <div className="text-white font-semibold text-sm">{s.nombre}</div>
          <div className="text-xs text-slate-500 truncate">{s.url}</div>
        </div>
        {!s.temaNegocio && <span className="text-[10px] text-amber-500/80">sin tema de negocio</span>}
        {s.hasFacebookToken ? (
          <span className="text-[10px] text-blue-400">👥 Facebook conectado</span>
        ) : (
          <span className="text-[10px] text-slate-600">sin Facebook</span>
        )}
        <button onClick={() => setEditing((v) => !v)} className="text-xs font-semibold text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
          {editing ? "▲" : "✏️"} Editar
        </button>
        <button
          onClick={() => onUpdate(s.id, { activo: !s.activo })}
          className={["text-xs font-bold px-3 py-1.5 rounded-full transition-colors", s.activo ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-800 text-slate-500"].join(" ")}
        >
          {s.activo ? "✓ Activo" : "Inactivo"}
        </button>
        <button onClick={() => onDelete(s.id)} className="text-slate-600 hover:text-red-400 text-xs px-2 py-1.5 transition-colors">
          Borrar
        </button>
      </div>
      {editing && (
        <div className="mt-4 pt-4 border-t border-slate-800/50 space-y-3">
          <div>
            <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Descripción (venta de tecnología)</label>
            <input className="input" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Tema de negocio (venta del rubro, sin mencionar tecnología)</label>
            <input className="input" placeholder="Ej: Lombrices para tu huerta y ser feliz con tus plantas" value={temaNegocio} onChange={(e) => setTemaNegocio(e.target.value)} />
          </div>
          <div className="pt-2 border-t border-slate-800/50">
            <p className="text-xs font-mono text-blue-400/80 uppercase mb-2">👥 Página de Facebook de este negocio (para publicar campañas)</p>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Page ID</label>
                <input className="input" placeholder="ej. 123456789012345" value={facebookPageId} onChange={(e) => setFacebookPageId(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase mb-1">
                  Access Token {s.hasFacebookToken ? "(dejalo vacío para mantener el actual)" : ""}
                </label>
                <input
                  className="input"
                  type="password"
                  placeholder={s.hasFacebookToken ? "•••••••• ya configurado" : "token de larga duración"}
                  value={facebookPageAccessToken}
                  onChange={(e) => setFacebookPageAccessToken(e.target.value)}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 mt-3 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={autoPublicar}
                onChange={(e) => setAutoPublicar(e.target.checked)}
              />
              🤖 Publicar automáticamente (la IA genera y publica sola, sin que tengas que tocar nada)
            </label>
          </div>
          <button
            onClick={() => {
              const patch: Partial<Site> = { descripcion, temaNegocio, facebookPageId, autoPublicarFacebook: autoPublicar };
              if (facebookPageAccessToken) patch.facebookPageAccessToken = facebookPageAccessToken;
              onUpdate(s.id, patch);
              setFacebookPageAccessToken("");
              setEditing(false);
            }}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
          >
            Guardar cambios
          </button>
        </div>
      )}
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

const PRESETS_IMG = [
  { id: "feed", label: "Feed (1080×1350)" },
  { id: "story", label: "Story / Reel (1080×1920)" },
  { id: "cuadrado", label: "Cuadrado (1080×1080)" },
  { id: "original", label: "Original (solo comprimir)" },
];

function ImagenesTab() {
  const [images, setImages] = useState<MediaImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preset, setPreset] = useState("feed");
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/media");
      const data = await res.json();
      setImages(data);
    } catch {
      setError("No se pudo cargar la biblioteca de imágenes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        form.append("preset", preset);
        const res = await fetch("/api/admin/media", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al subir la imagen.");
        setImages((prev) => [data, ...prev]);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    setImages((prev) => prev.filter((i) => i.id !== id));
    try {
      await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
    } catch {
      load(); // si falló, volvemos a traer la lista real
    }
  }

  function copyUrl(img: MediaImage) {
    navigator.clipboard.writeText(img.url);
    setCopiedId(img.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Biblioteca de imágenes</h2>
          <p className="text-sm text-slate-500">Subí fotos reales, se optimizan automáticamente y quedan listas para pegar como fondo en tus campañas.</p>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-xs font-semibold text-slate-400">Optimizar para:</span>
          {PRESETS_IMG.map((p) => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={[
                "text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors",
                preset === p.id ? "bg-cyan-500 text-slate-950 border-cyan-500" : "text-slate-400 border-slate-800 hover:text-white",
              ].join(" ")}
            >
              {p.label}
            </button>
          ))}
        </div>

        <label
          className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-xl py-10 cursor-pointer transition-colors"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        >
          <span className="text-3xl">{uploading ? "⏳" : "🖼️"}</span>
          <span className="text-sm text-slate-400">
            {uploading ? "Subiendo y optimizando…" : "Arrastrá una foto acá o hacé click para elegir"}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={uploading}
          />
        </label>
        {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : images.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-10 text-center text-slate-500 text-sm">
          Todavía no subiste ninguna imagen.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((img) => (
            <div key={img.id} className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.thumbUrl} alt="" className="w-full aspect-[4/5] object-cover" />
              <div className="p-2.5">
                <p className="text-[10px] font-mono text-slate-600 mb-2">
                  {img.width}×{img.height} · {(img.sizeBytes / 1024).toFixed(0)}KB
                </p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => copyUrl(img)}
                    className="flex-1 text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 rounded-lg py-1.5"
                  >
                    {copiedId === img.id ? "✓ Copiada" : "📋 Copiar URL"}
                  </button>
                  <button
                    onClick={() => handleDelete(img.id)}
                    className="text-[10px] text-slate-600 hover:text-red-400 px-2"
                  >
                    Borrar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CacTab({
  campaigns, leads, coupons, onUpdateCampaign, onCouponsRefresh,
}: {
  campaigns: Campaign[];
  leads: Lead[];
  coupons: Coupon[];
  onUpdateCampaign: (id: string, patch: Partial<Campaign>) => void;
  onCouponsRefresh: () => void;
}) {
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemMonto, setRedeemMonto] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState("");
  const [receipt, setReceipt] = useState<Coupon | null>(null);

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    setRedeeming(true);
    setRedeemError("");
    setReceipt(null);
    try {
      const res = await fetch("/api/admin/coupons/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: redeemCode, montoOriginal: Number(redeemMonto) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al canjear.");
      setReceipt(data);
      setRedeemCode("");
      setRedeemMonto("");
      onCouponsRefresh();
    } catch (err) {
      setRedeemError((err as Error).message);
    } finally {
      setRedeeming(false);
    }
  }

  const totalGasto = campaigns.reduce((s, c) => s + (c.gastoPublicitario || 0), 0);
  const totalCanjes = coupons.filter((c) => c.status === "canjeado").length;
  const totalComision = coupons.reduce((s, c) => s + (c.comisionEzeti || 0), 0);
  const cacGlobal = totalCanjes > 0 ? totalGasto / totalCanjes : null;

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-1">CAC & Cupones</h2>
      <p className="text-sm text-slate-500 mb-6">Costo de adquisición real por campaña: clics → leads → cupones canjeados en el local.</p>

      {/* resumen global */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatBox label="Gasto total en pauta" value={`$${totalGasto.toLocaleString("es-AR")}`} />
        <StatBox label="Cupones canjeados" value={totalCanjes.toString()} />
        <StatBox label="CAC global" value={cacGlobal ? `$${cacGlobal.toLocaleString("es-AR", { maximumFractionDigits: 0 })}` : "—"} />
        <StatBox label="Comisión generada" value={`$${totalComision.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`} />
      </div>

      {/* canjear cupón */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-8">
        <h3 className="text-sm font-bold text-white mb-1">🎟️ Canjear cupón (en el local)</h3>
        <p className="text-xs text-slate-500 mb-4">El código que te muestra el cliente + el precio real del servicio. El sistema calcula el descuento y la comisión solo.</p>
        <form onSubmit={handleRedeem} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Código</label>
            <input className="input" placeholder="EZT-XXXXX" value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value.toUpperCase())} />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Precio real del servicio ($)</label>
            <input type="number" className="input" placeholder="15000" value={redeemMonto}
              onChange={(e) => setRedeemMonto(e.target.value)} />
          </div>
          <button type="submit" disabled={redeeming || !redeemCode || !redeemMonto}
            className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold px-6 py-2.5 rounded-lg transition-colors">
            {redeeming ? "Canjeando…" : "Canjear"}
          </button>
        </form>
        {redeemError && <p className="text-red-400 text-xs mt-3">{redeemError}</p>}
        {receipt && (
          <div className="mt-4 bg-slate-950 border border-cyan-500/30 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div><p className="text-[10px] text-slate-500 uppercase">Precio original</p><p className="text-white font-bold">${receipt.montoOriginal?.toLocaleString("es-AR")}</p></div>
            <div><p className="text-[10px] text-slate-500 uppercase">Con recargo (10%)</p><p className="text-white font-bold">${receipt.montoConRecargo?.toLocaleString("es-AR")}</p></div>
            <div><p className="text-[10px] text-slate-500 uppercase">Cliente paga</p><p className="text-cyan-400 font-bold">${receipt.montoFinalCliente?.toLocaleString("es-AR")}</p></div>
            <div><p className="text-[10px] text-slate-500 uppercase">Comisión ezeti</p><p className="text-amber-400 font-bold">${receipt.comisionEzeti?.toLocaleString("es-AR")}</p></div>
          </div>
        )}
      </div>

      {/* tabla por campaña */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-[10px] font-mono text-slate-500 uppercase">
              <th className="p-3">Campaña</th>
              <th className="p-3">Gasto en pauta</th>
              <th className="p-3">Clics</th>
              <th className="p-3">Leads</th>
              <th className="p-3">Canjes</th>
              <th className="p-3">Clic→Lead</th>
              <th className="p-3">Lead→Canje</th>
              <th className="p-3">CAC</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => {
              const clics = c.visitas || 0;
              const leadsCamp = leads.filter((l) => l.campaignId === c.id).length;
              const canjesCamp = coupons.filter((cp) => cp.campaignId === c.id && cp.status === "canjeado").length;
              const cac = c.gastoPublicitario && canjesCamp > 0 ? c.gastoPublicitario / canjesCamp : null;
              const tasaClicLead = clics > 0 ? ((leadsCamp / clics) * 100).toFixed(1) : "—";
              const tasaLeadCanje = leadsCamp > 0 ? ((canjesCamp / leadsCamp) * 100).toFixed(1) : "—";
              return (
                <tr key={c.id} className="border-b border-slate-800/50 last:border-0">
                  <td className="p-3 text-white font-medium max-w-[160px] truncate">{c.producto}</td>
                  <td className="p-3">
                    <input
                      type="number"
                      defaultValue={c.gastoPublicitario || ""}
                      placeholder="$0"
                      className="w-24 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white outline-none focus:border-cyan-500"
                      onBlur={(e) => {
                        const val = Number(e.target.value) || 0;
                        if (val !== (c.gastoPublicitario || 0)) onUpdateCampaign(c.id, { gastoPublicitario: val });
                      }}
                    />
                  </td>
                  <td className="p-3 text-slate-300">{clics}</td>
                  <td className="p-3 text-slate-300">{leadsCamp}</td>
                  <td className="p-3 text-slate-300">{canjesCamp}</td>
                  <td className="p-3 text-slate-500 font-mono text-xs">{tasaClicLead}{tasaClicLead !== "—" && "%"}</td>
                  <td className="p-3 text-slate-500 font-mono text-xs">{tasaLeadCanje}{tasaLeadCanje !== "—" && "%"}</td>
                  <td className="p-3 font-bold text-cyan-400">{cac ? `$${cac.toLocaleString("es-AR", { maximumFractionDigits: 0 })}` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {campaigns.length === 0 && <p className="text-sm text-slate-500 p-6 text-center">Todavía no hay campañas.</p>}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
      <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}
