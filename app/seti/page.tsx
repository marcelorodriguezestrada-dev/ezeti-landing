"use client";
import { useState } from "react";

type Paso = "form" | "semilla" | "listo";

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

export default function SetiPage() {
  const [paso, setPaso] = useState<Paso>("form");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

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
      setPaso("listo");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <div className="text-2xl font-black mb-8 text-center">
          seti<span className="text-cyan-400">.ia</span>
        </div>

        {/* Indicador de pasos */}
        <div className="flex gap-2 mb-8">
          {(["form", "semilla", "listo"] as Paso[]).map((p, i) => (
            <div
              key={p}
              className={`h-1 flex-1 rounded-full ${
                paso === p || (paso === "semilla" && i === 0) || (paso === "listo" && i < 2) ? "bg-cyan-400" : "bg-slate-800"
              }`}
            />
          ))}
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

        {paso === "listo" && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">🌱</div>
            <h1 className="text-xl font-bold text-white mb-2">¡Ya tenemos todo!</h1>
            <p className="text-slate-400 text-sm">
              Estamos armando tu vista previa. En un momento la vas a poder ver acá mismo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
