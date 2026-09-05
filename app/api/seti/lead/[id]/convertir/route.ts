import { NextRequest, NextResponse } from "next/server";
import { getLeadsCol, getProspectosCol } from "@/lib/firebaseAdmin";
import type { Lead } from "@/lib/types";

const TIPO_NEGOCIO_LABELS: Record<string, string> = {
  comercio: "Comercio / Tienda",
  servicio: "Servicio profesional",
  evento: "Evento",
  otro: "Otro",
};

const OBJETIVO_LABELS: Record<string, string> = {
  vender: "Vender productos online",
  captar: "Captar más clientes",
  organizar: "Organizar turnos, inventario o pedidos",
  mostrar: "Mostrar su trabajo",
};

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const leadRef = getLeadsCol().doc(id);
    const snap = await leadRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "No encontramos ese lead." }, { status: 404 });
    }
    const lead = snap.data() as Lead;

    // Idempotente: si ya se convirtió antes (por ejemplo, doble click), no duplicamos.
    if (lead.convertidoAProspectoId) {
      return NextResponse.json({ prospectoId: lead.convertidoAProspectoId, yaExistia: true });
    }

    const nombreNegocioGenerado = lead.vistaPreviaGenerada?.nombreNegocio;
    const taglineGenerado = lead.vistaPreviaGenerada?.tagline;

    const notas = [
      `Rubro: ${TIPO_NEGOCIO_LABELS[lead.tipoNegocio || ""] || "no especificado"}`,
      `Objetivo: ${OBJETIVO_LABELS[lead.objetivoSemilla || ""] || "no especificado"}`,
      `Etapa: ${lead.etapaActual === "cero" ? "arranca de cero" : lead.etapaActual === "mejorar" ? "ya tiene algo y quiere mejorarlo" : "no especificado"}`,
      lead.detalleLibre ? `Detalle que dio la persona: "${lead.detalleLibre}"` : null,
      nombreNegocioGenerado ? `Vista previa generada: "${nombreNegocioGenerado}" — ${taglineGenerado || ""}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const now = Date.now();
    const prospecto = {
      leadId: id,
      nombre: lead.nombre,
      empresa: "",
      cargo: "",
      contexto: "Web interactiva Seti",
      linkedinUrl: "",
      sitioWebEmpresa: "",
      productoOfrecido: `Seti — ${TIPO_NEGOCIO_LABELS[lead.tipoNegocio || ""] || "producto interactivo"}`,
      notasEncuentro: notas,
      analisisIA: null,
      propuestaIA: null,
      mensajeSugerido: null,
      proximoPasoIA: null,
      status: "contactado" as const, // ya nos escribió por WhatsApp, no es "nuevo" sin más
      seguimiento: [{ texto: "Se contactó desde la web interactiva de Seti y pidió avanzar.", fecha: now }],
      createdAt: now,
      updatedAt: now,
    };

    const doc = await getProspectosCol().add(prospecto);
    await leadRef.update({ convertidoAProspectoId: doc.id, status: "contactado" });

    return NextResponse.json({ prospectoId: doc.id, yaExistia: false });
  } catch (err) {
    console.error("Error en /api/seti/lead/[id]/convertir:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
