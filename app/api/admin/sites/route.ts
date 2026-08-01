import { NextRequest, NextResponse } from "next/server";
import { getSitesCol, admin } from "@/lib/firebaseAdmin";
import type { Site } from "@/lib/types";

// Seed inicial -- solo se usa si la colección "sites" está vacía (primera
// vez). A partir de ahí, todo se gestiona desde el panel, esto no se vuelve
// a tocar nunca más automáticamente.
const SEED: Omit<Site, "id" | "activo" | "createdAt">[] = [
  { emoji: "🌐", nombre: "Ezeti (landing principal)", descripcion: "Ezeti — estudio de soluciones con IA para empresas", temaNegocio: "", publico: "dueños de PyMEs y emprendedores que quieren digitalizar procesos con IA", objetivoSugerido: "generar consultas de nuevos clientes", url: "https://www.ezeti.pro/" },
  { emoji: "🔍", nombre: "AuditIA", descripcion: "AuditIA — auditoría forense con IA para detectar irregularidades, fraude y pagos sospechosos", temaNegocio: "", publico: "administradores de consorcios y responsables financieros", objetivoSugerido: "conseguir demos agendadas", url: "https://auditia-consorcial.onrender.com/overview" },
  { emoji: "🏃", nombre: "PaceAI", descripcion: "PaceAI — coaching deportivo con planes personalizados y métricas generadas por IA", temaNegocio: "El placer de correr: cómo entrenar sin lesionarte, mejorar tu marca personal y disfrutar cada carrera", publico: "corredores que entrenan para una carrera", objetivoSugerido: "conseguir nuevos usuarios registrados", url: "https://paceia.ezeti.pro" },
  { emoji: "🩺", nombre: "Consultorio Dra. Verónica", descripcion: "Consultorio Dra. Verónica — mejora la comunicación con pacientes", temaNegocio: "Cuidar tu salud sin miedo: cercanía, escucha y confianza en cada consulta", publico: "pacientes actuales y potenciales del consultorio", objetivoSugerido: "generar turnos e interacción con pacientes", url: "https://consultorio-dra-veronica.vercel.app/" },
  { emoji: "🥚", nombre: "Incubadora AI", descripcion: "Incubadora AI — descubrí hipótesis, oportunidades y caminos de negocio con IA", temaNegocio: "", publico: "emprendedores en etapa de idea", objetivoSugerido: "conseguir usuarios probando la herramienta", url: "https://incubadora-ai-frontend.onrender.com/" },
  { emoji: "🌱", nombre: "Semilla AI", descripcion: "Semilla AI — roadmap de desarrollo generado por IA para tu proyecto", temaNegocio: "", publico: "emprendedores que ya tienen una idea validada", objetivoSugerido: "conseguir usuarios probando la herramienta", url: "https://semillai-c0y1.onrender.com/dashboard" },
  { emoji: "🪱", nombre: "Tierra Viva", descripcion: "Tierra Viva — e-commerce con IA para vender y escalar sin perder identidad de marca", temaNegocio: "Lombrices californianas y compost casero para tu huerta — cómo tener plantas sanas, tierra viva y ser feliz cuidando lo que plantás", publico: "personas que tienen huerta o jardín en casa y quieren cuidarlo de forma natural", objetivoSugerido: "conseguir primeras ventas", url: "https://tierraviva.ezeti.pro/" },
  { emoji: "💼", nombre: "JobTrack AI", descripcion: "JobTrack AI — organizá tu búsqueda laboral con scraping e IA", temaNegocio: "", publico: "profesionales buscando trabajo activamente", objetivoSugerido: "conseguir usuarios probando la herramienta", url: "https://jobtrack-ai-frontend.onrender.com/" },
];

export async function GET() {
  try {
    const col = getSitesCol();
    let snap = await col.orderBy("createdAt", "asc").get();

    if (snap.empty) {
      const batch = admin.firestore().batch();
      for (const s of SEED) {
        batch.set(col.doc(), { ...s, activo: true, createdAt: Date.now() });
      }
      await batch.commit();
      snap = await col.orderBy("createdAt", "asc").get();
    }

    const sites = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Site[];
    return NextResponse.json(sites);
  } catch (err) {
    console.error("Error en GET /api/admin/sites:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { emoji, nombre, descripcion, temaNegocio, publico, objetivoSugerido, url } = await req.json();
    if (!nombre || !descripcion || !url) {
      return NextResponse.json({ error: "Faltan campos: nombre, descripcion, url" }, { status: 400 });
    }
    const site = {
      emoji: emoji || "🌐",
      nombre,
      descripcion,
      temaNegocio: temaNegocio || "",
      publico: publico || "",
      objetivoSugerido: objetivoSugerido || "generar consultas de nuevos clientes",
      url,
      activo: true,
      createdAt: Date.now(),
    };
    const doc = await getSitesCol().add(site);
    return NextResponse.json({ id: doc.id, ...site });
  } catch (err) {
    console.error("Error en POST /api/admin/sites:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
