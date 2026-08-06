import { NextRequest, NextResponse } from "next/server";
import { getImagesCol } from "@/lib/firebaseAdmin";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const doc = await getImagesCol().doc(id).get();

    if (doc.exists) {
      const deleteUrl = doc.data()?.deleteUrl as string | undefined;
      // Best-effort: el delete_url de ImgBB está pensado para abrirse desde
      // un navegador logueado. Llamarlo server-side puede no borrar la
      // imagen del lado de ImgBB (queda huérfana ahí, pero inofensiva y sin
      // costo). Lo intentamos igual; lo que sí es 100% seguro es que deja
      // de aparecer en tu biblioteca.
      if (deleteUrl) {
        fetch(deleteUrl).catch(() => {});
      }
    }

    await getImagesCol().doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error en DELETE /api/admin/media/[id]:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
