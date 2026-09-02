"use client";
import { useState, useEffect, useRef } from "react";
import type { VistaPreviaLanding, VistaPreviaEcommerce } from "@/lib/types";

type Paso = "form" | "semilla" | "generando" | "preview";

const TIPOS_NEGOCIO = [
  { id: "comercio", label: "🛍️ Comercio / Tienda" },
  { id: "servicio", label: "💼 Servicio profesional" },
  { id: "evento", label: "🎉 Evento" },
  { id: "otro", label: "🤔 Otro" },
];

const OBJETIVOS = [
  { id: "vender", label: "Vender productos online" },
  { id: "captar", label: "Captar más clientes" },
  { id: "organizar", label: "Organizar algo (turnos, inventario, pedidos)" },
  { id: "mostrar", label: "Mostrar mi trabajo" },
];

const ETAPAS = [
  { id: "cero", label: "Arranco de cero" },
  { id: "mejorar", label: "Ya tengo algo y quiero mejorarlo" },
];

const MENSAJES_CARGA = [
  "Analizando tu idea...",
  "Eligiendo los colores...",
  "Escribiendo los textos...",
  "Armando tu vista previa...",
];

function AnimacionGenerando() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % MENSAJES_CARGA.length), 1100);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-10 text-center">
      <div className="w-14 h-14 mx-auto mb-6 rounded-full border-4 border-slate-800 border-t-cyan-400 animate-spin" />
      <p className="text-white font-semibold">{MENSAJES_CARGA[i]}</p>
      <p className="text-slate-600 text-xs mt-2">Esto tarda unos segundos</p>
    </div>
  );
}

function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      <div className="bg-slate-800/60 px-4 py-2.5 flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
      </div>
      <div className="bg-white text-slate-900 max-h-[60vh] overflow-y-auto">{children}</div>
    </div>
  );
}

