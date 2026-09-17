"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import type { ProyectoDev, TicketDev, EstadoTicketDev } from "@/lib/types";

const ESTADO_LABEL: Record<EstadoTicketDev, { label: string; color: string }> = {
  pendiente: { label: "Pendiente", color: "bg-slate-100 text-slate-600" },
  en_progreso: { label: "En progreso", color: "bg-cyan-100 text-cyan-700" },
  bloqueado: { label: "Bloqueado", color: "bg-red-100 text-red-700" },
  hecho: { label: "Hecho", color: "bg-emerald-100 text-emerald-700" },
};

function fmtFecha(ts: number | null) {
  if (!ts) return "Sin fecha definida";
  return new Date(ts).toLocaleDateString("es-BO", { day: "2-digit", month: "long", year: "numeric" });
}

export default function ProyectoPublicoPage() {
  const params = useParams();
  const id = params.id as string;

  const [proyecto, setProyecto] = useState<ProyectoDev | null>(null);
  const [tickets, setTickets] = useState<TicketDev[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [solicitadoPor, setSolicitadoPor] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(`/api/proyecto-publico/${id}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setProyecto(data.proyecto);
      setTickets(data.tickets);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const enviarTicket = async () => {
    if (!nuevoTitulo.trim()) return;
    setEnviando(true);
    try {
      const res = await fetch(`/api/proyecto-publico/${id}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: nuevoTitulo, descripcion: nuevaDescripcion, solicitadoPor }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTickets((prev) => [data, ...prev]);
      setNuevoTitulo("");
      setNuevaDescripcion("");
      setEnviado(true);
      setTimeout(() => setEnviado(false), 3000);
      setMostrarForm(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-sm">Cargando...</div>;
  }

  if (error && !proyecto) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm">{error}</div>;
  }

  if (!proyecto) return null;

  const pct = tickets.length === 0 ? 0 : Math.round((tickets.filter((t) => t.estado === "hecho").length / tickets.length) * 100);
  const vencido = !!proyecto.fechaEntrega && proyecto.fechaEntrega < Date.now() && pct < 100;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-5">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
          <div className="text-xs font-mono text-cyan-600 font-bold mb-1">EZETI · Estado del proyecto</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">{proyecto.nombre}</h1>
          {proyecto.cliente && <p className="text-slate-500 text-sm mb-3">Cliente: {proyecto.cliente}</p>}
          {proyecto.descripcion && <p className="text-slate-600 text-sm mb-4">{proyecto.descripcion}</p>}

          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">{pct}% completado</span>
            <span className={["text-sm font-semibold", vencido ? "text-red-600" : "text-slate-500"].join(" ")}>
              📅 Entrega: {fmtFecha(proyecto.fechaEntrega)}
              {vencido && " — vencida"}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className={["h-full rounded-full transition-all", pct === 100 ? "bg-emerald-500" : "bg-cyan-500"].join(" ")}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-xs text-slate-400 mt-1.5">
            {tickets.filter((t) => t.estado === "hecho").length} de {tickets.length} tareas completadas
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800">Tareas</h2>
          <button
            onClick={() => setMostrarForm((v) => !v)}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            {mostrarForm ? "Cancelar" : "+ Pedir algo nuevo"}
          </button>
        </div>

        {enviado && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg p-3 mb-3">
            ✓ Listo, lo agregamos a la lista.
          </div>
        )}
        {error && proyecto && <div className="text-red-600 text-sm mb-3">{error}</div>}

        {mostrarForm && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-3 shadow-sm">
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              placeholder="¿Qué necesitás? (título corto)"
              value={nuevoTitulo}
              onChange={(e) => setNuevoTitulo(e.target.value)}
            />
            <textarea
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Detalle (opcional)"
              rows={2}
              value={nuevaDescripcion}
              onChange={(e) => setNuevaDescripcion(e.target.value)}
            />
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Tu nombre (opcional)"
              value={solicitadoPor}
              onChange={(e) => setSolicitadoPor(e.target.value)}
            />
            <button
              onClick={enviarTicket}
              disabled={enviando || !nuevoTitulo.trim()}
              className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white font-bold text-sm px-4 py-2 rounded-lg"
            >
              {enviando ? "Enviando..." : "Enviar"}
            </button>
          </div>
        )}

        <div className="space-y-2">
          {tickets.length === 0 && <div className="text-slate-400 text-sm">Todavía no hay tareas cargadas.</div>}
          {tickets.map((t) => (
            <div key={t.id} className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className={["font-semibold text-sm", t.estado === "hecho" ? "text-slate-400 line-through" : "text-slate-800"].join(" ")}>
                  {t.titulo}
                </div>
                {t.descripcion && <p className="text-slate-400 text-xs mt-0.5">{t.descripcion}</p>}
              </div>
              <span className={["text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0", ESTADO_LABEL[t.estado].color].join(" ")}>
                {ESTADO_LABEL[t.estado].label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
