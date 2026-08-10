"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LeadForm() {
  const params = useSearchParams();
  const campaign = params.get("campaign") || "";

  const [form, setForm] = useState({ nombre: "", email: "", whatsapp: "", mensaje: "" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [calLink, setCalLink] = useState<string | null>(null);
  const [cupon, setCupon] = useState<{ code: string; descuentoPct: number } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || (!form.email && !form.whatsapp)) {
      setError("Contanos tu nombre y al menos un dato de contacto (email o WhatsApp).");
      return;
    }
    setEnviando(true);
    setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, campaign }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar");
      setLeadId(data.id);
      if (data.cupon) setCupon(data.cupon);

      const settingsRes = await fetch("/api/settings-public");
      const settings = await settingsRes.json();
      setCalLink(settings.calLink || null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  if (leadId) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-white mb-3">¡Recibimos tus datos!</h1>
          <p className="text-slate-400 mb-8">
            Ya tenemos tu consulta. Si querés, agendá directamente una videollamada para charlar sobre tu necesidad puntual:
          </p>

          {cupon && (
            <div className="mb-8 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-6">
              <p className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">Tu cupón de descuento</p>
              <p className="text-3xl font-black text-white tracking-widest mb-2">{cupon.code}</p>
              <p className="text-sm text-slate-400">Presentalo en el local para tu <b className="text-cyan-400">{cupon.descuentoPct}% off</b>.</p>
            </div>
          )}
          {calLink ? (
            <a
              href={`/api/lead-schedule/${leadId}`}
              className="inline-block bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-8 py-4 rounded-xl text-lg transition-colors"
            >
              📅 Agendar videollamada
            </a>
          ) : (
            <p className="text-slate-500 text-sm">Te vamos a contactar a la brevedad.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6 py-16">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
        <div className="text-2xl font-black mb-2">
          ezeti<span className="text-cyan-400">.pro</span>
        </div>
        <h1 className="text-xl font-bold text-white mb-1">Contanos tu necesidad</h1>
        <p className="text-sm text-slate-500 mb-6">Te respondemos a la brevedad.</p>

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
          <div>
            <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Contanos brevemente qué necesitás</label>
            <textarea
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-cyan-500 min-h-[90px]"
              value={form.mensaje}
              onChange={(e) => setForm((f) => ({ ...f, mensaje: e.target.value }))}
            />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold py-3.5 rounded-lg mt-6 transition-colors"
        >
          {enviando ? "Enviando…" : "Enviar"}
        </button>
      </form>
    </div>
  );
}

export default function LeadPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <LeadForm />
    </Suspense>
  );
}