function LandingPreview({ v }: { v: VistaPreviaLanding }) {
  return (
    <div>
      <div className="px-6 py-14 text-center" style={{ background: `${v.colorPrimario}12` }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: v.colorPrimario }}>
          {v.nombreNegocio}
        </p>
        <h1 className="text-2xl font-black mb-2">{v.hero.titulo}</h1>
        <p className="text-slate-600 text-sm mb-5">{v.hero.subtitulo}</p>
        <button className="text-sm font-bold text-white px-5 py-2.5 rounded-full" style={{ background: v.colorPrimario }}>
          {v.hero.cta}
        </button>
      </div>
      <div className="px-6 py-8 border-t border-slate-100">
        <p className="text-sm text-slate-600 leading-relaxed">{v.sobre}</p>
      </div>
      <div className="px-6 py-8 border-t border-slate-100 grid gap-4">
        {v.servicios.map((s, i) => (
          <div key={i} className="flex gap-3">
            <span className="text-lg" style={{ color: v.colorPrimario }}>
              ✓
            </span>
            <div>
              <p className="font-bold text-sm">{s.titulo}</p>
              <p className="text-xs text-slate-500">{s.descripcion}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="px-6 py-8 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-600 mb-3">{v.contacto}</p>
        <button className="text-xs font-bold text-white px-4 py-2 rounded-full" style={{ background: v.colorPrimario }}>
          Escribir por WhatsApp
        </button>
      </div>
    </div>
  );
}

function EcommercePreview({ v }: { v: VistaPreviaEcommerce }) {
  return (
    <div>
      <div className="px-6 py-8 text-center" style={{ background: `${v.colorPrimario}12` }}>
        <p className="text-xl font-black mb-1">{v.nombreNegocio}</p>
        <p className="text-slate-600 text-sm">{v.tagline}</p>
      </div>
      <div className="px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {v.productos.map((p, i) => (
          <div key={i} className="border border-slate-100 rounded-xl p-3">
            <div className="w-full aspect-square rounded-lg mb-2" style={{ background: `${v.colorPrimario}18` }} />
            <p className="font-bold text-sm">{p.nombre}</p>
            <p className="text-xs text-slate-500 mb-1">{p.descripcion}</p>
            <p className="font-bold text-sm" style={{ color: v.colorPrimario }}>
              {p.precio}
            </p>
            <button className="w-full mt-2 text-xs font-bold text-white py-1.5 rounded-lg" style={{ background: v.colorPrimario }}>
              Agregar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SetiPage() {
  const [paso, setPaso] = useState<Paso>("form");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [vistaPrevia, setVistaPrevia] = useState<VistaPreviaLanding | VistaPreviaEcommerce | null>(null);
  const yaGenero = useRef(false);

  const [form, setForm] = useState({ nombre: "", email: "", whatsapp: "" });
  const [semilla, setSemilla] = useState({ tipoNegocio: "", objetivoSemilla: "", etapaActual: "", detalleLibre: "" });

  const enviarDatos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || (!form.email && !form.whatsapp)) {
      setError("Contanos tu nombre y al menos un dato de contacto (email o WhatsApp).");
      return;
    }
    setError("");
    setEnviando(true);
    try {
      const res = await fetch("/api/seti/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar");
      setLeadId(data.id);
      setPaso("semilla");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  const puedeAvanzar = semilla.tipoNegocio && semilla.objetivoSemilla && semilla.etapaActual;

  const enviarSemilla = async () => {
    if (!leadId || !puedeAvanzar) return;
    setEnviando(true);
    setError("");
    try {
      const res = await fetch(`/api/seti/lead/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(semilla),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      setPaso("generando");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  useEffect(() => {
    if (paso !== "generando" || !leadId || yaGenero.current) return;
    yaGenero.current = true;

    const minDelay = new Promise((resolve) => setTimeout(resolve, 4200)); // así se siente el proceso, aunque la API responda antes
    const llamada = fetch(`/api/seti/lead/${leadId}/generar`, { method: "POST" }).then((r) => r.json());

    Promise.all([llamada, minDelay])
      .then(([data]) => {
        if (data.error) throw new Error(data.error);
        setVistaPrevia(data);
        setPaso("preview");
      })
      .catch((err) => {
        setError(err.message || "No pudimos generar la vista previa. Probá de nuevo.");
        setPaso("semilla");
        yaGenero.current = false;
      });
  }, [paso, leadId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6 py-16">
      <div className={`w-full ${paso === "preview" ? "max-w-2xl" : "max-w-lg"}`}>
        <div className="text-2xl font-black mb-8 text-center">
          seti<span className="text-cyan-400">.ia</span>
        </div>

        <div className="flex gap-2 mb-8">
          {(["form", "semilla", "generando", "preview"] as Paso[]).map((p, i) => {
            const orden: Paso[] = ["form", "semilla", "generando", "preview"];
            const activo = orden.indexOf(paso) >= i;
            return <div key={p} className={`h-1 flex-1 rounded-full ${activo ? "bg-cyan-400" : "bg-slate-800"}`} />;
          })}
        </div>

        {paso === "form" && (
          <form onSubmit={enviarDatos} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
            <h1 className="text-xl font-bold text-white mb-1">Probá tu idea gratis</h1>
            <p className="text-sm text-slate-500 mb-6">Armá una vista previa de tu app en minutos. Primero, contanos quién sos.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Nombre *</label>
                <input
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-cyan-500"
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Email</label>
                <input
                  type="email"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-cyan-500"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase mb-1">WhatsApp</label>
                <input
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-cyan-500"
                  placeholder="+54 9 11..."
                  value={form.whatsapp}
                  onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                />
              </div>
            </div>
            {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
            <button
              type="submit"
              disabled={enviando}
              className="w-full mt-6 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl transition-colors"
            >
              {enviando ? "Un momento..." : "Empezar →"}
            </button>
            <p className="text-[11px] text-slate-600 mt-3 text-center">Usamos tus datos solo para acompañarte con esto. Nada de spam.</p>
          </form>
        )}

        {paso === "semilla" && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
            <h1 className="text-xl font-bold text-white mb-1">Contanos un poco más</h1>
            <p className="text-sm text-slate-500 mb-6">Con esto armamos algo mucho más ajustado a lo que necesitás.</p>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase mb-2">¿Qué tipo de negocio tenés?</label>
                <div className="grid grid-cols-2 gap-2">
                  {TIPOS_NEGOCIO.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSemilla((s) => ({ ...s, tipoNegocio: t.id }))}
                      className={`text-sm px-3 py-2.5 rounded-lg border text-left transition-colors ${
                        semilla.tipoNegocio === t.id ? "bg-cyan-500/15 border-cyan-500 text-cyan-400" : "border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase mb-2">¿Qué querés lograr?</label>
                <div className="flex flex-col gap-2">
                  {OBJETIVOS.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setSemilla((s) => ({ ...s, objetivoSemilla: o.id }))}
                      className={`text-sm px-3 py-2.5 rounded-lg border text-left transition-colors ${
                        semilla.objetivoSemilla === o.id ? "bg-cyan-500/15 border-cyan-500 text-cyan-400" : "border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase mb-2">¿Ya tenés algo armado?</label>
                <div className="flex gap-2">
                  {ETAPAS.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => setSemilla((s) => ({ ...s, etapaActual: e.id }))}
                      className={`flex-1 text-sm px-3 py-2.5 rounded-lg border transition-colors ${
                        semilla.etapaActual === e.id ? "bg-cyan-500/15 border-cyan-500 text-cyan-400" : "border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase mb-2">
                  Contanos en pocas palabras qué necesitás <span className="text-slate-700">(opcional)</span>
                </label>
                <textarea
                  maxLength={150}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-cyan-500 min-h-[70px]"
                  placeholder="ej. una página simple para mostrar mis tortas y que me escriban por WhatsApp"
                  value={semilla.detalleLibre}
                  onChange={(e) => setSemilla((s) => ({ ...s, detalleLibre: e.target.value }))}
                />
                <p className="text-[11px] text-slate-700 mt-1 text-right">{semilla.detalleLibre.length}/150</p>
              </div>
            </div>
            {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
            <button
              onClick={enviarSemilla}
              disabled={!puedeAvanzar || enviando}
              className="w-full mt-6 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 text-slate-950 font-bold py-3 rounded-xl transition-colors"
            >
              {enviando ? "Guardando..." : "Ver mi vista previa →"}
            </button>
          </div>
        )}

        {paso === "generando" && <AnimacionGenerando />}

        {paso === "preview" && vistaPrevia && (
          <div>
            <BrowserFrame>
              {vistaPrevia.tipo === "landing" ? <LandingPreview v={vistaPrevia} /> : <EcommercePreview v={vistaPrevia} />}
            </BrowserFrame>
            <div className="text-center mt-6">
              <p className="text-slate-500 text-sm mb-3">Esto es solo el punto de partida — lo armamos de verdad, a tu medida.</p>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`¡Hola! Probé la vista previa de Seti y quiero avanzar con esto de verdad. Mi idea: ${semilla.detalleLibre || semilla.tipoNegocio}`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition-colors"
              >
                Quiero esto de verdad →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
