import { NextRequest, NextResponse } from "next/server";
import { getTicketsCol } from "@/lib/firebaseAdmin";
import { uploadToImgbb } from "@/lib/imgbb";
import type { AdjuntoTicket } from "@/lib/types";

// OJO: esto solo acepta IMÁGENES (screenshots, mockups, fotos) -- usa
// ImgBB, que es lo único que ya está conectado en este proyecto para
// subir archivos. No hay forma de adjuntar PDFs, Word, etc. sin sumar
// otro servicio de almacenamiento (ej. Firebase Storage) que hoy no
// está configurado acá.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ref = getTicketsCol().doc(id);
    const doc = await ref.get();
    if (!doc.exists) return NextResponse.json({ error: "No encontramos ese ticket." }, { status: 404 });

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Falta el archivo." }, { status: 400 });
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Por ahora solo se pueden adjuntar imágenes." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadToImgbb(buffer, file.name || "adjunto");

    const nuevoAdjunto: AdjuntoTicket = {
      id: crypto.randomUUID(),
      url: uploaded.url,
      nombre: file.name || "imagen",
      createdAt: Date.now(),
    };

    const actuales: AdjuntoTicket[] = (doc.data()?.adjuntos as AdjuntoTicket[]) || [];
    const adjuntos = [...actuales, nuevoAdjunto];
    await ref.update({ adjuntos, updatedAt: Date.now() });

    return NextResponse.json({ adjuntos });
  } catch (err) {
    console.error("Error en POST /api/admin/tickets-dev/[id]/adjuntos:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
