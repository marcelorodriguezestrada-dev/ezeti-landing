import { NextRequest, NextResponse } from "next/server";
import { getImagesCol } from "@/lib/firebaseAdmin";
import { uploadToImgbb } from "@/lib/imgbb";
import { optimizeImage } from "@/lib/imageOptimize";
import type { MediaImage } from "@/lib/types";

export async function GET() {
  try {
    // ImgBB no ofrece un endpoint para "listar mis imágenes" solo con la
    // API key (eso requiere login en el sitio) -- por eso mantenemos
    // nuestra propia biblioteca en Firestore como fuente de verdad.
    const snap = await getImagesCol().orderBy("createdAt", "desc").limit(200).get();
    const images: MediaImage[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MediaImage, "id">) }));
    return NextResponse.json(images);
  } catch (err) {
    console.error("Error en GET /api/admin/media:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const preset = (form.get("preset") as string) || "original";

    if (!file) {
      return NextResponse.json({ error: "Falta el archivo de imagen." }, { status: 400 });
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const { buffer, width, height, sizeBytes } = await optimizeImage(inputBuffer, preset);

    const filename = (file.name || "imagen").replace(/\.[^.]+$/, "") + ".webp";
    const uploaded = await uploadToImgbb(buffer, filename);

    const doc = {
      url: uploaded.url,
      thumbUrl: uploaded.thumbUrl,
      deleteUrl: uploaded.deleteUrl,
      width,
      height,
      sizeBytes,
      preset,
      createdAt: Date.now(),
    };

    const ref = await getImagesCol().add(doc);
    return NextResponse.json({ id: ref.id, ...doc });
  } catch (err) {
    console.error("Error en POST /api/admin/media:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
